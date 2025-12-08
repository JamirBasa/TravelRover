/**
 * Dietary Restriction Validator
 * Post-generation validation to ensure meal activities comply with user's dietary restrictions
 * Integrates with the trip generation flow to flag/replace non-compliant meals
 */

/**
 * Dietary restriction keywords for validation
 * Maps restriction types to prohibited ingredients/food types
 */
const DIETARY_KEYWORDS = {
  vegetarian: {
    prohibited: [
      'meat', 'chicken', 'pork', 'beef', 'lamb', 'fish', 'seafood', 'shrimp', 
      'crab', 'lobster', 'lechon', 'sisig', 'adobo', 'sinigang na baboy',
      'crispy pata', 'bagnet', 'longganisa', 'tocino', 'tapa'
    ],
    allowed: ['vegetarian', 'veggie', 'salad', 'vegetables', 'plant-based']
  },
  vegan: {
    prohibited: [
      'meat', 'chicken', 'pork', 'beef', 'lamb', 'fish', 'seafood', 'dairy',
      'milk', 'cheese', 'eggs', 'egg', 'butter', 'cream', 'yogurt', 'honey',
      'lechon', 'sisig', 'adobo', 'sinigang', 'kare-kare'
    ],
    allowed: ['vegan', 'plant-based', 'vegetables', 'veggie', 'salad']
  },
  halal: {
    prohibited: [
      'pork', 'bacon', 'ham', 'lechon', 'sisig', 'bagnet', 'longganisa',
      'crispy pata', 'alcohol', 'wine', 'beer', 'liquor', 'non-halal'
    ],
    allowed: ['halal', 'halal-certified', 'muslim-friendly', 'halal restaurant']
  },
  kosher: {
    prohibited: [
      'pork', 'shellfish', 'shrimp', 'crab', 'lobster', 'bacon', 'ham',
      'lechon', 'sisig', 'non-kosher', 'mixing meat and dairy'
    ],
    allowed: ['kosher', 'kosher-certified', 'kosher restaurant']
  },
  glutenFree: {
    prohibited: [
      'bread', 'pasta', 'wheat', 'flour', 'gluten', 'noodles', 'pancit',
      'lumpia', 'pandesal', 'pastries', 'cake', 'pizza', 'burger bun'
    ],
    allowed: ['gluten-free', 'rice-based', 'gluten free', 'gf options']
  },
  pescatarian: {
    prohibited: [
      'meat', 'chicken', 'pork', 'beef', 'lamb', 'lechon', 'sisig',
      'adobo na manok', 'crispy pata', 'bagnet', 'longganisa'
    ],
    allowed: ['fish', 'seafood', 'pescatarian', 'shrimp', 'salmon', 'tuna']
  },
  dairyFree: {
    prohibited: [
      'milk', 'cheese', 'dairy', 'cream', 'butter', 'yogurt', 'ice cream',
      'whey', 'lactose', 'queso'
    ],
    allowed: ['dairy-free', 'lactose-free', 'non-dairy', 'almond milk', 'coconut milk']
  },
  nutAllergy: {
    prohibited: [
      'peanuts', 'almonds', 'cashews', 'walnuts', 'pistachios', 'nut',
      'peanut butter', 'almond milk', 'trail mix', 'mixed nuts'
    ],
    allowed: ['nut-free', 'no nuts', 'nut allergy friendly']
  }
};

/**
 * Meal activity keywords to identify meal-related activities
 */
const MEAL_KEYWORDS = [
  'breakfast', 'lunch', 'dinner', 'meal', 'brunch', 'merienda',
  'eat', 'dining', 'dine', 'restaurant', 'cafe', 'food',
  'cuisine', 'snack', 'coffee', 'street food', 'food trip'
];

/**
 * Check if an activity is a meal activity
 * @param {Object|string} activity - Activity object or text
 * @returns {boolean}
 */
export function isMealActivity(activity) {
  const text = typeof activity === 'string' 
    ? activity.toLowerCase() 
    : `${activity.placeName || ''} ${activity.placeDetails || ''}`.toLowerCase();

  return MEAL_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * Validate a meal activity against dietary restrictions
 * @param {Object|string} activity - Activity object or text
 * @param {Array<string>} dietaryRestrictions - User's dietary restrictions
 * @returns {Object} { isValid: boolean, violations: Array<string>, restriction: string }
 */
export function validateMealActivity(activity, dietaryRestrictions) {
  if (!dietaryRestrictions || dietaryRestrictions.length === 0) {
    return { isValid: true, violations: [], restriction: null };
  }

  const text = typeof activity === 'string'
    ? activity.toLowerCase()
    : `${activity.placeName || ''} ${activity.placeDetails || ''}`.toLowerCase();

  const violations = [];
  let violatedRestriction = null;

  // Check each dietary restriction
  for (const restriction of dietaryRestrictions) {
    const keywords = DIETARY_KEYWORDS[restriction];
    if (!keywords) continue;

    // Check if explicitly allowed (e.g., "halal restaurant", "vegan cafe")
    const hasAllowedKeyword = keywords.allowed.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    if (hasAllowedKeyword) {
      continue; // Explicitly allowed, skip violation check
    }

    // Check for prohibited ingredients/foods
    const foundProhibited = keywords.prohibited.filter(keyword => 
      text.includes(keyword.toLowerCase())
    );

    if (foundProhibited.length > 0) {
      violations.push(...foundProhibited);
      violatedRestriction = restriction;
    }
  }

  return {
    isValid: violations.length === 0,
    violations: [...new Set(violations)], // Remove duplicates
    restriction: violatedRestriction
  };
}

/**
 * Validate all meal activities in an itinerary
 * @param {Array<Object>} itinerary - Full trip itinerary
 * @param {Array<string>} dietaryRestrictions - User's dietary restrictions
 * @returns {Object} { isValid: boolean, violationCount: number, violations: Array<Object> }
 */
export function validateItineraryMeals(itinerary, dietaryRestrictions) {
  if (!dietaryRestrictions || dietaryRestrictions.length === 0) {
    return { isValid: true, violationCount: 0, violations: [] };
  }

  const violations = [];

  itinerary.forEach((day, dayIndex) => {
    if (!day.plan || !Array.isArray(day.plan)) return;

    day.plan.forEach((activity, activityIndex) => {
      if (!isMealActivity(activity)) return;

      const validation = validateMealActivity(activity, dietaryRestrictions);
      if (!validation.isValid) {
        violations.push({
          day: dayIndex + 1,
          activityIndex,
          activity: activity,
          violations: validation.violations,
          restriction: validation.restriction,
          text: `${activity.placeName || ''} - ${activity.placeDetails || ''}`
        });
      }
    });
  });

  return {
    isValid: violations.length === 0,
    violationCount: violations.length,
    violations
  };
}

/**
 * Generate replacement suggestions for non-compliant meals
 * @param {string} restriction - The violated dietary restriction
 * @returns {Array<string>} Array of replacement suggestions
 */
export function generateMealReplacements(restriction) {
  const suggestions = {
    vegetarian: [
      'Vegetarian restaurant with Filipino options',
      'Veggie-friendly cafe with salads and plant-based meals',
      'Local vegetarian restaurant',
      'Healthy bowl restaurant with vegetable options'
    ],
    vegan: [
      'Vegan cafe with plant-based Filipino dishes',
      'Vegan-friendly restaurant',
      'Plant-based dining spot',
      'Vegan bakery and cafe'
    ],
    halal: [
      'Halal-certified restaurant',
      'Muslim-friendly dining',
      'Halal Filipino restaurant',
      'Halal international cuisine'
    ],
    kosher: [
      'Kosher-certified restaurant',
      'Kosher-friendly dining',
      'Seafood restaurant (kosher options)',
      'Vegetarian restaurant (kosher-friendly)'
    ],
    glutenFree: [
      'Gluten-free cafe',
      'Restaurant with gluten-free menu',
      'Rice-based Filipino cuisine (naturally gluten-free)',
      'Healthy cafe with GF options'
    ],
    pescatarian: [
      'Seafood restaurant',
      'Fish market and grill',
      'Coastal seafood dining',
      'Pescatarian-friendly bistro'
    ],
    dairyFree: [
      'Dairy-free cafe',
      'Asian cuisine (naturally dairy-free)',
      'Restaurant with dairy-free options',
      'Vegan cafe (dairy-free)'
    ],
    nutAllergy: [
      'Nut-free restaurant',
      'Allergy-aware dining',
      'Simple grilled options (nut-free)',
      'Restaurant with allergen menu'
    ]
  };

  return suggestions[restriction] || [
    'Restaurant with dietary accommodation options',
    'Local cafe with customizable menu',
    'Health-conscious dining spot'
  ];
}

/**
 * Create a warning message for dietary violations
 * @param {Object} validationResult - Result from validateItineraryMeals
 * @param {Array<string>} dietaryRestrictions - User's dietary restrictions
 * @returns {string} User-friendly warning message
 */
export function createDietaryWarningMessage(validationResult, dietaryRestrictions) {
  if (validationResult.isValid) return null;

  const restrictionsList = dietaryRestrictions.join(', ');
  const count = validationResult.violationCount;

  return `⚠️ Dietary Concern: ${count} meal${count > 1 ? 's' : ''} may not comply with your ${restrictionsList} preference${dietaryRestrictions.length > 1 ? 's' : ''}. Review and modify as needed.`;
}

/**
 * Enhanced validation with auto-replacement suggestions
 * @param {Array<Object>} itinerary - Full trip itinerary
 * @param {Object} userProfile - User profile with dietary restrictions
 * @param {string} destination - Trip destination
 * @returns {Object} { validation, suggestions }
 */
export function validateWithSuggestions(itinerary, userProfile, destination) {
  const dietaryRestrictions = userProfile?.dietaryRestrictions || [];
  const validation = validateItineraryMeals(itinerary, dietaryRestrictions);

  const suggestions = validation.violations.map(violation => ({
    day: violation.day,
    activityIndex: violation.activityIndex,
    original: violation.text,
    restriction: violation.restriction,
    replacements: generateMealReplacements(violation.restriction, destination)
  }));

  return {
    validation,
    suggestions,
    warningMessage: createDietaryWarningMessage(validation, dietaryRestrictions)
  };
}

export default {
  isMealActivity,
  validateMealActivity,
  validateItineraryMeals,
  generateMealReplacements,
  createDietaryWarningMessage,
  validateWithSuggestions
};
