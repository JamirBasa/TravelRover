/**
 * PlacesToVisit Component - Travel Itinerary with Per-Day Editing
 *
 * COMPONENTIZED VERSION:
 * ♻️ Refactored into smaller, reusable components
 * 🧩 Modular architecture for better maintainability
 * 🎯 Focused single-responsibility components
 *
 * KEY FEATURES:
 * ✅ Per-day editing (only one day editable at a time)
 * ✅ Expand/collapse individual days
 * ✅ Inline editing with auto-save functionality
 * ✅ Auto-expand day when starting edit
 * ✅ Prevent collapse while editing
 * ✅ Proper data source management (original vs editable)
 * ✅ Error handling and safe defaults
 * ✅ Accessibility-focused interactions
 * ✅ Firebase database persistence for all changes
 */

import React, {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { toast } from "sonner";

// ✅ Import production logging
import { logDebug, logError } from "@/utils/productionLogger";

// Component imports - Clean imports using index file
import {
  TripOverviewStats,
  PlacesToVisitSection,
  BudgetBreakdown,
  ItineraryNavigationHelper,
  ItineraryHeader,
  DayHeader,
  DayActivities,
  TravelTipsSection,
  EmptyStateComponent,
} from "./index";

// Main Component
const PlacesToVisit = forwardRef(({ trip, onTripUpdate }, ref) => {
  // Enhanced state management for per-day editing functionality
  const [editingDay, setEditingDay] = useState(null); // null or dayIndex number
  const [editableItinerary, setEditableItinerary] = useState([]);
  const [expandedDays, setExpandedDays] = useState(new Set());

  // ✅ Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    expandAndFocusDay: (dayIndex = 0) => {
      logDebug("PlacesToVisit", "expandAndFocusDay called", { dayIndex });

      // Expand the specified day
      const newExpanded = new Set(expandedDays);
      newExpanded.add(dayIndex);
      setExpandedDays(newExpanded);

      // Scroll to the day after a short delay
      setTimeout(() => {
        const dayElement = document.querySelector(
          `[data-day-index="${dayIndex}"]`
        );
        if (dayElement) {
          dayElement.scrollIntoView({ behavior: "smooth", block: "start" });
          logDebug("PlacesToVisit", "Scrolled to day successfully", {
            dayIndex,
          });
        }
      }, 300);

      // Show helpful toast
      toast.info("Click 'Edit' on any day to modify activities", {
        duration: 4000,
      });
    },
  }));

  // Clean data parsing utility (removed console.log for production)
  const parseDataArray = (data, fieldName) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Smart parsing for malformed JSON
        try {
          const cleanedData = data.trim();

          if (cleanedData.startsWith("{") && !cleanedData.startsWith("[")) {
            const parts = [];
            let currentObject = "";
            let braceCount = 0;
            let inString = false;
            let escapeNext = false;

            for (let i = 0; i < cleanedData.length; i++) {
              const char = cleanedData[i];

              if (escapeNext) {
                currentObject += char;
                escapeNext = false;
                continue;
              }

              if (char === "\\") {
                escapeNext = true;
                currentObject += char;
                continue;
              }

              if (char === '"' && !escapeNext) {
                inString = !inString;
              }

              if (!inString) {
                if (char === "{") {
                  braceCount++;
                } else if (char === "}") {
                  braceCount--;
                }
              }

              currentObject += char;

              if (!inString && braceCount === 0 && currentObject.trim()) {
                parts.push(currentObject.trim());
                currentObject = "";
              }
            }

            if (currentObject.trim()) {
              parts.push(currentObject.trim());
            }

            const parsedObjects = parts
              .map((part) => {
                try {
                  return JSON.parse(part);
                } catch {
                  return null;
                }
              })
              .filter(Boolean);

            return parsedObjects.length > 0
              ? parsedObjects
              : [{ error: "Unable to parse data" }];
          }

          const fallbackParsed = JSON.parse(`[${cleanedData}]`);
          return Array.isArray(fallbackParsed)
            ? fallbackParsed
            : [fallbackParsed];
        } catch {
          return [
            {
              error: `Failed to parse ${fieldName}`,
              rawData: data.substring(0, 100) + "...",
            },
          ];
        }
      }
    }

    return Array.isArray(data) ? data : [data];
  };

  // Parse itinerary data with enhanced error handling (memoized to prevent infinite loops)
  // Include trip.id in dependencies to ensure re-parse when trip data is refreshed
  const parsedItinerary = useMemo(() => {
    logDebug("PlacesToVisit", "Parsing itinerary data", {
      hasItinerary: !!trip?.tripData?.itinerary,
      type: typeof trip?.tripData?.itinerary,
    });
    return parseDataArray(trip?.tripData?.itinerary, "itinerary");
  }, [trip?.tripData?.itinerary, trip?.id]);

  // Calculate trip statistics (memoized)
  const { totalDays, totalActivities } = useMemo(() => {
    const days = parsedItinerary ? parsedItinerary.length : 0;
    const activities = parsedItinerary
      ? parsedItinerary.reduce((sum, day) => {
          if (day?.plan?.length) return sum + day.plan.length;
          if (day?.planText) return sum + day.planText.split(" | ").length;
          return sum;
        }, 0)
      : 0;

    return { totalDays: days, totalActivities: activities };
  }, [parsedItinerary]);

  // Enhanced places to visit data parsing (memoized)
  const parsedPlacesToVisit = useMemo(() => {
    return parseDataArray(trip?.tripData?.placesToVisit, "placesToVisit");
  }, [trip?.tripData?.placesToVisit]);

  // Initialize editable itinerary on mount or when trip changes
  useEffect(() => {
    if (parsedItinerary && Array.isArray(parsedItinerary)) {
      logDebug("PlacesToVisit", "Updating editableItinerary with fresh data", {
        dayCount: parsedItinerary.length,
      });

      // Map each day and ensure plan array exists and has priority
      const updatedEditableItinerary = parsedItinerary.map((day, index) => {
        let planArray = [];

        // Priority 1: Use existing plan array if it has data
        if (day?.plan && Array.isArray(day.plan) && day.plan.length > 0) {
          planArray = day.plan;
          logDebug("PlacesToVisit", "Day has plan array", {
            dayNumber: index + 1,
            activityCount: planArray.length,
          });
        }
        // Priority 2: Parse from planText if plan is empty
        else if (day?.planText && typeof day.planText === "string") {
          planArray = day.planText.split(" | ").map((activity, actIndex) => {
            const timeMatch = activity.match(/^(\d{1,2}:\d{2} [AP]M)/);
            const time = timeMatch ? timeMatch[1] : "";
            const content = time
              ? activity.replace(time + " - ", "")
              : activity;

            return {
              time: time || "All Day",
              placeName: content.split(" - ")[0] || "Activity",
              placeDetails: content,
              imageUrl: "",
              geoCoordinates: { latitude: 0, longitude: 0 },
              ticketPricing: "₱0",
              timeTravel: "Varies",
              rating: "4.0",
              id: `${index}-${actIndex}`,
            };
          });
          logDebug("PlacesToVisit", "Day parsed from planText", {
            dayNumber: index + 1,
            activityCount: planArray.length,
          });
        }

        return {
          ...day,
          plan: planArray,
        };
      });

      setEditableItinerary(updatedEditableItinerary);
    }
  }, [parsedItinerary]);

  // Expand/collapse functionality
  const toggleDayExpanded = (dayIndex) => {
    if (editingDay === dayIndex) return; // Prevent collapse while editing

    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayIndex)) {
      newExpanded.delete(dayIndex);
    } else {
      newExpanded.add(dayIndex);
    }
    setExpandedDays(newExpanded);
  };

  // Enhanced editing functions
  const startEditingDay = (dayIndex) => {
    setEditingDay(dayIndex);
    // Auto-expand when starting edit
    const newExpanded = new Set(expandedDays);
    newExpanded.add(dayIndex);
    setExpandedDays(newExpanded);
  };

  const stopEditingDay = () => {
    setEditingDay(null);
  };

  const saveEditedDay = async (dayIndex) => {
    try {
      // Get the trip ID from the trip object
      const tripId = trip?.id;

      if (!tripId) {
        toast.error("Cannot save changes", {
          description: "Trip ID not found. Please refresh the page.",
        });
        return;
      }

      // Show saving toast
      const savingToast = toast.loading("Saving changes to database...");

      // Update the parsedItinerary with editableItinerary changes
      const updatedItinerary = [...parsedItinerary];
      updatedItinerary[dayIndex] = {
        ...updatedItinerary[dayIndex],
        ...editableItinerary[dayIndex],
      };

      // Save to Firebase
      const docRef = doc(db, "AITrips", tripId);
      await updateDoc(docRef, {
        "tripData.itinerary": updatedItinerary,
      });

      // Dismiss loading toast and show success
      toast.dismiss(savingToast);
      toast.success("Changes saved successfully!", {
        description: `Day ${dayIndex + 1} has been updated in the database.`,
      });

      // Stop editing mode
      setEditingDay(null);

      // Refresh trip data from database to reflect the saved changes
      if (onTripUpdate) {
        await onTripUpdate();
        logDebug(
          "PlacesToVisit",
          "Day saved and trip data refreshed from database",
          {
            dayNumber: dayIndex + 1,
          }
        );
      } else {
        logDebug("PlacesToVisit", "Day saved to database", {
          dayNumber: dayIndex + 1,
        });
      }
    } catch (error) {
      logError("PlacesToVisit", "Failed to save edited day", {
        error: error.message,
        dayNumber: dayIndex + 1,
      });
      toast.error("Failed to save changes", {
        description: "Please try again or check your internet connection.",
      });
    }
  };

  // Activity management functions
  const updateActivities = (dayIndex, activities) => {
    const newEditableItinerary = [...editableItinerary];
    newEditableItinerary[dayIndex] = {
      ...newEditableItinerary[dayIndex],
      plan: activities,
    };
    setEditableItinerary(newEditableItinerary);
  };

  const saveActivitiesChanges = async (dayIndex, activities) => {
    try {
      // Get the trip ID from the trip object
      const tripId = trip?.id;

      if (!tripId) {
        toast.error("Cannot save activities", {
          description: "Trip ID not found. Please refresh the page.",
        });
        return { success: false };
      }

      // Update local state first for immediate UI feedback
      updateActivities(dayIndex, activities);

      // Prepare updated itinerary
      const updatedItinerary = [...parsedItinerary];
      updatedItinerary[dayIndex] = {
        ...updatedItinerary[dayIndex],
        plan: activities,
      };

      // Save to Firebase
      const docRef = doc(db, "AITrips", tripId);
      await updateDoc(docRef, {
        "tripData.itinerary": updatedItinerary,
      });

      logDebug("PlacesToVisit", "Activities saved to database", {
        dayNumber: dayIndex + 1,
        activityCount: activities.length,
      });

      // Refresh trip data from database to reflect the saved changes
      // Note: We do this silently without blocking the UI since updateActivities already updated local state
      if (onTripUpdate) {
        onTripUpdate().then(() => {
          logDebug(
            "PlacesToVisit",
            "Trip data refreshed from database after activity save"
          );
        });
      }

      return { success: true };
    } catch (error) {
      logError("PlacesToVisit", "Failed to save activities", {
        error: error.message,
        dayNumber: dayIndex + 1,
      });
      toast.error("Failed to save activities", {
        description:
          "Your changes are temporarily saved locally. Please try saving again.",
      });
      return { success: false };
    }
  };

  // Early return for loading or empty states
  if (!trip?.tripData) {
    return <EmptyStateComponent message="No trip data available" />;
  }

  if (
    !parsedItinerary ||
    !Array.isArray(parsedItinerary) ||
    parsedItinerary.length === 0
  ) {
    return (
      <EmptyStateComponent message="No itinerary data available for this trip" />
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Trip Overview Stats */}
      <TripOverviewStats
        trip={trip}
        totalDays={totalDays}
        totalActivities={totalActivities}
        currentItinerary={parsedItinerary}
        placesToVisit={parsedPlacesToVisit}
      />

      {/* Must-Visit Places Section with Images */}
      {parsedPlacesToVisit && parsedPlacesToVisit.length > 0 && (
        <PlacesToVisitSection placesToVisit={parsedPlacesToVisit} />
      )}

      {/* Budget Breakdown Section */}
      <BudgetBreakdown trip={trip} className="mb-8" />

      {/* Daily Itinerary Header */}
      <ItineraryHeader />

      {/* Usage Instructions */}
      <ItineraryNavigationHelper editingDay={editingDay} />

      {/* Main Itinerary Section */}
      <div className="space-y-6 w-full">
        <div className="space-y-4 w-full">
          {parsedItinerary.map((dayItem, dayIndex) => {
            // Use editableItinerary if available (has parsed plan array), otherwise use parsedItinerary
            const displayDayItem = editableItinerary[dayIndex] || dayItem;

            return (
              <div
                key={dayIndex}
                data-day-index={dayIndex}
                className="bg-white dark:bg-slate-900 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden w-full"
              >
                {/* Day Header */}
                <DayHeader
                  dayItem={displayDayItem}
                  dayIndex={dayIndex}
                  isExpanded={expandedDays.has(dayIndex)}
                  isEditing={editingDay === dayIndex}
                  onToggleExpanded={() => toggleDayExpanded(dayIndex)}
                  onStartEdit={() => startEditingDay(dayIndex)}
                  onStopEdit={stopEditingDay}
                  onSaveEdit={() => saveEditedDay(dayIndex)}
                  totalDays={totalDays}
                  currentItinerary={parsedItinerary}
                  trip={trip}
                />

                {/* Day Activities */}
                {expandedDays.has(dayIndex) && (
                  <DayActivities
                    dayItem={displayDayItem}
                    dayIndex={dayIndex}
                    editingDay={editingDay}
                    editableItinerary={editableItinerary}
                    onUpdateActivities={(activities) =>
                      updateActivities(dayIndex, activities)
                    }
                    onSaveChanges={(activities) =>
                      saveActivitiesChanges(dayIndex, activities)
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Travel Tips */}
      <TravelTipsSection />
    </div>
  );
});

PlacesToVisit.displayName = "PlacesToVisit";

export default PlacesToVisit;
