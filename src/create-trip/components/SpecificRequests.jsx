// src/create-trip/components/SpecificRequests.jsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  FaListAlt,
  FaLightbulb,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaShieldAlt,
} from "react-icons/fa";
import {
  generateContextSuggestions,
  generateSmartPlaceholder,
  validateSpecificRequests,
} from "../../utils/contextualSuggestions";

// ✅ SECURITY: Input sanitization to prevent prompt injection
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  // Character limit to prevent context overflow (2000 chars max)
  const trimmed = input.substring(0, 2000);
  
  // Remove dangerous prompt injection patterns
  const dangerousPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|commands?)/gi,
    /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|commands?)/gi,
    /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|commands?)/gi,
    /system\s*(prompt|message|instruction)/gi,
    /you\s+are\s+(now|a)\s+(different|new)/gi,
    /pretend\s+(you|to\s+be)/gi,
    /act\s+as\s+(if|a)/gi,
    /new\s+role/gi,
    /from\s+now\s+on/gi,
    /<\s*script/gi, // XSS prevention
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers
  ];
  
  let sanitized = trimmed;
  let foundInjection = false;
  
  dangerousPatterns.forEach(pattern => {
    if (pattern.test(sanitized)) {
      foundInjection = true;
      sanitized = sanitized.replace(pattern, '[REMOVED]');
    }
  });
  
  // Return sanitized input and flag
  return { sanitized, hasInjection: foundInjection };
};

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
  const [securityWarning, setSecurityWarning] = useState(null);
  
  // ✅ PERFORMANCE: Use refs to prevent unnecessary re-renders
  const validationTimeoutRef = useRef(null);
  const lastValidatedValueRef = useRef('');

  // ✅ PERFORMANCE: Only rebuild context when specific values change (not entire objects)
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
      formData.location,
      formData.duration,
      formData.budget,
      formData.travelers,
      formData.categoryName,
      formData.startDate,
      customBudget,
      startDate,
      endDate,
      userProfile,
      flightData,
      hotelData,
    ]
  );

  // ✅ PERFORMANCE: Generate suggestions only when key context changes
  const suggestions = useMemo(
    () => {
      // Skip if no location (primary driver)
      if (!context.location) return {
        examples: [],
        categorySpecific: [],
        destinationSpecific: [],
        budgetAppropriate: [],
        profileBased: [],
        contextualTips: [],
      };
      return generateContextSuggestions(context);
    },
    [context.location, context.categoryName, context.budget, context.travelers]
  );

  // ✅ PERFORMANCE: Memoize placeholder (changes less frequently)
  const smartPlaceholder = useMemo(
    () => generateSmartPlaceholder(context),
    [context.location, context.categoryName, context.budget, context.travelers]
  );

  // ✅ SECURITY + PERFORMANCE: Validate with longer debounce + sanitization
  useEffect(() => {
    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Skip if value hasn't changed
    if (value === lastValidatedValueRef.current) {
      return;
    }
    
    // Debounce validation (1000ms = more aggressive)
    validationTimeoutRef.current = setTimeout(() => {
      if (value) {
        // ✅ SECURITY: Sanitize input first
        const { sanitized, hasInjection } = sanitizeInput(value);
        
        if (hasInjection) {
          setSecurityWarning({
            type: 'prompt_injection',
            message: 'Suspicious content detected and removed. Please describe places naturally without system instructions.',
            severity: 'error',
          });
          // Update with sanitized value
          onChange(sanitized);
        } else {
          setSecurityWarning(null);
        }
        
        // Validate sanitized input
        const validationResult = validateSpecificRequests(sanitized, context);
        setValidation(validationResult);
        lastValidatedValueRef.current = value;
      } else {
        setValidation({ valid: true, warnings: [] });
        setSecurityWarning(null);
        lastValidatedValueRef.current = '';
      }
    }, 1000); // Increased from 500ms to 1000ms

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [value, context, onChange]);

  // ✅ PERFORMANCE: Combine suggestions only when they change
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

  // ✅ PERFORMANCE: Memoize handler to prevent re-renders
  const handleAddSuggestion = useCallback((suggestion) => {
    const cleanSuggestion = suggestion.replace("• ", "");
    const currentValue = value || "";
    
    // ✅ SECURITY: Check combined length before adding
    const newValue = currentValue
      ? `${currentValue}\n${cleanSuggestion}`
      : cleanSuggestion;
    
    if (newValue.length > 2000) {
      setSecurityWarning({
        type: 'length_exceeded',
        message: 'Cannot add more - you\'ve reached the 2000 character limit.',
        severity: 'warning',
      });
      return;
    }
    
    onChange(newValue);
    setSecurityWarning(null);
  }, [value, onChange]);

  // ✅ PERFORMANCE: Memoize input change handler with sanitization
  const handleInputChange = useCallback((e) => {
    const inputValue = e.target.value;
    
    // Allow typing but enforce limit at 2000 chars
    if (inputValue.length <= 2000) {
      onChange(inputValue);
      if (securityWarning?.type === 'length_exceeded') {
        setSecurityWarning(null);
      }
    } else {
      setSecurityWarning({
        type: 'length_exceeded',
        message: 'Maximum 2000 characters allowed.',
        severity: 'warning',
      });
    }
  }, [onChange, securityWarning]);

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

        {/* ✅ SECURITY: Security Warning Display */}
        {securityWarning && (
          <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
            securityWarning.severity === 'error'
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
          }`}>
            <div className={`flex-shrink-0 ${
              securityWarning.severity === 'error'
                ? 'text-red-600 dark:text-red-500'
                : 'text-amber-600 dark:text-amber-500'
            }`}>
              <FaShieldAlt className="text-lg" />
            </div>
            <div>
              <p className={`text-sm font-medium ${
                securityWarning.severity === 'error'
                  ? 'text-red-800 dark:text-red-300'
                  : 'text-amber-800 dark:text-amber-300'
              }`}>
                {securityWarning.message}
              </p>
            </div>
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
            onChange={handleInputChange}
            maxLength={2000}
          />

          {/* Character count - Show progress bar when > 1500 */}
          {value && value.length > 300 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {value.length} / 2000 characters
                </p>
                {value.length > 1500 && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    💡 {2000 - value.length} characters remaining
                  </p>
                )}
              </div>
              {value.length > 1500 && (
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      value.length > 1900 ? 'bg-red-500' :
                      value.length > 1700 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${(value.length / 2000) * 100}%` }}
                  />
                </div>
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
