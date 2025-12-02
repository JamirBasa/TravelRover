/**
 * TravelRover Utils - Barrel Export
 * 
 * Central export point for all utility functions.
 * 
 * Note: UI-specific constants (budget options, traveler types, validation rules)
 * are in src/constants/options.jsx - import from there for form/UI use.
 * 
 * 🔄 UPDATED (2025-11-07):
 * - Added formatPHP, formatCurrencyGeneric to exports
 * - Consolidated currency formatting functions
 * - Added productionLogger exports (logDebug, logError, etc.)
 * - Added travelersParsers exports (parseTravelersToNumber, formatTravelersDisplay, etc.)
 * - Fixed conflicting formatCurrency exports (now only from formatters.js)
 */

// Validators
export * from './validators';

// Hotel Validation
export * from './hotelValidation';

// Budget Compliance
export * from './budgetCompliance';

// Formatters (including formatPHP, formatCurrencyGeneric)
export * from './formatters';

// Date Helpers
export * from './dateHelpers';

// JSON Parsers (for AI responses and user data - includes parseDataArray)
export * from './jsonParsers';

// Travelers Parsers (for travelers count handling)
export * from './travelersParsers';

// Production Logger (logDebug, logError, logApiError, etc.)
export * from './productionLogger';

// Budget Calculator (calculateTotalBudget, getBudgetCategory - formatCurrency now from formatters.js)
export * from './budgetCalculator';

// Budget Diagnostics (runBudgetDiagnostics, quickBudgetCheck, compareRealVsAIPricing)
export * from './budgetDiagnostics';

// Hotel Booking Diagnostics (runHotelBookingDiagnostics, validateHotelBooking, testAgodaURL)
export * from './hotelBookingDiagnostics';

// Hotel Quality Filter (filterHotelsByQuality, getHotelQualityTier, QUALITY_TIERS)
export * from './hotelQualityFilter';

// Network Status (isOnline, checkFirebaseConnectivity, etc.)
export * from './networkStatus';

// System Constants
export * from './constants';

// Usage Examples:
// import { formatPHP, validateTripForm, STORAGE_KEYS } from '@/utils';
// import { formatCurrencyGeneric } from '@/utils'; // For multi-currency
// import { logDebug, logError } from '@/utils'; // For logging
// import { parseDataArray, parseTravelersToNumber } from '@/utils'; // For parsing
// import { calculateTotalBudget, formatCurrency } from '@/utils'; // For budget calculations
// import { BUDGET_OPTIONS, TRAVELER_OPTIONS } from '@/constants/options';
