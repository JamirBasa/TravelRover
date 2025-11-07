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

// JSON Parsers (for AI responses and user data)
export * from './jsonParsers';

// System Constants
export * from './constants';

// Usage Examples:
// import { formatPHP, validateTripForm, STORAGE_KEYS } from '@/utils';
// import { formatCurrencyGeneric } from '@/utils'; // For multi-currency
// import { BUDGET_OPTIONS, TRAVELER_OPTIONS } from '@/constants/options';