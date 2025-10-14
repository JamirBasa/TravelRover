/**
 * Smart Context-Aware Suggestions for Specific Requests
 * Generates personalized examples and validation based on form context
 */

import { getRegionData } from '../data/philippineRegions';

/**
 * Generate context-aware suggestions based on trip details
 */
export function generateContextSuggestions(context) {
  // Return empty suggestions if no context provided
  if (!context) {
    return {
      examples: [],
      categorySpecific: [],
      destinationSpecific: [],
      budgetAppropriate: [],
      profileBased: [],
      contextualTips: [],
    };
  }

  const {
    location,
    duration,
    budget,
    travelers,
    categoryName,
    userProfile,
    flightData,
    hotelData,
  } = context;

  const suggestions = {
    examples: [],
    categorySpecific: [],
    destinationSpecific: [],
    budgetAppropriate: [],
    profileBased: [],
    contextualTips: [],
  };

  // Get destination-specific data (only if location exists)
  const regionData = location ? getRegionData(location) : null;

  // 1. DESTINATION-SPECIFIC SUGGESTIONS
  if (regionData && regionData.famousAttractions) {
    suggestions.destinationSpecific = regionData.famousAttractions
      .slice(0, 3)
      .map(attraction => `• Visit ${attraction} in ${location}`);
  } else if (location) {
    // Generic destination suggestions
    suggestions.destinationSpecific = [
      `• Explore must-see attractions in ${location}`,
      `• Try local ${location} specialties and street food`,
      `• Visit popular Instagram spots in ${location}`,
    ];
  }

  // 2. CATEGORY-SPECIFIC SUGGESTIONS
  if (categoryName) {
    const categoryExamples = {
      'Adventure': [
        '• Include mountain hiking or trekking activities',
        '• Visit adventure parks and zipline experiences',
        '• Schedule water sports (kayaking, parasailing)',
        '• Add rock climbing or rappelling sites',
      ],
      'Beach': [
        '• Include island hopping tours',
        '• Schedule snorkeling or scuba diving',
        '• Visit white sand beaches and sunset viewpoints',
        '• Add beach sports and water activities',
      ],
      'Cultural': [
        '• Visit UNESCO heritage sites and museums',
        '• Include traditional craft workshops',
        '• Attend local festivals or cultural performances',
        '• Explore historical churches and landmarks',
      ],
      'Food Trip': [
        '• Try signature dishes and local delicacies',
        '• Visit famous restaurants and food markets',
        '• Include cooking classes or food tours',
        '• Sample street food and local specialties',
      ],
      'Nature': [
        '• Visit national parks and nature reserves',
        '• Include wildlife watching opportunities',
        '• Schedule waterfall tours and nature trails',
        '• Add botanical gardens and eco-parks',
      ],
      'Romantic': [
        '• Include couples spa and sunset dining',
        '• Visit romantic viewpoints and beach resorts',
        '• Schedule private tours and experiences',
        '• Add candlelit dinners and scenic spots',
      ],
      'Family': [
        '• Include kid-friendly activities and parks',
        '• Visit family resorts and amusement areas',
        '• Schedule educational tours and museums',
        '• Add safe swimming areas and playgrounds',
      ],
    };

    suggestions.categorySpecific = categoryExamples[categoryName]?.slice(0, 3) || [];
  }

  // 3. BUDGET-APPROPRIATE SUGGESTIONS
  const budgetLevel = budget?.toLowerCase() || 'moderate';
  
  if (budgetLevel === 'budget' || budget === 'Budget') {
    suggestions.budgetAppropriate = [
      '• Focus on free or low-cost attractions',
      '• Include local markets and street food experiences',
      '• Suggest public transport or walking tours',
    ];
  } else if (budgetLevel === 'luxury' || budget === 'Luxury') {
    suggestions.budgetAppropriate = [
      '• Include fine dining experiences',
      '• Add private tours and premium activities',
      '• Suggest luxury spa or wellness experiences',
    ];
  } else {
    suggestions.budgetAppropriate = [
      '• Mix of popular and off-the-beaten-path spots',
      '• Balance between local eats and nice restaurants',
      '• Include some premium and some budget activities',
    ];
  }

  // 4. PROFILE-BASED SUGGESTIONS
  if (userProfile) {
    // Dietary restrictions
    if (userProfile.dietaryRestrictions?.includes('halal')) {
      suggestions.profileBased.push('• Ensure all food recommendations are Halal-certified');
    }
    if (userProfile.dietaryRestrictions?.includes('vegetarian')) {
      suggestions.profileBased.push('• Include vegetarian and plant-based restaurant options');
    }
    if (userProfile.dietaryRestrictions?.includes('vegan')) {
      suggestions.profileBased.push('• Focus on vegan-friendly dining options');
    }

    // Cultural preferences
    if (userProfile.culturalPreferences?.includes('islamic')) {
      suggestions.profileBased.push('• Include mosque locations for prayer times');
      suggestions.profileBased.push('• Recommend Islamic-friendly accommodations');
    }

    // Travel style
    if (userProfile.travelStyle === 'solo') {
      suggestions.profileBased.push('• Include solo-traveler-friendly activities and meetups');
    } else if (userProfile.travelStyle === 'group') {
      suggestions.profileBased.push('• Suggest group activities and tours');
    }

    // Preferred trip types
    if (userProfile.preferredTripTypes?.includes('photography')) {
      suggestions.profileBased.push('• Include sunrise/sunset photography spots');
    }
    if (userProfile.preferredTripTypes?.includes('wellness')) {
      suggestions.profileBased.push('• Add yoga, meditation, or wellness retreats');
    }
  }

  // 5. TRAVELER-SPECIFIC SUGGESTIONS
  if (travelers) {
    const travelerLower = travelers.toLowerCase();
    
    if (travelerLower.includes('partner') || travelerLower.includes('couple')) {
      suggestions.examples.push('• Include romantic dinner spots and couple activities');
    }
    
    if (travelerLower.includes('family')) {
      suggestions.examples.push('• Prioritize family-friendly attractions with kid facilities');
    }
    
    if (travelerLower.includes('group') || travelerLower.includes('6+')) {
      suggestions.examples.push('• Suggest group activities and restaurants with large tables');
    }
  }

  // 6. DURATION-SPECIFIC SUGGESTIONS
  if (duration) {
    if (duration <= 2) {
      suggestions.contextualTips.push('Quick weekend trip - focus on must-see highlights');
    } else if (duration >= 7) {
      suggestions.contextualTips.push('Extended trip - can include day trips to nearby areas');
    } else {
      suggestions.contextualTips.push('Balanced itinerary with major attractions and relaxation');
    }
  }

  // 7. FLIGHT/HOTEL CONTEXT
  if (flightData?.includeFlights && flightData?.departureCity) {
    suggestions.contextualTips.push(`Flying from ${flightData.departureCity} - consider arrival/departure timing`);
  }

  if (hotelData?.preferredType) {
    const hotelType = hotelData.preferredType;
    suggestions.contextualTips.push(`Staying at ${hotelType} - activities should match accommodation style`);
  }

  return suggestions;
}

/**
 * Generate smart placeholder text based on context
 */
export function generateSmartPlaceholder(context) {
  // Return default placeholder if no context
  if (!context) {
    return 'Examples:\n• Visit specific landmarks or attractions\n• Try local specialties or famous restaurants\n• Adventure activities like diving or hiking\n• Photography spots for Instagram\n• Day-specific activities (e.g., Day 2: Island hopping)';
  }

  const { location, categoryName, budget, travelers } = context;
  
  let placeholder = 'List places and activities (without full addresses):\n\n';
  
  // Add destination-specific example
  if (location) {
    const cityName = location.split(',')[0]; // Extract just the city name
    placeholder += `• Visit [landmark name] - e.g., "Visit Fort Santiago"\n`;
  } else {
    placeholder += `• Visit [landmark name] - e.g., "Visit Rizal Park"\n`;
  }
  
  // Add category-specific example
  if (categoryName === 'Beach') {
    placeholder += '• Island hopping tour\n';
  } else if (categoryName === 'Cultural') {
    placeholder += '• Visit museums and historical sites\n';
  } else if (categoryName === 'Food Trip') {
    placeholder += '• Try local specialties at food markets\n';
  } else {
    placeholder += '• Try authentic local cuisine\n';
  }
  
  // Add budget-appropriate example
  if (budget === 'Luxury') {
    placeholder += '• Fine dining experience\n';
  } else if (budget === 'Budget') {
    placeholder += '• Visit free attractions and parks\n';
  } else {
    placeholder += '• Sunset viewing spots\n';
  }
  
  // Add traveler-specific example
  if (travelers?.includes('Family')) {
    placeholder += '• Kid-friendly activities\n';
  } else if (travelers?.includes('Partner')) {
    placeholder += '• Romantic dinner spots\n';
  } else {
    placeholder += '• Photography locations\n';
  }
  
  placeholder += '\nTip: Just list place names - no need for full addresses!';
  
  return placeholder;
}

/**
 * Validate specific requests against form context
 */
export function validateSpecificRequests(requests, context) {
  const warnings = [];
  
  // Return valid if no requests or no context
  if (!requests || !context) {
    return { valid: true, warnings: [] };
  }
  
  const { location, budget, userProfile, startDate, endDate, duration } = context;
  
  const requestsLower = requests.toLowerCase();
  
  // Check for location mismatches (with sub-location awareness)
  if (location) {
    // Parse destination parts (e.g., "BGC High Street, Taguig, Metro Manila" → ["bgc", "taguig", "manila"])
    const destinationParts = location.toLowerCase()
      .split(',')
      .map(part => part.trim())
      .flatMap(part => part.split(' '))
      .filter(word => word.length > 3); // Filter out short words like "the", "in"
    
    // Major Philippine destinations to check
    const otherDestinations = [
      { name: 'manila', aliases: ['intramuros', 'makati', 'bgc', 'taguig', 'quezon city', 'qc'] },
      { name: 'cebu', aliases: ['cebu city', 'mactan', 'moalboal', 'oslob'] },
      { name: 'boracay', aliases: ['aklan', 'caticlan', 'kalibo'] },
      { name: 'palawan', aliases: ['el nido', 'coron', 'puerto princesa'] },
      { name: 'bohol', aliases: ['tagbilaran', 'panglao', 'chocolate hills'] },
      { name: 'davao', aliases: ['davao city', 'samal island'] },
      { name: 'siargao', aliases: ['cloud 9', 'general luna'] },
      { name: 'baguio', aliases: ['benguet', 'camp john hay'] },
      { name: 'vigan', aliases: ['ilocos sur'] },
      { name: 'iloilo', aliases: ['iloilo city'] },
      { name: 'bacolod', aliases: ['negros occidental'] },
      { name: 'zamboanga', aliases: ['zamboanga city', 'zamboanga peninsula'] },
      { name: 'batanes', aliases: ['basco', 'itbayat'] },
      { name: 'sagada', aliases: ['mountain province'] },
      { name: 'la union', aliases: ['san juan', 'elyu'] },
    ];
    
    // Check if user mentioned other destinations
    for (const dest of otherDestinations) {
      const allNames = [dest.name, ...dest.aliases];
      
      // Check if any part of the destination is in current location
      const isPartOfCurrentLocation = destinationParts.some(part => 
        allNames.some(name => name.includes(part) || part.includes(name))
      );
      
      // If not part of current location, check if mentioned in requests
      if (!isPartOfCurrentLocation) {
        const mentionedName = allNames.find(name => {
          const regex = new RegExp(`\\b${name}\\b`, 'i');
          return regex.test(requestsLower);
        });
        
        if (mentionedName) {
          warnings.push({
            type: 'location_mismatch',
            message: `You mentioned "${mentionedName}" but your destination is ${location}. Did you mean attractions in ${location}?`,
            severity: 'warning',
          });
          break; // Only show one location mismatch warning
        }
      }
    }
  }
  
  // Check for date mismatches (activities before start or after end)
  if (startDate || endDate || duration) {
    // Common date patterns
    const datePatterns = [
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?\b/gi,
      /\b\d{1,2}(?:st|nd|rd|th)? (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/gi,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december) \d{1,2}(?:st|nd|rd|th)?\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
    ];
    
    // Day-specific patterns (e.g., "Day 8", "on day 10")
    const dayPattern = /\b(?:day|on day)\s+(\d+)\b/gi;
    const dayMatches = [...requestsLower.matchAll(dayPattern)];
    
    if (dayMatches.length > 0 && duration) {
      const invalidDays = dayMatches
        .map(match => parseInt(match[1]))
        .filter(day => day > duration);
      
      if (invalidDays.length > 0) {
        warnings.push({
          type: 'date_out_of_range',
          message: `You mentioned Day ${invalidDays.join(', ')} but your trip is only ${duration} days long. Please adjust to Day 1-${duration}.`,
          severity: 'warning',
        });
      }
    }
    
    // Check for specific dates mentioned
    let hasDateMention = false;
    for (const pattern of datePatterns) {
      if (pattern.test(requests)) {
        hasDateMention = true;
        break;
      }
    }
    
    if (hasDateMention && (startDate || endDate)) {
      // Parse start and end dates if available
      let tripStart, tripEnd;
      
      try {
        if (startDate) tripStart = new Date(startDate);
        if (endDate) tripEnd = new Date(endDate);
        else if (startDate && duration) {
          tripStart = new Date(startDate);
          tripEnd = new Date(tripStart);
          tripEnd.setDate(tripEnd.getDate() + parseInt(duration) - 1);
        }
        
        // If we have valid trip dates, show an info message
        if (tripStart && !isNaN(tripStart.getTime())) {
          const formattedStart = tripStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const formattedEnd = tripEnd && !isNaN(tripEnd.getTime()) 
            ? tripEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '';
          
          warnings.push({
            type: 'date_mentioned',
            message: `Note: Your trip is ${formattedStart}${formattedEnd ? ' to ' + formattedEnd : ''}. Make sure any dates mentioned align with your trip schedule.`,
            severity: 'info',
          });
        }
      } catch (error) {
        // Ignore date parsing errors
      }
    }
  }
  
  // Check for budget inconsistencies
  if (budget === 'Budget' && (
    requestsLower.includes('luxury') ||
    requestsLower.includes('5-star') ||
    requestsLower.includes('fine dining') ||
    requestsLower.includes('michelin')
  )) {
    warnings.push({
      type: 'budget_mismatch',
      message: 'You selected Budget tier but mentioned luxury experiences. Consider upgrading your budget or we\'ll find budget-friendly alternatives.',
      severity: 'info',
    });
  }
  
  if (budget === 'Luxury' && (
    requestsLower.includes('hostel') ||
    requestsLower.includes('budget') ||
    requestsLower.includes('cheap')
  )) {
    warnings.push({
      type: 'budget_mismatch',
      message: 'You selected Luxury tier but mentioned budget accommodations. We\'ll prioritize your tier selection.',
      severity: 'info',
    });
  }
  
  // Check for dietary conflicts
  if (userProfile?.dietaryRestrictions?.includes('halal')) {
    if (requestsLower.includes('pork') || requestsLower.includes('lechon')) {
      warnings.push({
        type: 'dietary_conflict',
        message: 'You have Halal dietary restrictions but mentioned pork dishes. We\'ll suggest Halal alternatives.',
        severity: 'warning',
      });
    }
  }
  
  if (userProfile?.dietaryRestrictions?.includes('vegetarian')) {
    if (requestsLower.includes('seafood') || requestsLower.includes('meat')) {
      warnings.push({
        type: 'dietary_conflict',
        message: 'You have vegetarian preferences but mentioned meat/seafood. We\'ll suggest vegetarian alternatives.',
        severity: 'info',
      });
    }
  }
  
  return {
    valid: warnings.length === 0 || warnings.every(w => w.severity === 'info'),
    warnings,
  };
}

/**
 * Get contextual help text
 */
export function getContextualHelpText(context) {
  // Return default help text if no context
  if (!context) {
    return 'List specific places and activities (just the names, no full addresses needed!)';
  }

  const { location, categoryName, duration, budget, userProfile } = context;
  
  let helpText = 'List specific places and activities you want to experience. ';
  
  if (location) {
    const cityName = location.split(',')[0]; // Extract just the city name
    helpText += `Just write the place names - our AI knows you're visiting ${cityName}! `;
  }
  
  if (duration) {
    if (duration <= 2) {
      helpText += 'Focus on your top 3-5 must-see spots. ';
    } else if (duration >= 7) {
      helpText += 'You have time for 10-15 places! ';
    } else {
      helpText += 'List 5-10 places you\'d like to visit. ';
    }
  }
  
  if (userProfile?.dietaryRestrictions?.length > 0) {
    helpText += `Don't forget to mention food preferences! `;
  }
  
  return helpText;
}

export default {
  generateContextSuggestions,
  generateSmartPlaceholder,
  validateSpecificRequests,
  getContextualHelpText,
};
