import {
  FaUser,
  FaUsers,
  FaUserFriends,
  FaHeart,
  FaCoins,
  FaMoneyBillWave,
  FaGem,
} from "react-icons/fa";

export const SelectTravelList = [
  {
    id: 1,
    title: "Just Me",
    desc: "A solo travels in exploring the beauty of the Philippines.",
    icon: <FaUser style={{ color: "#3498db" }} />,
    people: "1",
  },
  {
    id: 2,
    title: "Family Trip",
    desc: "A fun-filled adventure for the whole family.",
    icon: <FaUsers style={{ color: "#27ae60" }} />,
    people: "3 to 5 People",
  },
  {
    id: 3,
    title: "Group Tour",
    desc: "Explore the Philippines with friends and make unforgettable memories.",
    icon: <FaUserFriends style={{ color: "#f39c12" }} />,
    people: "5 to 10 People",
  },
  {
    id: 4,
    title: "Couple Getaway",
    desc: "A romantic escape for couples to enjoy the beauty of the Philippines.",
    icon: <FaHeart style={{ color: "#e74c3c" }} />,
    people: "2 People",
  },
];

export const SelectBudgetOptions = [
  {
    id: 1,
    title: "Budget",
    desc: "A budget-friendly option for travelers looking to save money.",
    icon: <FaCoins style={{ color: "#f1c40f" }} />,
    range: "₱2,000 - ₱8,000", // ✅ Added price range
    value: "Budget", // ✅ Added value for easier handling
  },
  {
    id: 2,
    title: "Moderate",
    desc: "A comfortable option for travelers who want a balance of cost and quality.",
    icon: <FaMoneyBillWave style={{ color: "#2ecc71" }} />,
    range: "₱8,000 - ₱20,000", // ✅ Added price range
    value: "Moderate", // ✅ Added value
  },
  {
    id: 3,
    title: "Luxury",
    desc: "A high-end option for travelers seeking the best experiences.",
    icon: <FaGem style={{ color: "#9b59b6" }} />,
    range: "₱20,000+", // ✅ Added price range
    value: "Luxury", // ✅ Added value
  },
];

export const AI_PROMPT = `You are an expert travel guide specializing in creating comprehensive, budget-conscious travel itineraries. I will provide you with trip details, and you must create a detailed travel plan in strict JSON format.

TRIP REQUEST FORMAT: {location}, {duration} days, {travelers}, {budget} budget

CRITICAL JSON STRUCTURE REQUIREMENTS:
Your response must be valid JSON with this exact structure:

{
  "travelPlan": {
    "destination": "string - full destination name",
    "location": "string - city/region, country", 
    "duration": number,
    "travelers": "string - traveler description",
    "budgetLevel": "string - Budget/Moderate/Luxury or Custom amount",
    "travelDates": {
      "startDate": "string - departure date if specified",
      "endDate": "string - return date if specified",
      "flexibility": "string - date flexibility notes"
    },
    "currency": "string - local currency code (PHP for Philippines)",
    "totalEstimatedCost": "string - cost range in local currency",
    "bestTimeToVisit": "string - seasonal recommendations"
  },
  "tripData": {
    "accommodations": [
      {
        "name": "string",
        "type": "string - hotel/hostel/guesthouse/etc",
        "address": "string - full address",
        "pricePerNight": "string - price range in local currency",
        "rating": number,
        "amenities": ["array", "of", "amenities"],
        "imageUrl": "string - use https://images.unsplash.com/... format",
        "geoCoordinates": {
          "latitude": number,
          "longitude": number
        },
        "description": "string - detailed description",
        "bookingTips": "string - how to get best rates",
        "alternativeOptions": [
          {
            "name": "string",
            "priceRange": "string",
            "description": "string"
          }
        ]
      }
    ],
    "transportation": {
      "gettingThere": {
        "international": {
          "method": "string",
          "estimatedCost": "string",
          "duration": "string",
          "tips": "string"
        },
        "domestic": {
          "method": "string", 
          "estimatedCost": "string",
          "duration": "string",
          "bookingAdvice": "string"
        }
      },
      "localTransport": [
        {
          "method": "string - bus/taxi/rental/walking",
          "costPerDay": "string",
          "pros": ["array", "of", "advantages"],
          "cons": ["array", "of", "disadvantages"],
          "budgetTips": "string"
        }
      ]
    },
    "itinerary": [
      {
        "day": number,
        "date": "string - Day 1, Day 2, etc.",
        "theme": "string - day's focus/theme",
        "activities": [
          {
            "time": "string - time slot",
            "activity": "string - activity name", 
            "location": "string - specific location",
            "description": "string - detailed description",
            "cost": "string - price in local currency",
            "duration": "string - time needed",
            "imageUrl": "string - https://images.unsplash.com/...",
            "geoCoordinates": {
              "latitude": number,
              "longitude": number
            },
            "rating": number,
            "budgetTips": "string - how to save money",
            "bestTimeToVisit": "string"
          }
        ],
        "meals": {
          "breakfast": {
            "recommendation": "string",
            "location": "string", 
            "estimatedCost": "string",
            "options": ["array", "of", "food", "options"]
          },
          "lunch": {
            "recommendation": "string",
            "location": "string",
            "estimatedCost": "string", 
            "options": ["array", "of", "food", "options"]
          },
          "dinner": {
            "recommendation": "string",
            "location": "string",
            "estimatedCost": "string",
            "options": ["array", "of", "food", "options"]
          }
        },
        "accommodation": {
          "name": "string - hotel name for this night",
          "address": "string",
          "pricePerNight": "string", 
          "rating": number,
          "amenities": ["array"],
          "imageUrl": "string",
          "geoCoordinates": {
            "latitude": number,
            "longitude": number
          },
          "description": "string"
        },
        "dailyBudgetBreakdown": {
          "accommodation": "string",
          "transportation": "string", 
          "activities": "string",
          "meals": "string",
          "miscellaneous": "string",
          "total": "string"
        }
      }
    ]
  },
  "budgetBreakdown": {
    "accommodationTotal": "string",
    "transportationTotal": "string", 
    "activitiesTotal": "string",
    "mealsTotal": "string",
    "miscellaneousTotal": "string",
    "dailyAverages": {
      "perDay": "string",
      "perPerson": "string"
    },
    "grandTotal": "string",
    "contingencyFund": "string - 10-15% extra",
    "budgetTips": ["array", "of", "money", "saving", "tips"]
  },
  "practicalInformation": {
    "visaRequirements": "string",
    "vaccinations": "string",
    "currency": "string",
    "language": "string",
    "timeZone": "string",
    "emergencyContacts": "string",
    "culturalTips": ["array", "of", "cultural", "advice"],
    "packingEssentials": ["array", "of", "packing", "items"],
    "safetyTips": ["array", "of", "safety", "advice"],
    "weatherInfo": "string"
  }
}

SPECIFIC REQUIREMENTS:
1. **Budget Alignment**: Strictly adhere to the specified budget level:
   - Budget: Focus on hostels, street food, free activities, public transport
   - Mid-range: Mix of mid-tier hotels, local restaurants, some paid attractions
   - Luxury: High-end accommodations, fine dining, premium experiences

2. **Traveler Count Considerations**: 
   - Solo travelers: Safety tips, social activities, single supplements
   - Couples: Romantic experiences, double rooms, couple activities
   - Groups: Group discounts, larger accommodations, group-friendly activities
   - Families: Kid-friendly activities, family rooms, safety considerations

3. **Location Accuracy**: 
   - Use real places, accurate coordinates, and current pricing
   - Research local currency and realistic costs
   - Include cultural context and local customs
   - Mention seasonal considerations and weather

4. **Image URLs**: Always use high-quality Unsplash URLs in format:
   https://images.unsplash.com/photo-[ID]?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

5. **Pricing Format**: 
   - Always include local currency symbol/code
   - Provide ranges (e.g., "PHP 800 - 1,200", "€50 - 80")
   - Consider seasonal price variations

6. **Coordinates**: Provide accurate latitude and longitude for all locations

7. **Practical Details**:
   - Operating hours for attractions
   - Booking requirements and advance notice needed
   - Transportation schedules and frequency
   - Local customs and etiquette
   - Emergency information

8. **Budget Tips**: Include money-saving advice throughout:
   - Free alternatives to paid activities
   - Local market vs tourist restaurant prices
   - Public transport vs private transport costs
   - Seasonal pricing variations
   - Group discounts and package deals

RESPONSE GUIDELINES:
- Output ONLY valid JSON, no additional text
- Ensure all JSON brackets and commas are properly formatted
- Include realistic, researched pricing in local currency
- Provide 3-5 accommodation options per location
- Create detailed daily itineraries with time slots
- Include backup plans for weather-dependent activities
- Consider travel time between locations
- Provide both popular attractions and hidden gems
- Include local food recommendations and dietary alternatives

Remember: The goal is to create a comprehensive, actionable travel plan that respects the traveler's budget while maximizing their experience. Every recommendation should be practical, affordable within the specified budget range, and culturally appropriate.

BUDGET CONSIDERATIONS:
- If custom budget amount is provided, tailor all recommendations to that specific amount
- For custom budgets, provide detailed breakdown showing how the budget is allocated
- Consider seasonal pricing variations for the specified travel dates
- If dates are provided, check for local festivals, peak seasons, or events that might affect pricing

My request is: {location}, {duration} days, {travelers}, {budget} budget.

SPECIFIC DAILY REQUESTS:
{specificRequests}

IMPORTANT INSTRUCTIONS:
- If specific activities or locations are mentioned for certain days, prioritize those in the itinerary
- If multiple locations are mentioned (e.g., different cities), treat this as a multi-city trip
- Calculate realistic travel times between different locations
- Adjust accommodation and transportation accordingly
- If travel between locations takes significant time, allocate appropriate days for travel
- Provide warnings if the itinerary seems too rushed or logistically challenging`;
