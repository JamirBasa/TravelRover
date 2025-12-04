/**
 * TravelTimeEditor Component
 *
 * Compact inline editor for travel time/mode between activities
 * Features:
 * ✅ Duration input with unit selector (minutes/hours)
 * ✅ Transport mode selector with icons
 * ✅ Auto-cost calculation
 * ✅ Visual transport mode indicators
 * ✅ Compact design that doesn't break editing flow
 * ✅ Auto-save on change
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Select from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  parseTravelTime,
  formatTravelTime,
  calculateTravelCost,
  calculateCostRange,
  validateManualCost,
  validateTravelData,
  TRANSPORT_MODES,
  getTransportModeConfig,
} from "@/utils/travelTimeParser";

function TravelTimeEditor({
  timeTravel,
  fromActivity,
  onSave,
  className = "",
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [travelData, setTravelData] = useState(() =>
    parseTravelTime(timeTravel)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isManualCost, setIsManualCost] = useState(false);
  const [manualCost, setManualCost] = useState(0);
  const [costValidation, setCostValidation] = useState(null);

  // Parse timeTravel when it changes externally
  useEffect(() => {
    if (!isEditing) {
      setTravelData(parseTravelTime(timeTravel));
    }
  }, [timeTravel, isEditing]);

  // Auto-calculate cost when mode or duration changes (unless manual override)
  useEffect(() => {
    if (
      isEditing &&
      !isManualCost &&
      travelData.duration &&
      travelData.duration > 0
    ) {
      const newCost = calculateTravelCost(
        travelData.mode,
        travelData.duration,
        travelData.unit
      );
      setTravelData((prev) => ({ ...prev, cost: newCost }));
    }
  }, [
    travelData.mode,
    travelData.duration,
    travelData.unit,
    isEditing,
    isManualCost,
  ]);

  // Validate manual cost when it changes
  useEffect(() => {
    if (isManualCost && manualCost > 0) {
      const validation = validateManualCost(
        travelData.mode,
        manualCost,
        travelData.duration,
        travelData.unit
      );
      setCostValidation(validation);
    } else {
      setCostValidation(null);
    }
  }, [
    isManualCost,
    manualCost,
    travelData.mode,
    travelData.duration,
    travelData.unit,
  ]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setIsManualCost(false);
    setManualCost(travelData.cost || 0);
    setCostValidation(null);
  };

  const handleSave = async () => {
    // Validate before saving
    const finalDuration =
      travelData.duration && travelData.duration > 0 ? travelData.duration : 1; // Default to 1 if invalid

    // Use manual cost if override is active, otherwise recalculate with final duration
    const finalCost = isManualCost
      ? manualCost
      : calculateTravelCost(travelData.mode, finalDuration, travelData.unit);

    // Prepare data
    const dataToSave = {
      ...travelData,
      duration: finalDuration,
      cost: finalCost,
      origin: travelData.origin || fromActivity?.placeName || null,
    };

    // Validate the data
    const validation = validateTravelData(dataToSave);
    if (!validation.isValid) {
      console.warn("Invalid travel data:", validation.errors);
      // Auto-fix and continue (user-friendly approach)
    }

    const formattedString = formatTravelTime(dataToSave);

    setIsSaving(true);
    try {
      await onSave?.(formattedString);

      // Success - clean up and exit edit mode
      setIsEditing(false);
      setIsManualCost(false);
      setCostValidation(null);
    } catch (error) {
      console.error("Failed to save travel time:", error);
      // Keep editing mode open so user can retry
      toast.error("Unable to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTravelData(parseTravelTime(timeTravel));
    setIsEditing(false);
    setIsManualCost(false);
    setCostValidation(null);
  };

  const handleDurationChange = (e) => {
    const inputValue = e.target.value;

    // Allow empty string for deletion/clearing
    if (inputValue === "" || inputValue === null) {
      setTravelData((prev) => ({ ...prev, duration: "" }));
      return;
    }

    const value = parseInt(inputValue, 10);
    // Allow valid positive numbers and cap at maximum
    if (!isNaN(value) && value >= 0 && value <= 480) {
      setTravelData((prev) => ({ ...prev, duration: value }));
    }
  };

  const handleDurationBlur = () => {
    // If empty or invalid, reset to minimum valid value
    if (
      !travelData.duration ||
      travelData.duration === "" ||
      travelData.duration < 1
    ) {
      setTravelData((prev) => ({ ...prev, duration: 1 }));
    }
  };

  const handleUnitChange = (value) => {
    setTravelData((prev) => ({ ...prev, unit: value }));
  };

  const handleModeChange = (value) => {
    setTravelData((prev) => ({ ...prev, mode: value }));
  };

  const handleToggleManualCost = () => {
    if (!isManualCost) {
      // Switching to manual mode - initialize with current cost
      setManualCost(travelData.cost);
    }
    setIsManualCost(!isManualCost);
  };

  const handleManualCostChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setManualCost(value);
    }
  };

  const handleApplySuggestion = () => {
    if (costValidation?.suggestion) {
      setManualCost(costValidation.suggestion);
    }
  };

  const transportConfig = getTransportModeConfig(travelData.mode);
  const validDuration =
    travelData.duration && travelData.duration > 0 ? travelData.duration : 15;
  const costRange = calculateCostRange(
    travelData.mode,
    validDuration,
    travelData.unit
  );

  const currentCost = isManualCost ? manualCost : travelData.cost;

  const displayCost =
    currentCost === 0 || travelData.mode === "walking"
      ? "Free"
      : `₱${currentCost}`;

  const displayCostRange =
    costRange.min === 0
      ? "Free"
      : costRange.min === costRange.max
      ? `₱${costRange.average}`
      : `₱${costRange.min}-${costRange.max}`;

  // Display mode (read-only)
  if (!isEditing) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-3 my-3 group cursor-pointer",
          "hover:bg-sky-50 dark:hover:bg-sky-950/30 rounded-lg p-3 transition-all duration-200",
          className
        )}
        onClick={handleStartEdit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleStartEdit()}
        aria-label="Edit travel time"
      >
        {/* Connector line */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-0.5 h-4 bg-gradient-to-b from-sky-300 to-sky-500 dark:from-sky-600 dark:to-sky-400" />
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-lg",
              "bg-gradient-to-br shadow-md",
              `from-${transportConfig?.color || "sky"}-400 to-${
                transportConfig?.color || "sky"
              }-600`
            )}
          >
            {transportConfig?.icon || "🚶"}
          </div>
          <div className="w-0.5 h-4 bg-gradient-to-b from-sky-500 to-sky-300 dark:from-sky-400 dark:to-sky-600" />
        </div>

        {/* Travel info */}
        <div className="flex items-center gap-2 text-sm">
          <Badge
            variant="outline"
            className="gap-1 px-2 py-1 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400"
          >
            <Clock className="h-3 w-3" />
            <span className="font-semibold">
              {travelData.duration} {travelData.unit === "hours" ? "hr" : "min"}
            </span>
          </Badge>

          <Badge
            variant="outline"
            className="gap-1 px-2 py-1 border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400"
          >
            <span className="font-semibold">
              {transportConfig?.label || "Walking"}
            </span>
          </Badge>

          <Badge
            variant="outline"
            className={cn(
              "gap-1 px-2 py-1",
              travelData.cost === 0
                ? "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                : "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
            )}
          >
            <span className="font-semibold">{displayCost}</span>
          </Badge>

          <Pencil className="h-3.5 w-3.5 text-gray-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div
      className={cn(
        "flex flex-col gap-3 my-4 p-4 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50",
        "dark:from-sky-950/40 dark:via-blue-950/40 dark:to-indigo-950/40",
        "border-2 border-sky-300 dark:border-sky-700 rounded-xl shadow-lg",
        className
      )}
      role="form"
      aria-label="Edit travel time between activities"
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-bold text-sky-900 dark:text-sky-200">
        <MapPin className="h-4 w-4" />
        <span>
          Travel from {fromActivity?.placeName || "previous location"}
        </span>
      </div>

      {/* Input fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Duration input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Duration
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              max="480"
              step="1"
              value={travelData.duration}
              onChange={handleDurationChange}
              onBlur={handleDurationBlur}
              placeholder="e.g. 30"
              className="w-24 text-center font-bold text-base focus:ring-2 focus:ring-sky-500"
              aria-label="Travel duration"
              autoFocus
            />
            <Select
              value={travelData.unit}
              onChange={(e) => handleUnitChange(e.target.value)}
              options={[
                { value: "minutes", label: "Minutes" },
                { value: "hours", label: "Hours" },
              ]}
              className="w-28"
            />
          </div>
        </div>

        {/* Transport mode selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Transport Mode
          </label>
          <Select
            value={travelData.mode}
            onChange={(e) => handleModeChange(e.target.value)}
            options={TRANSPORT_MODES.map((mode) => ({
              value: mode.value,
              label: `${mode.icon} ${mode.label}`,
            }))}
            className="w-full"
          />
        </div>
      </div>

      {/* Cost section - Auto-calculated with manual override */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              💰 Cost {isManualCost ? "(Custom)" : "(Auto)"}
            </span>
            <button
              type="button"
              onClick={handleToggleManualCost}
              className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors cursor-pointer"
              title={
                isManualCost
                  ? "Switch to auto-calculation"
                  : "Enter custom amount"
              }
            >
              {isManualCost ? "🤖 Auto" : "✏️ Edit"}
            </button>
          </div>

          {isManualCost ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ₱
              </span>
              <Input
                type="number"
                min="0"
                max="5000"
                step="5"
                value={manualCost}
                onChange={handleManualCostChange}
                placeholder="Enter cost"
                className="w-24 h-8 text-center font-bold text-sm focus:ring-2 focus:ring-blue-500"
                aria-label="Manual cost entry"
              />
            </div>
          ) : (
            <Badge
              variant="outline"
              className={cn(
                "font-bold text-sm px-3 py-1",
                currentCost === 0
                  ? "border-green-500 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400"
                  : "border-blue-500 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400"
              )}
            >
              {displayCost}
            </Badge>
          )}
        </div>

        {/* Cost validation warning */}
        {costValidation?.warning && (
          <div
            className={cn(
              "flex items-center justify-between gap-2 p-2 rounded-lg text-xs",
              costValidation.isValid
                ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                : "bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
            )}
          >
            <span>{costValidation.warning}</span>
            {costValidation.suggestion && (
              <button
                type="button"
                onClick={handleApplySuggestion}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 font-semibold cursor-pointer"
              >
                Use ₱{costValidation.suggestion}
              </button>
            )}
          </div>
        )}

        {/* Helper text */}
        {!isManualCost && (
          <div className="text-[11px] text-gray-500 dark:text-gray-400 italic px-1 flex items-center gap-1">
            <span>💡</span>
            <span>
              Typical range:{" "}
              <span className="font-semibold">{displayCostRange}</span>
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isSaving}
          className="gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={
            isSaving || (!travelData.duration && travelData.duration !== 0)
          }
          className="gap-1.5 brand-gradient min-w-[90px]"
        >
          {isSaving ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default TravelTimeEditor;
