# TravelRover - AI Travel Planning App

**Stack**: React 19 + Vite, Django REST API, LangGraph Multi-Agent System, Firebase

## Architecture

**Frontend** (`src/`):

- `create-trip/index.jsx` - 5-step trip wizard
- `set-profile/index.jsx` - User profiling with auto-population
- `view-trip/[tripId]/index.jsx` - Trip display with maps, hotels, activities
- `config/langGraphAgent.jsx` - Django API adapter
- `constants/options.jsx` - Validation rules & constants

**Backend** (`travel-backend/langgraph_agents/`):

- `services/orchestration_service.py` - Multi-agent coordinator
- `agents/` - FlightAgent (SerpAPI), HotelAgent (Google Places), CoordinatorAgent
- `views.py` - `/api/langgraph/execute/` endpoint

**Data Flow**: User input → Profile auto-population → LangGraph orchestration → AI generation → Firebase storage

## Design System

**Brand Colors**: `--brand-sky: #0ea5e9`, `--brand-blue: #0284c7`

**Core Classes**:

- `.brand-gradient` - Sky to blue gradient (use instead of custom gradients)
- `.brand-gradient-text` - Gradient text effect
- `.brand-card` - Glassmorphic card with backdrop blur
- `.brand-button` - Styled button with gradient (includes cursor-pointer)

**Key Rules**:

- Selection states: `border-sky-500` (not blue-500)
- All actionable elements need `cursor-pointer` (brand-button has it, ghost buttons don't)
- Headers: `text-2xl font-bold brand-gradient-text mb-3`
- Cards: `brand-card p-5 shadow-lg border-sky-200`

## Critical Integrations

- **Google Gemini AI**: Generate JSON itineraries (`src/config/aimodel.jsx`)
- **Google Places API**: Hotel enrichment with real amenities/reviews
- **SerpAPI**: Real-time flight search
- **Firebase/Firestore**: Auth + storage (`AITrips`, `UserProfiles` collections)

**API Response Format**: All APIs return `{ success: boolean, data?: any, error?: string }`

## Key Patterns

**Activity Classification** (`src/utils/activityClassifier.js`):

- Logistics items (meals, transit, hotel ops) excluded from activity counts
- Day 1: max 2 activities, Last day: 1-2 activities, Middle days: 3-5 activities
- Auto-fix and validator use same classification logic

**Hotel Data Flow**:

1. AI generates 3-5 hotels with pricing tiers (Budget ₱1,500-2,500, Mid-range ₱2,500-5,000, Upscale ₱5,000+)
2. `AccommodationVerification.js` verifies against database
3. Google Places API enriches with real amenities/reviews/ratings
4. Priority: Real API data > AI data > Fallback defaults

**Map Routes** (`OptimizedRouteMap.jsx`):

- Travel times only shown between same-day consecutive locations
- Day boundaries prevent cross-day travel connectors
- AI-recommended travel times from `timeTravel` field in itinerary

## File Conventions

- React components: PascalCase (`TripCreation.jsx`)
- Utilities: camelCase (`langGraphAgent.jsx`)
- Django: snake_case (`langgraph_agents/`)

## Best Practices

✅ **Do**: Backend proxy for API calls, centralized validation, auto-populate from profile
❌ **Don't**: Expose API keys in frontend, use custom gradients, block entire UI during async ops

## Quick Debug

- Frontend: Check `langGraphAgent.jsx` base URL, verify Django on :8000
- Backend: Check Django logs, verify API keys in `.env`, test `/api/langgraph/health/`
- Common: JSON parsing in `create-trip/index.jsx`, CORS settings, 408 timeout = invalid API key
