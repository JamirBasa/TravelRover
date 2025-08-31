const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI({ apiKey });

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "appplication/json",
};

   export const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const chatSession = model.startChat({
        generationConfig,
        history: [
            {
                role: "user",
                parts: [
                    {
                        text: "Generate Travel Plan for Location: Cebu Philippines, Currency PHP, for 3 Days for Couple with a Cheap budget. Give me a Hotels options list with HotelName, Hotel address, Price, hotel image url, geo coordinates, rating, descriptions and suggest itinerary with placeName, Place Details, Place Image Url, Geo Coordinates, rating, ticket Pricing, Time travel each of the location for 3 days with each day plan with best time to visit in JSON format."
                    }
                ],
            },
            {
                role: "model",
                parts: [
                    {
                        text: `{
  "travelPlan": {
    "location": "Cebu, Philippines",
    "currency": "PHP",
    "days": 3,
    "travelers": "Couple",
    "budget": "Cheap",
    "hotels": [
      {
        "hotelName": "HappyNest Hostel Cebu",
        "hotelAddress": "Unit 102, Escario Central, N. Escario St, Cebu City, 6000 Cebu",
        "pricePerNight": "PHP 800 - 1200",
        "imageUrl": "https://example.com/happynest-hostel.jpg",
        "geoCoordinates": {
          "latitude": 10.3235,
          "longitude": 123.9014
        },
        "rating": 8.5,
        "description": "A vibrant and budget-friendly hostel with private rooms available, perfect for couples. Offers clean facilities, a common area, and good access to public transport."
      },
      {
        "hotelName": "Mad Monkey Cebu City",
        "hotelAddress": "Don Julio Llorente St, Cebu City, 6000 Cebu",
        "pricePerNight": "PHP 900 - 1300",
        "imageUrl": "https://example.com/madmonkey-cebu.jpg",
        "geoCoordinates": {
          "latitude": 10.3090,
          "longitude": 123.8969
        },
        "rating": 8.2,
        "description": "Known for its social atmosphere, this hostel also offers private rooms. Features a rooftop bar and restaurant, great for meeting other travelers."
      },
      {
        "hotelName": "Hotel Sogo Cebu",
        "hotelAddress": "Sanciangko St, Cebu City, 6000 Cebu",
        "pricePerNight": "PHP 700 - 1100",
        "imageUrl": "https://example.com/hotel-sogo-cebu.jpg",
        "geoCoordinates": {
          "latitude": 10.2941,
          "longitude": 123.9018
        },
        "rating": 7.5,
        "description": "A no-frills hotel chain offering basic, clean rooms at very affordable prices. Good for couples looking for a private space on a tight budget."
      }
    ],
    "itinerary": [
      {
        "day": 1,
        "theme": "Historical & City Exploration",
        "plan": [
          {
            "placeName": "Magellan's Cross",
            "placeDetails": "A historical marker in Cebu City, believed to be planted by Ferdinand Magellan upon his arrival in 1521. It's housed in a chapel next to the Basilica Minore del Santo Niño.",
            "imageUrl": "https://example.com/magellans-cross.jpg",
            "geoCoordinates": {
              "latitude": 10.2933,
              "longitude": 123.9025
            },
            "rating": 4.0,
            "ticketPricing": "Free",
            "timeTravel": "30 minutes - 1 hour",
            "bestTimeToVisit": "Morning (9:00 AM - 10:00 AM) to avoid crowds"
          },
          {
            "placeName": "Basilica Minore del Santo Niño",
            "placeDetails": "One of the oldest Roman Catholic churches in the Philippines, housing the revered Santo Niño de Cebu (Child Jesus) image. A significant pilgrimage site.",
            "imageUrl": "https://example.com/santo-nino-basilica.jpg",
            "geoCoordinates": {
              "latitude": 10.2934,
              "longitude": 123.9023
            },
            "rating": 4.5,
            "ticketPricing": "Free (donations welcome)",
            "timeTravel": "1 - 2 hours",
            "bestTimeToVisit": "Morning after Magellan's Cross"
          },
          {
            "placeName": "Fort San Pedro",
            "placeDetails": "The smallest and oldest triangular fort in the Philippines, built by the Spanish. Offers a glimpse into Cebu's colonial past and provides good views.",
            "imageUrl": "https://example.com/fort-san-pedro.jpg",
            "geoCoordinates": {
              "latitude": 10.2917,
              "longitude": 123.9034
            },
            "rating": 3.8,
            "ticketPricing": "PHP 30 (approx. $0.60)",
            "timeTravel": "1 - 1.5 hours",
            "bestTimeToVisit": "Late morning before lunch"
          },
          {
            "placeName": "Colon Street",
            "placeDetails": "The oldest street in the Philippines. A bustling commercial area, good for experiencing local life and finding cheap street food and souvenirs.",
            "imageUrl": "https://example.com/colon-street.jpg",
            "geoCoordinates": {
              "latitude": 10.2961,
              "longitude": 123.9048
            },
            "rating": 3.0,
            "ticketPricing": "Free (shopping expenses extra)",
            "timeTravel": "1 - 2 hours",
            "bestTimeToVisit": "Afternoon (2:00 PM - 4:00 PM)"
          },
          {
            "placeName": "Temple of Leah",
            "placeDetails": "A grand, Roman-inspired temple built as a symbol of undying love. Offers panoramic views of Cebu City, especially beautiful during sunset.",
            "imageUrl": "https://example.com/temple-of-leah.jpg",
            "geoCoordinates": {
              "latitude": 10.3643,
              "longitude": 123.8741
            },
            "rating": 4.2,
            "ticketPricing": "PHP 120 (approx. $2.40)",
            "timeTravel": "1.5 - 2 hours (including travel)",
            "bestTimeToVisit": "Late afternoon (4:00 PM - 6:00 PM) for sunset views"
          }
        ]
      },
      {
        "day": 2,
        "theme": "Island Hopping & Beach Relaxation",
        "plan": [
          {
            "placeName": "Mactan Island Hopping Tour",
            "placeDetails": "Explore nearby islands like Olango Island, Nalusuan Island, and Hilutungan Island. Enjoy snorkeling, swimming, and fresh seafood lunch. Many tour operators offer group tours.",
            "imageUrl": "https://example.com/mactan-island-hopping.jpg",
            "geoCoordinates": {
              "latitude": 10.2996,
              "longitude": 124.0170
            },
            "rating": 4.7,
            "ticketPricing": "PHP 1000 - 1500 per person (approx. $20 - $30) for a group tour including lunch and gear rental.",
            "timeTravel": "Full day (8:00 AM - 5:00 PM)",
            "bestTimeToVisit": "Early morning for departure (7:00 AM - 8:00 AM)"
          },
          {
            "placeName": "Virgin Island (if part of tour)",
            "placeDetails": "A beautiful sandbar that emerges during low tide, known for its pristine white sand and clear waters. Often a stop on island hopping tours.",
            "imageUrl": "https://example.com/virgin-island.jpg",
            "geoCoordinates": {
              "latitude": 10.2600,
              "longitude": 124.0900
            },
            "rating": 4.8,
            "ticketPricing": "Included in tour package",
            "timeTravel": "1 - 2 hours",
            "bestTimeToVisit": "Depends on low tide schedule"
          },
          {
            "placeName": "Mactan Shrine",
            "placeDetails": "A historical site commemorating the Battle of Mactan, where Lapu-Lapu defeated Magellan. Features a statue of Lapu-Lapu and a monument to Magellan.",
            "imageUrl": "https://example.com/mactan-shrine.jpg",
            "geoCoordinates": {
              "latitude": 10.3100,
              "longitude": 124.0044
            },
            "rating": 3.9,
            "ticketPricing": "Free",
            "timeTravel": "30 minutes - 1 hour",
            "bestTimeToVisit": "Late afternoon after island hopping"
          }
        ]
      },
      {
        "day": 3,
        "theme": "Nature & Adventure (South Cebu)",
        "plan": [
          {
            "placeName": "Oslob Whale Shark Watching (Optional)",
            "placeDetails": "Swim with gentle giant whale sharks. This activity is controversial for its environmental impact and should be thoroughly researched before participating. Alternative: Sumilon Island sandbar.",
            "imageUrl": "https://example.com/oslob-whale-shark.jpg",
            "geoCoordinates": {
              "latitude": 9.4526,
              "longitude": 123.3855
            },
            "rating": 4.0,
            "ticketPricing": "PHP 1000 - 1500 (approx. $20 - $30) for foreign nationals",
            "timeTravel": "4-5 hours (including travel from Cebu City, plus activity time)",
            "bestTimeToVisit": "Very early morning (5:00 AM - 6:00 AM) for best chances and to avoid crowds. This is a very long day trip."
          },
          {
            "placeName": "Tumalog Falls (near Oslob)",
            "placeDetails": "A beautiful, curtain-like waterfall known for its refreshing cool waters. Often visited in conjunction with whale shark watching.",
            "imageUrl": "https://example.com/tumalog-falls.jpg",
            "geoCoordinates": {
              "latitude": 9.4975,
              "longitude": 123.3550
            },
            "rating": 4.3,
            "ticketPricing": "PHP 20 (approx. $0.40) entrance, PHP 50 (approx. $1) for habal-habal (motorcycle taxi) ride to falls",
            "timeTravel": "1.5 - 2 hours (including travel and swimming)",
            "bestTimeToVisit": "Morning after whale shark watching"
          },
          {
            "placeName": "Kawasan Falls (Canyoneering)",
            "placeDetails": "Famous for its turquoise waters and canyoneering adventure. Jump, swim, and slide through several waterfalls. An exhilarating experience, but requires good physical fitness.",
            "imageUrl": "https://example.com/kawasan-falls.jpg",
            "geoCoordinates": {
              "latitude": 9.8058,
              "longitude": 123.3644
            },
            "rating": 4.6,
            "ticketPricing": "PHP 1500 - 2500 (approx. $30 - $50) for canyoneering package with guide and gear",
            "timeTravel": "3-5 hours for canyoneering (plus 3-4 hours travel from Cebu City one way).",
            "bestTimeToVisit": "Early morning (7:00 AM - 8:00 AM) to start canyoneering"
          },
          {
            "placeName": "Moalboal Panagsama Beach",
            "placeDetails": "A popular spot for diving and snorkeling, known for the 'sardine run' where millions of sardines can be seen close to shore. Less of a sandy beach, more for water activities.",
            "imageUrl": "https://example.com/moalboal-sardine-run.jpg",
            "geoCoordinates": {
              "latitude": 9.9577,
              "longitude": 123.3800
            },
            "rating": 4.4,
            "ticketPricing": "Free (snorkeling/diving gear rental extra)",
            "timeTravel": "2-3 hours (if staying overnight or doing a day trip from Kawasan)",
            "bestTimeToVisit": "Late afternoon/evening if staying in Moalboal"
          }
        ]
      }
    ]
  }
}`
                    }
                ]
            }
        ]
    });
