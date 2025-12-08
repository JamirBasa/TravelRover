/**
 * Activity Personalization Matcher
 * Matches activities against user's preferred trip types to show personalization badges
 */

/**
 * Trip type keywords for matching activities
 * Maps each trip type to keywords that might appear in activity names/descriptions
 */
const TRIP_TYPE_KEYWORDS = {
  adventure: [
    'hiking', 'trek', 'climbing', 'rappelling', 'canyoneering', 'zip', 'zipline',
    'atv', 'off-road', 'extreme', 'adventure', 'mountain', 'cliff', 'cave',
    'spelunking', 'rafting', 'kayak', 'paddleboard', 'surfing', 'diving', 'scuba',
    'canyon', 'volcano', 'summit', 'peak', 'trail', 'climb'
  ],
  beach: [
    'beach', 'island', 'shore', 'coastline', 'seaside', 'ocean', 'sea', 'sand',
    'swimming', 'snorkeling', 'coral', 'reef', 'marine', 'boat', 'yacht', 'cruise',
    'sandbar', 'cove', 'lagoon', 'bay', 'sunset cruise', 'island hopping',
    'beach resort', 'tropical', 'palawan', 'boracay', 'siargao', 'bohol'
  ],
  cultural: [
    'museum', 'church', 'cathedral', 'basilica', 'temple', 'heritage', 'historical',
    'monument', 'memorial', 'plaza', 'fort', 'fortress', 'colonial', 'ancient',
    'cultural', 'art gallery', 'traditional', 'festival', 'folk', 'ethnic',
    'intramuros', 'vigan', 'old town', 'historic', 'spanish', 'ancestral',
    'architecture', 'ruins', 'shrine', 'palace'
  ],
  nature: [
    'waterfall', 'falls', 'river', 'lake', 'forest', 'jungle', 'rainforest',
    'wildlife', 'nature park', 'botanical', 'garden', 'sanctuary', 'reserve',
    'eco', 'conservation', 'bird watching', 'mangrove', 'tarsier', 'butterfly',
    'flower', 'orchid', 'tree', 'plant', 'scenic', 'viewpoint', 'overlook',
    'countryside', 'rice terrace', 'farm', 'rural', 'valley'
  ],
  photography: [
    'viewpoint', 'scenic', 'overlook', 'panoramic', 'observation', 'tower',
    'sunrise', 'sunset', 'golden hour', 'instagram', 'photo spot', 'landmark',
    'iconic', 'postcard', 'vista', 'lookout', 'skyline', 'cityscape', 'seascape',
    'landscape', 'photography tour', 'murals', 'street art', 'colorful',
    'picturesque', 'photogenic', 'instagrammable'
  ],
  wellness: [
    'spa', 'massage', 'wellness', 'relaxation', 'meditation', 'yoga', 'retreat',
    'hot spring', 'thermal', 'healing', 'therapy', 'aromatherapy', 'sauna',
    'jacuzzi', 'pampering', 'zen', 'tranquil', 'serene', 'peaceful', 'quiet',
    'restorative', 'rejuvenating', 'holistic', 'health', 'detox'
  ],
  food: [
    'restaurant', 'cafe', 'food', 'dining', 'cuisine', 'culinary', 'tasting',
    'market', 'street food', 'local food', 'delicacy', 'specialty', 'dish',
    'eating', 'meal', 'breakfast', 'lunch', 'dinner', 'coffee', 'dessert',
    'bakery', 'pastry', 'seafood', 'grill', 'bistro', 'gastropub', 'buffet',
    'food trip', 'food tour', 'farm-to-table', 'wine', 'brewery'
  ],
  romantic: [
    'romantic', 'couple', 'honeymoon', 'intimate', 'private', 'candlelit',
    'sunset', 'rooftop', 'fine dining', 'champagne', 'wine', 'spa couple',
    'luxury', 'elegant', 'exclusive', 'secluded', 'cozy', 'enchanting',
    'scenic drive', 'sunset cruise', 'beachfront', 'oceanview', 'villa',
    'boutique', 'charming', 'date night', 'couples massage'
  ]
};

/**
 * Check if an activity matches a specific trip type
 * @param {Object|string} activity - Activity object or text
 * @param {string} tripType - Trip type to match against
 * @returns {boolean}
 */
export function matchesTripType(activity, tripType) {
  const text = typeof activity === 'string'
    ? activity.toLowerCase()
    : `${activity.placeName || ''} ${activity.placeDetails || ''}`.toLowerCase();

  const keywords = TRIP_TYPE_KEYWORDS[tripType] || [];
  return keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

/**
 * Get all matching trip types for an activity
 * @param {Object|string} activity - Activity object or text
 * @param {Array<string>} userPreferredTypes - User's preferred trip types
 * @returns {Array<string>} Array of matching trip type IDs
 */
export function getMatchingTripTypes(activity, userPreferredTypes = []) {
  if (!userPreferredTypes || userPreferredTypes.length === 0) {
    return [];
  }

  const matches = [];
  
  for (const tripType of userPreferredTypes) {
    if (matchesTripType(activity, tripType)) {
      matches.push(tripType);
    }
  }

  return matches;
}

/**
 * Check if an activity should show personalization badge
 * @param {Object|string} activity - Activity object or text
 * @param {Object} userProfile - User profile with preferredTripTypes
 * @returns {Object} { shouldShow: boolean, matches: Array<string>, primaryMatch: string }
 */
export function shouldShowPersonalizationBadge(activity, userProfile) {
  const preferredTypes = userProfile?.preferredTripTypes || [];
  
  if (preferredTypes.length === 0) {
    return { shouldShow: false, matches: [], primaryMatch: null };
  }

  const matches = getMatchingTripTypes(activity, preferredTypes);
  
  return {
    shouldShow: matches.length > 0,
    matches: matches,
    primaryMatch: matches[0] || null
  };
}

/**
 * Get display label for trip type
 * @param {string} tripType - Trip type ID
 * @returns {string} Display label
 */
export function getTripTypeLabel(tripType) {
  const labels = {
    adventure: 'Adventure',
    beach: 'Beach',
    cultural: 'Cultural',
    nature: 'Nature',
    photography: 'Photography',
    wellness: 'Wellness',
    food: 'Food',
    romantic: 'Romantic'
  };
  
  return labels[tripType] || tripType;
}

/**
 * Get emoji icon for trip type
 * @param {string} tripType - Trip type ID
 * @returns {string} Emoji icon
 */
export function getTripTypeIcon(tripType) {
  const icons = {
    adventure: '⛰️',
    beach: '🏖️',
    cultural: '🏛️',
    nature: '🌿',
    photography: '📸',
    wellness: '🧘',
    food: '🍽️',
    romantic: '💕'
  };
  
  return icons[tripType] || '✨';
}

/**
 * Count personalized activities in an itinerary
 * @param {Array<Object>} itinerary - Full trip itinerary
 * @param {Object} userProfile - User profile with preferredTripTypes
 * @returns {Object} { total: number, personalized: number, percentage: number, byType: Object }
 */
export function countPersonalizedActivities(itinerary, userProfile) {
  const preferredTypes = userProfile?.preferredTripTypes || [];
  
  if (preferredTypes.length === 0) {
    return { total: 0, personalized: 0, percentage: 0, byType: {} };
  }

  let total = 0;
  let personalized = 0;
  const byType = {};

  // Initialize counters for each preferred type
  preferredTypes.forEach(type => {
    byType[type] = 0;
  });

  itinerary.forEach(day => {
    if (!day.plan || !Array.isArray(day.plan)) return;

    day.plan.forEach(activity => {
      total++;
      
      const matches = getMatchingTripTypes(activity, preferredTypes);
      if (matches.length > 0) {
        personalized++;
        
        // Count for each matching type
        matches.forEach(type => {
          if (byType[type] !== undefined) {
            byType[type]++;
          }
        });
      }
    });
  });

  return {
    total,
    personalized,
    percentage: total > 0 ? Math.round((personalized / total) * 100) : 0,
    byType
  };
}

export default {
  matchesTripType,
  getMatchingTripTypes,
  shouldShowPersonalizationBadge,
  getTripTypeLabel,
  getTripTypeIcon,
  countPersonalizedActivities
};
