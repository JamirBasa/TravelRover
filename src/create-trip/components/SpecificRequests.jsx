// src/create-trip/components/SpecificRequests.jsx
import { useState, useEffect, useMemo } from "react";
import {
  FaListAlt,
  FaLightbulb,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
} from "react-icons/fa";
import {
  generateContextSuggestions,
  generateSmartPlaceholder,
  validateSpecificRequests,
} from "../../utils/contextualSuggestions";

function SpecificRequests({
  value,
  onChange,
  formData = {},
  userProfile = {},
  flightData = {},
  hotelData = {},
  customBudget = null,
  startDate = null,
  endDate = null,
}) {
  const [validation, setValidation] = useState({ valid: true, warnings: [] });
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // Build context object
  const context = useMemo(
    () => ({
      location: formData.location,
      duration: formData.duration,
      budget: customBudget ? "Custom" : formData.budget,
      travelers: formData.travelers,
      categoryName: formData.categoryName,
      startDate: startDate || formData.startDate,
      endDate: endDate || formData.endDate,
      userProfile,
      flightData,
      hotelData,
    }),
    [
      formData,
      userProfile,
      flightData,
      hotelData,
      customBudget,
      startDate,
      endDate,
    ]
  );

  // Generate smart suggestions based on context
  const suggestions = useMemo(
    () => generateContextSuggestions(context),
    [context]
  );

  // Generate context-aware placeholder
  const smartPlaceholder = useMemo(
    () => generateSmartPlaceholder(context),
    [context]
  );

  // Validate requests against context
  useEffect(() => {
    if (value) {
      const validationResult = validateSpecificRequests(value, context);
      setValidation(validationResult);
    } else {
      setValidation({ valid: true, warnings: [] });
    }
  }, [value, context]);

  // Combine all suggestions for display
  const allSuggestions = useMemo(() => {
    const combined = [
      ...suggestions.destinationSpecific,
      ...suggestions.categorySpecific,
      ...suggestions.budgetAppropriate,
      ...suggestions.profileBased,
      ...suggestions.examples,
    ].filter(Boolean);

    return combined.length > 0
      ? combined
      : [
          "• Visit specific landmarks or attractions",
          "• Try local specialties or famous restaurants",
          "• Include adventure activities like diving or hiking",
          "• Photography spots for Instagram",
          "• Shopping areas or local markets",
          "• Day-specific activities (e.g., Day 2: Island hopping)",
        ];
  }, [suggestions]);

  // Quick-add suggestion handler
  const handleAddSuggestion = (suggestion) => {
    const cleanSuggestion = suggestion.replace("• ", "");
    const currentValue = value || "";
    const newValue = currentValue
      ? `${currentValue}\n${cleanSuggestion}`
      : cleanSuggestion;
    onChange(newValue);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Which specific places do you want to visit?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Tell us your must-visit spots, activities, or preferences to
          personalize your itinerary.
        </p>
      </div>

      {/* Request Input */}
      <div className="space-y-4">
        {/* Context-Aware Info Card - SIMPLIFIED */}
        {formData.location && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              💡 List specific places in{" "}
              <span className="font-semibold">{formData.location}</span> you
              want to visit (e.g., "Visit Fort Santiago", "Try sisig", "Sunset
              at Manila Bay")
            </p>
          </div>
        )}

        {/* Textarea Input */}
        <div>
          <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
            <FaListAlt className="inline mr-2" />
            Specific Places & Activities (Optional)
          </label>
          <textarea
            className="w-full py-3 px-3 border-2 rounded-lg resize-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 dark:focus:border-sky-500 dark:focus:ring-sky-800"
            rows="6"
            placeholder={smartPlaceholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />

          {/* Character count - Only show if getting long */}
          {value && value.length > 300 && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {value.length} characters
              </p>
              {value.length > 500 && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  💡 Keep it concise for best results
                </p>
              )}
            </div>
          )}
        </div>

        {/* Validation Warnings */}
        {validation.warnings.length > 0 && (
          <div className="space-y-2">
            {validation.warnings.map((warning, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                  warning.severity === "warning"
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                    : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                }`}
              >
                <div
                  className={`flex-shrink-0 ${
                    warning.severity === "warning"
                      ? "text-amber-600 dark:text-amber-500"
                      : "text-blue-600 dark:text-blue-500"
                  }`}
                >
                  {warning.severity === "warning" ? (
                    <FaExclamationTriangle className="text-lg" />
                  ) : (
                    <FaInfoCircle className="text-lg" />
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      warning.severity === "warning"
                        ? "text-amber-800 dark:text-amber-300"
                        : "text-blue-800 dark:text-blue-300"
                    }`}
                  >
                    {warning.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick-Add Suggestions - Show top 4 by default */}
        {allSuggestions.length > 0 && formData.location && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm flex items-center gap-2">
                <FaLightbulb className="text-emerald-600 dark:text-emerald-400" />
                Suggestions - Click to Add
              </h3>
              {allSuggestions.length > 4 && (
                <button
                  onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                  className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 font-medium transition-colors cursor-pointer"
                >
                  {showAllSuggestions
                    ? "Show Less"
                    : `+${allSuggestions.length - 4} more`}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {(showAllSuggestions
                ? allSuggestions
                : allSuggestions.slice(0, 4)
              ).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleAddSuggestion(suggestion)}
                  className="w-full text-left p-2 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 rounded-lg transition-all text-sm text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 group cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SpecificRequests;
