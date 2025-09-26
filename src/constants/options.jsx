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
    range: "₱2,000 - ₱8,000",
    value: "Budget",
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
    range: "₱20,000+",
    value: "Luxury",
  },
];

export const AI_PROMPT = `Generate a comprehensive travel itinerary in valid JSON format for: {location}, {duration} days, {travelers}, {budget} budget.

REQUIRED JSON STRUCTURE:
{
  "tripName": "Trip to [Location]",
  "destination": "[Full destination name]",
  "duration": "[X] days",
  "budget": "[Budget level]",
  "travelers": "[Traveler type]",
  "startDate": "[Start date if provided]",
  "endDate": "[End date if provided]",
  "currency": "PHP",
  "hotels": [
    {
      "hotelName": "Hotel Name",
      "hotelAddress": "Complete address",
      "pricePerNight": "₱X,XXX - ₱X,XXX",
      "imageUrl": "https://images.unsplash.com/photo-xxx",
      "geoCoordinates": {
        "latitude": 0.000,
        "longitude": 0.000
      },
      "rating": 4.5,
      "description": "Hotel description"
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "theme": "Day theme",
      "plan": [
        {
          "time": "9:00 AM",
          "placeName": "Place Name",
          "placeDetails": "Description",
          "imageUrl": "https://images.unsplash.com/photo-xxx",
          "geoCoordinates": {
            "latitude": 0.000,
            "longitude": 0.000
          },
          "ticketPricing": "₱XXX or Free",
          "timeTravel": "X hours",
          "rating": 4.0
        }
      ]
    }
  ],
  "placesToVisit": [
    {
      "placeName": "Attraction Name",
      "placeDetails": "Description",
      "imageUrl": "https://images.unsplash.com/photo-xxx",
      "geoCoordinates": {
        "latitude": 0.000,
        "longitude": 0.000
      },
      "ticketPricing": "₱XXX",
      "timeTravel": "X hours",
      "rating": 4.0
    }
  ]
}

REQUIREMENTS:
1. Use real places and accurate coordinates for {location}
2. Provide 3-5 hotel options with realistic Philippine peso pricing
3. Create {duration} days of detailed itinerary
4. Adjust recommendations for {budget} level (Budget: ₱2K-8K, Moderate: ₱8K-20K, Luxury: ₱20K+)
5. Consider {travelers} type for activities and accommodations
6. Use https://images.unsplash.com/ URLs for all images
7. Include realistic pricing in Philippine pesos
8. Ensure valid JSON format with proper commas and brackets

SPECIFIC REQUESTS: {specificRequests}

Generate ONLY valid JSON, no additional text.`;
