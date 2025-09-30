import React, { useState, useEffect, useMemo, useCallback } from "react";
import PlaceCardItem from "./PlaceCardItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * @typedef {import('./PlacesToVisit.types.js').Activity} Activity
 * @typedef {import('./PlacesToVisit.types.js').DayItinerary} DayItinerary
 * @typedef {import('./PlacesToVisit.types.js').DragData} DragData
 * @typedef {import('./PlacesToVisit.types.js').SortableActivityProps} SortableActivityProps
 * @typedef {import('./PlacesToVisit.types.js').DroppableDayProps} DroppableDayProps
 */

// Enhanced Sortable Activity Component with accessibility
const SortableActivity = React.memo(
  ({
    activity,
    dayIndex,
    activityIndex,
    isDragging,
    isVisited,
    notes,
    onToggleVisited,
    onUpdateNotes,
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: isSortableDragging,
      over,
    } = useSortable({
      id: `${dayIndex}-${activityIndex}`,
      data: {
        type: "activity",
        dayIndex,
        activityIndex,
        activity,
      },
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isSortableDragging ? 0.5 : 1,
      zIndex: isSortableDragging ? 1000 : 1,
    };

    const isOverDifferentDay =
      over &&
      over.data?.current?.type === "day" &&
      over.data.current.dayIndex !== dayIndex;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group bg-white rounded-lg p-4 sm:p-6 border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-300 relative overflow-hidden ${
          isSortableDragging
            ? "shadow-xl ring-2 ring-blue-400 ring-opacity-75 cursor-grabbing"
            : "cursor-grab"
        } ${
          isOverDifferentDay ? "ring-2 ring-green-400 ring-opacity-50" : ""
        } ${isVisited ? "bg-green-50 border-green-200" : ""}`}
        role="listitem"
        tabIndex={0}
        aria-label={`Activity: ${activity?.placeName || "Activity"} on day ${
          dayIndex + 1
        }, position ${activityIndex + 1}`}
        aria-describedby={`activity-${dayIndex}-${activityIndex}-description`}
        {...attributes}
      >
        {/* Enhanced Drag Handle with ARIA */}
        <div
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          {...listeners}
        >
          <button
            type="button"
            className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
            aria-label={`Drag ${activity?.placeName || "activity"} to reorder`}
            tabIndex={0}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 12 12"
              className="text-blue-600"
            >
              <path
                fill="currentColor"
                d="M2 2h2v2H2V2zm4 0h2v2H6V2zm4 0h2v2h-2V2zM2 6h2v2H2V6zm4 0h2v2H6V6zm4 0h2v2h-2V6zM2 10h2v2H2v-2zm4 0h2v2H6v-2zm4 0h2v2h-2v-2z"
              />
            </svg>
          </button>
        </div>

        {/* Visited Toggle */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisited?.(`${dayIndex}-${activityIndex}`);
            }}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              isVisited
                ? "bg-green-500 border-green-500 text-white"
                : "border-gray-300 hover:border-green-400"
            }`}
            aria-label={`Mark ${activity?.placeName || "activity"} as ${
              isVisited ? "not visited" : "visited"
            }`}
          >
            {isVisited && <span className="text-xs">✓</span>}
          </button>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/30 transition-all duration-300 pointer-events-none rounded-xl"></div>

        <div className="relative">
          <div className="flex gap-5">
            <div className="flex-shrink-0 pt-1">
              <div
                className={`w-4 h-4 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-200 ${
                  isVisited
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500"
                }`}
              ></div>
            </div>

            <div className="flex-1 min-w-0">
              {/* Time badge */}
              {activity?.time && (
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 hover:from-blue-200 hover:to-indigo-200 gap-2 mb-3"
                >
                  <span className="text-blue-600">🕐</span>
                  <span>{activity.time}</span>
                </Badge>
              )}

              {/* Activity title */}
              <h4
                className={`text-lg font-bold mb-2 transition-colors duration-200 flex items-center gap-2 ${
                  isVisited
                    ? "text-green-700 line-through"
                    : "text-gray-900 group-hover:text-blue-600"
                }`}
                id={`activity-${dayIndex}-${activityIndex}-description`}
              >
                <span
                  className={isVisited ? "text-green-500" : "text-blue-500"}
                >
                  📍
                </span>
                <span className="break-words">
                  {activity?.placeName || "Activity"}
                </span>
              </h4>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 leading-relaxed break-words">
                {activity?.placeDetails ||
                  "Discover this amazing location and create unforgettable memories during your visit."}
              </p>

              {/* Notes Section */}
              {notes && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Note: </span>
                    {notes}
                  </p>
                </div>
              )}

              {/* Enhanced badges */}
              <div className="flex flex-wrap items-center gap-2">
                {activity?.ticketPricing && (
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200 gap-1"
                  >
                    <span className="text-green-600">💰</span>
                    <span>{activity.ticketPricing}</span>
                  </Badge>
                )}

                {activity?.timeTravel && (
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 hover:from-orange-200 hover:to-amber-200 gap-1"
                  >
                    <span className="text-orange-600">⏱️</span>
                    <span>{activity.timeTravel}</span>
                  </Badge>
                )}

                {activity?.rating && (
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 hover:from-yellow-200 hover:to-amber-200 gap-1"
                  >
                    <span className="text-yellow-600">⭐</span>
                    <span>{activity.rating}/5 Rating</span>
                  </Badge>
                )}

                {/* Activity type indicator */}
                <Badge
                  variant="secondary"
                  className={`gap-1 ${
                    isVisited
                      ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800"
                      : "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800"
                  }`}
                >
                  <span
                    className={isVisited ? "text-green-600" : "text-purple-600"}
                  >
                    {isVisited ? "✅" : "🎯"}
                  </span>
                  <span>{isVisited ? "Visited" : "Must-See"}</span>
                </Badge>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const note = prompt(
                      "Add a note for this activity:",
                      notes || ""
                    );
                    if (note !== null) {
                      onUpdateNotes?.(`${dayIndex}-${activityIndex}`, note);
                    }
                  }}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-md transition-colors duration-200"
                >
                  📝 {notes ? "Edit Note" : "Add Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SortableActivity.displayName = "SortableActivity";

// Enhanced Droppable Day Container with better accessibility
const DroppableDay = React.memo(
  ({ children, dayIndex, isOver, activityCount }) => {
    const { setNodeRef, isOver: isOverDrop } = useSortable({
      id: `day-${dayIndex}`,
      data: {
        type: "day",
        dayIndex,
      },
    });

    return (
      <div
        ref={setNodeRef}
        className={`ml-7 pl-7 border-l-2 relative transition-all duration-200 ${
          isOverDrop || isOver
            ? "border-blue-400 bg-blue-50/30"
            : "border-gray-100"
        }`}
        role="list"
        aria-label={`Day ${dayIndex + 1} activities (${activityCount} items)`}
      >
        {(isOverDrop || isOver) && (
          <>
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-blue-400 rounded-full shadow-sm animate-pulse"></div>
            <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-400 rounded-full shadow-sm animate-pulse opacity-50"></div>
          </>
        )}
        <div className="space-y-4" role="group">
          {children}
        </div>
        {/* Drop placeholder */}
        {(isOverDrop || isOver) && (
          <div className="mt-4 p-4 border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl text-center">
            <p className="text-blue-600 text-sm font-medium">
              Drop activity here to add to Day {dayIndex + 1}
            </p>
          </div>
        )}
      </div>
    );
  }
);

DroppableDay.displayName = "DroppableDay";

// Performance optimized main component
function PlacesToVisitEnhanced({ trip, onItineraryChange }) {
  // Enhanced state management
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableItinerary, setEditableItinerary] = useState([]);
  const [draggedActivity, setDraggedActivity] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [visitedActivities, setVisitedActivities] = useState(new Set());
  const [activityNotes, setActivityNotes] = useState({});
  const [dragOverDay, setDragOverDay] = useState(null);

  // Optimized sensors with better touch support
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Parse trip data (memoized for performance)
  const { itinerary, placesToVisit } = useMemo(() => {
    const parseDataArray = (data, fieldName) => {
      if (Array.isArray(data)) return data;
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [];
        }
      }
      if (typeof data === "object" && data !== null) return [data];
      return [];
    };

    return {
      itinerary: parseDataArray(trip?.tripData?.itinerary, "itinerary"),
      placesToVisit: parseDataArray(
        trip?.tripData?.placesToVisit,
        "placesToVisit"
      ),
    };
  }, [trip]);

  // Initialize editable itinerary
  useEffect(() => {
    if (itinerary.length > 0) {
      setEditableItinerary(
        itinerary.map((day, index) => ({
          ...day,
          plan: Array.isArray(day.plan) ? day.plan : [],
          day: day.day || index + 1,
        }))
      );
    }
  }, [itinerary]);

  // Optimized drag handlers
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);

    const activeData = active.data.current;
    if (activeData?.type === "activity") {
      setDraggedActivity(activeData.activity);
    }

    // Announce to screen readers
    const activityName = activeData?.activity?.placeName || "activity";
    const dayNum = (activeData?.dayIndex || 0) + 1;
    console.log(`Started dragging ${activityName} from day ${dayNum}`);
  }, []);

  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;

      if (!over) {
        setDragOverDay(null);
        return;
      }

      const activeData = active.data.current;
      const overData = over.data.current;

      if (!activeData || !overData || activeData.type !== "activity") {
        return;
      }

      const activeDayIndex = activeData.dayIndex;
      const activeActivityIndex = activeData.activityIndex;

      let overDayIndex, overActivityIndex;

      if (overData.type === "activity") {
        overDayIndex = overData.dayIndex;
        overActivityIndex = overData.activityIndex;
      } else if (overData.type === "day") {
        overDayIndex = overData.dayIndex;
        overActivityIndex = editableItinerary[overDayIndex]?.plan?.length || 0;
        setDragOverDay(overDayIndex);
      } else {
        return;
      }

      // Don't do anything if we're in the same position
      if (
        activeDayIndex === overDayIndex &&
        activeActivityIndex === overActivityIndex
      ) {
        return;
      }

      setEditableItinerary((prev) => {
        const newItinerary = [...prev];

        // Remove the activity from its current position
        const [movedActivity] = newItinerary[activeDayIndex].plan.splice(
          activeActivityIndex,
          1
        );

        // Insert the activity at the new position
        newItinerary[overDayIndex].plan.splice(
          overActivityIndex,
          0,
          movedActivity
        );

        return newItinerary;
      });
    },
    [editableItinerary]
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;

      setActiveId(null);
      setDraggedActivity(null);
      setDragOverDay(null);

      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (!activeData || !overData || activeData.type !== "activity") return;

      const activeDayIndex = activeData.dayIndex;
      const activeActivityIndex = activeData.activityIndex;

      let overDayIndex, overActivityIndex;

      if (overData.type === "activity") {
        overDayIndex = overData.dayIndex;
        overActivityIndex = overData.activityIndex;
      } else if (overData.type === "day") {
        overDayIndex = overData.dayIndex;
        overActivityIndex = editableItinerary[overDayIndex]?.plan?.length || 0;
      } else {
        return;
      }

      // Only reorder if we're in the same day and different positions
      if (
        activeDayIndex === overDayIndex &&
        activeActivityIndex !== overActivityIndex
      ) {
        setEditableItinerary((prev) => {
          const newItinerary = [...prev];
          const dayPlan = [...newItinerary[activeDayIndex].plan];

          const reorderedPlan = arrayMove(
            dayPlan,
            activeActivityIndex,
            overActivityIndex
          );
          newItinerary[activeDayIndex] = {
            ...newItinerary[activeDayIndex],
            plan: reorderedPlan,
          };

          return newItinerary;
        });
      }

      // Call callback if provided
      onItineraryChange?.(editableItinerary);

      // Announce completion to screen readers
      const activityName = activeData?.activity?.placeName || "activity";
      const newDayNum = overDayIndex + 1;
      console.log(`Moved ${activityName} to day ${newDayNum}`);
    },
    [editableItinerary, onItineraryChange]
  );

  // State management callbacks
  const handleToggleVisited = useCallback((activityId) => {
    setVisitedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  }, []);

  const handleUpdateNotes = useCallback((activityId, note) => {
    setActivityNotes((prev) => ({
      ...prev,
      [activityId]: note,
    }));
  }, []);

  // Calculate statistics (memoized)
  const statistics = useMemo(() => {
    const currentItinerary = isEditMode ? editableItinerary : itinerary;
    const totalActivities = currentItinerary.reduce((total, day) => {
      if (day?.plan && Array.isArray(day.plan)) {
        return total + day.plan.length;
      } else if (day?.planText) {
        return total + day.planText.split(" | ").length;
      }
      return total;
    }, 0);

    const visitedCount = visitedActivities.size;
    const completionRate =
      totalActivities > 0 ? (visitedCount / totalActivities) * 100 : 0;

    return {
      totalActivities,
      visitedCount,
      completionRate,
      totalDays: currentItinerary.length,
    };
  }, [isEditMode, editableItinerary, itinerary, visitedActivities]);

  const currentItinerary = isEditMode ? editableItinerary : itinerary;

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    if (!isEditMode) {
      setEditableItinerary(
        itinerary.map((day, index) => ({
          ...day,
          plan: Array.isArray(day.plan) ? day.plan : [],
          day: day.day || index + 1,
        }))
      );
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, itinerary]);

  // Save changes
  const saveChanges = useCallback(async () => {
    try {
      // Here you would save to backend
      console.log("Saving changes:", editableItinerary);

      // Call parent callback
      onItineraryChange?.(editableItinerary);

      setIsEditMode(false);

      // Show success message (you can integrate with your toast system)
      console.log("Changes saved successfully!");
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  }, [editableItinerary, onItineraryChange]);

  // Empty state
  if (currentItinerary.length === 0 && placesToVisit.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📅</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Itinerary Available
        </h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Your trip itinerary is being prepared. Please check back soon or try
          regenerating your trip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Edit Mode Controls */}
      {currentItinerary.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600">✏️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isEditMode
                    ? "Editing Your Itinerary"
                    : "Customize Your Trip"}
                </h3>
                <p className="text-sm text-gray-600">
                  {isEditMode
                    ? "Drag activities to reorder them within or between days"
                    : "Click edit to rearrange your activities"}
                </p>
                {/* Progress indicator */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-xs text-gray-500">
                    Progress: {statistics.visitedCount}/
                    {statistics.totalActivities} activities completed
                  </div>
                  <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${statistics.completionRate}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {Math.round(statistics.completionRate)}%
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditMode(false)}
                    className="gap-2"
                  >
                    <span>❌</span> Cancel
                  </Button>
                  <Button
                    onClick={saveChanges}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <span>💾</span> Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={toggleEditMode}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <span>✏️</span> Edit Itinerary
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Trip Overview Stats */}
      {(currentItinerary.length > 0 || placesToVisit.length > 0) && (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: "repeat",
              }}
            ></div>
          </div>

          <div className="relative z-10 p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                ✨ Your Adventure at a Glance
              </h3>
              <p className="text-blue-100">
                Everything you need to know about your amazing journey
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center group">
                <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300 shadow-lg">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {statistics.totalDays}
                </div>
                <div className="text-white text-sm font-semibold">
                  Days of Adventure
                </div>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300 shadow-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {placesToVisit.length}
                </div>
                <div className="text-white text-sm font-semibold">
                  Must-See Places
                </div>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300 shadow-lg">
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {statistics.totalActivities}
                </div>
                <div className="text-white text-sm font-semibold">
                  Exciting Activities
                </div>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300 shadow-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {statistics.visitedCount}
                </div>
                <div className="text-white text-sm font-semibold">
                  Completed
                </div>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300 shadow-lg">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {trip?.userSelection?.duration ||
                    trip?.tripData?.duration ||
                    "N/A"}
                </div>
                <div className="text-white text-sm font-semibold">
                  Days Total
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Places to Visit Section */}
      {placesToVisit.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl">🎯</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Must-Visit Attractions
                  </h2>
                  <p className="text-emerald-100 text-sm">
                    {placesToVisit.length} carefully curated destinations
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {placesToVisit.map((place, index) => (
                <PlaceCardItem key={place?.placeName || index} place={place} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Daily Itinerary Section with Drag and Drop */}
      {currentItinerary.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl">📅</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Your Daily Adventure Plan
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {statistics.totalDays} days of exciting experiences •{" "}
                    {Math.round(statistics.completionRate)}% completed
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Instructions */}
            <div className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 text-lg">🗺️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-indigo-900 mb-2">
                    How to Use This Itinerary
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-indigo-800">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600">✅</span>
                      <span>Click circles to mark activities as completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600">📝</span>
                      <span>Add personal notes to any activity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600">🖱️</span>
                      <span>
                        {isEditMode
                          ? "Drag activities to reorder them"
                          : "Enable edit mode to customize"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600">⌨️</span>
                      <span>Use keyboard navigation for accessibility</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              accessibility={{
                announcements: {
                  onDragStart: ({ active }) => {
                    const activity = active.data.current?.activity;
                    return `Started dragging ${
                      activity?.placeName || "activity"
                    }`;
                  },
                  onDragOver: ({ active, over }) => {
                    const activity = active.data.current?.activity;
                    const overData = over?.data.current;
                    if (overData?.type === "day") {
                      return `Dragging ${
                        activity?.placeName || "activity"
                      } over day ${overData.dayIndex + 1}`;
                    }
                    return "";
                  },
                  onDragEnd: ({ active, over }) => {
                    const activity = active.data.current?.activity;
                    const overData = over?.data.current;
                    if (overData?.type === "day") {
                      return `Moved ${
                        activity?.placeName || "activity"
                      } to day ${overData.dayIndex + 1}`;
                    }
                    return `Dropped ${activity?.placeName || "activity"}`;
                  },
                },
              }}
            >
              <div
                className="space-y-8"
                role="main"
                aria-label="Daily itinerary"
              >
                {currentItinerary.map((dayItem, dayIndex) => (
                  <div key={dayItem?.day || dayIndex} className="relative">
                    {/* Enhanced Day Header */}
                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border border-blue-100">
                      <div className="flex items-start gap-5">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-white text-xl font-bold">
                              {dayItem?.day || dayIndex + 1}
                            </span>
                          </div>
                          {dayIndex < currentItinerary.length - 1 && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-blue-300 to-transparent mt-2"></div>
                          )}
                        </div>

                        <div className="flex-1 pt-2">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900">
                              Day {dayItem?.day || dayIndex + 1}
                            </h3>
                            {dayItem?.plan && Array.isArray(dayItem.plan) && (
                              <>
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                                >
                                  {dayItem.plan.length} activities
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-700 hover:bg-green-200"
                                >
                                  {
                                    dayItem.plan.filter((_, index) =>
                                      visitedActivities.has(
                                        `${dayIndex}-${index}`
                                      )
                                    ).length
                                  }{" "}
                                  completed
                                </Badge>
                              </>
                            )}
                          </div>

                          <p className="text-blue-700 font-semibold text-lg mb-3">
                            🎯 {dayItem?.theme || "Explore & Discover"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Day Activities with Enhanced Drag and Drop Support */}
                    <SortableContext
                      items={
                        dayItem?.plan?.map(
                          (_, index) => `${dayIndex}-${index}`
                        ) || []
                      }
                      strategy={verticalListSortingStrategy}
                      id={`day-${dayIndex}`}
                    >
                      <DroppableDay
                        dayIndex={dayIndex}
                        isOver={dragOverDay === dayIndex}
                        activityCount={dayItem?.plan?.length || 0}
                      >
                        {dayItem?.plan && Array.isArray(dayItem.plan) ? (
                          isEditMode ? (
                            // Edit mode: sortable activities
                            dayItem.plan.map((activity, activityIndex) => (
                              <SortableActivity
                                key={`${dayIndex}-${activityIndex}`}
                                activity={activity}
                                dayIndex={dayIndex}
                                activityIndex={activityIndex}
                                isDragging={
                                  activeId === `${dayIndex}-${activityIndex}`
                                }
                                isVisited={visitedActivities.has(
                                  `${dayIndex}-${activityIndex}`
                                )}
                                notes={
                                  activityNotes[`${dayIndex}-${activityIndex}`]
                                }
                                onToggleVisited={handleToggleVisited}
                                onUpdateNotes={handleUpdateNotes}
                              />
                            ))
                          ) : (
                            // View mode: regular activities with enhanced features
                            dayItem.plan.map((activity, activityIndex) => (
                              <SortableActivity
                                key={`${dayIndex}-${activityIndex}`}
                                activity={activity}
                                dayIndex={dayIndex}
                                activityIndex={activityIndex}
                                isDragging={false}
                                isVisited={visitedActivities.has(
                                  `${dayIndex}-${activityIndex}`
                                )}
                                notes={
                                  activityNotes[`${dayIndex}-${activityIndex}`]
                                }
                                onToggleVisited={handleToggleVisited}
                                onUpdateNotes={handleUpdateNotes}
                              />
                            ))
                          )
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                            <div className="text-gray-400 text-3xl mb-2">
                              📝
                            </div>
                            <p className="text-gray-500 text-sm">
                              No activities planned for this day
                            </p>
                          </div>
                        )}
                      </DroppableDay>
                    </SortableContext>

                    {/* Add spacing between days */}
                    {dayIndex < currentItinerary.length - 1 && (
                      <div className="mt-8 border-b border-gray-100"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Enhanced Drag Overlay */}
              <DragOverlay>
                {draggedActivity ? (
                  <div className="bg-white rounded-xl p-6 border-2 border-blue-400 shadow-2xl opacity-90 rotate-3 scale-105 max-w-md">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <h4 className="text-lg font-bold text-gray-900 break-words">
                        {draggedActivity.placeName || "Activity"}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 break-words">
                      {draggedActivity.placeDetails || "Dragging activity..."}
                    </p>
                    <div className="mt-3 flex gap-2">
                      {draggedActivity.time && (
                        <Badge variant="secondary" className="text-xs">
                          🕐 {draggedActivity.time}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        📍 Moving...
                      </Badge>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlacesToVisitEnhanced;
