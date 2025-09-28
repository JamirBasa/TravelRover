# AI Agent Instructions for TravelRover

## Project Overview

TravelRover is a sophisticated travel planning application that combines AI-powered itinerary generation with real-time data from multiple sources. The system features a React + Vite frontend with a Django REST API backend, implementing a **multi-agent LangGraph architecture** for intelligent travel planning.

**Core Purpose**: Generate personalized travel itineraries by orchestrating multiple AI agents (flight search, hotel search, optimization) while maintaining user profiles, preferences, and trip history through Firebase integration.

**Key Innovation**: The LangGraph multi-agent system coordinates parallel API calls to external services (Google Places, SerpAPI) and uses Google Gemini AI to generate comprehensive, culturally-aware travel itineraries in JSON format.

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │ Trip Creation   │ │ User Profile    │ │ Trip Management │  │
│  │ Multi-step Form │ │ Personalization │ │ View/Edit Trips │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ REST API + Firebase
┌─────────────────────┼───────────────────────────────────────────┐
│               BACKEND (Django REST Framework)                  │
│  ┌─────────────────┐ │ ┌─────────────────┐ ┌─────────────────┐  │
│  │ LangGraph Multi │ │ │ Flight Search   │ │ External APIs   │  │
│  │ Agent System    │ │ │ (SerpAPI)       │ │ Google Places   │  │
│  │ • FlightAgent   │ │ │                 │ │ Google Gemini   │  │
│  │ • HotelAgent    │ │ └─────────────────┘ │ Firebase        │  │
│  │ • Coordinator   │ │                     │                 │  │
│  └─────────────────┘ │                     └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Data Flow**: User creates trip → Profile auto-populated → LangGraph agents execute in parallel → External APIs queried → AI generates personalized itinerary → Trip saved to Firebase

**Key Layers**:

- **Presentation**: React components with Tailwind CSS
- **Business Logic**: Services layer with orchestration
- **Agent System**: Modular LangGraph multi-agent architecture
- **External Integration**: Google APIs, Firebase, SerpAPI
- **Data**: Django models + Firebase Firestore

## Essential Developer Knowledge

### Quick Start Commands

```bash
# Frontend Development
npm run dev                    # Start React dev server (localhost:5173)
npm run build                  # Production build
npm run lint                   # ESLint check

# Backend Development
cd travel-backend
python manage.py runserver     # Start Django dev server (localhost:8000)
python manage.py migrate       # Apply database migrations
python manage.py shell         # Django shell for debugging

# Full Stack Development
# Terminal 1: Frontend
npm run dev
# Terminal 2: Backend
cd travel-backend && python manage.py runserver
```

### Key Conventions

**File Naming**:

- React components: PascalCase (`TripCreation.jsx`)
- Utilities/configs: camelCase (`langGraphAgent.jsx`)
- Django apps: snake_case (`langgraph_agents/`)
- Constants: UPPER_SNAKE_CASE (`API_CONFIG`)

**Import Organization**:

```jsx
// 1. React/Third-party
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

// 2. Internal components
import { LocationSelector } from "./components/LocationSelector";

// 3. Services/Utils
import { validateTripParams } from "../utils/validators";

// 4. Constants/Data
import { BUDGET_OPTIONS, TRAVELER_OPTIONS } from "../constants/options";
```

**API Response Format**: All APIs return consistent structure:

```javascript
{
  success: boolean,
  data?: any,
  error?: string,
  error_type?: 'validation' | 'agent_error' | 'internal_error'
}
```

### Critical Paths

**1. Trip Creation Flow** (`src/create-trip/index.jsx`):

- 5-step wizard: Location → Preferences → Flights → Hotels → Review
- Profile auto-population for user preferences
- LangGraph orchestration for real-time data
- Firebase persistence with trip metadata

**2. LangGraph Orchestration** (`travel-backend/langgraph_agents/`):

- Session creation → Agent execution → Result optimization
- Parallel API calls with error handling
- Database logging of all agent activities

**3. User Authentication** (Firebase + Google OAuth):

- Google Sign-In → Profile creation → Personalized experiences
- Trip ownership and sharing permissions

## Component Guide

### Frontend Architecture (`src/`)

**Core Components**:

- `create-trip/index.jsx` - Multi-step trip creation wizard
- `user-profile/index.jsx` - Comprehensive user profiling
- `view-trip/[tripId]/index.jsx` - Trip display and management
- `components/ui/` - Reusable UI components (shadcn/ui based)

**Configuration Layer**:

- `config/langGraphAgent.jsx` - Django API adapter for LangGraph
- `config/aimodel.jsx` - Google Gemini integration
- `constants/options.jsx` - Centralized constants and validation rules

**Key Patterns**:

- **State Management**: React hooks with centralized validation
- **Form Handling**: Multi-step forms with persistent state
- **API Integration**: Axios with error boundaries and loading states
- **Responsive Design**: Mobile-first Tailwind CSS

### Backend Architecture (`travel-backend/`)

**LangGraph Multi-Agent System** (`langgraph_agents/`):

```python
# Services Layer (business logic)
services/
├── orchestration_service.py  # Multi-agent coordination
├── session_service.py        # Session lifecycle management
└── api_client_service.py     # External API integrations

# Agent Implementations
agents/
├── base_agent.py            # Abstract base with logging
├── coordinator.py           # Execution planning & optimization
├── flight_agent.py          # SerpAPI flight search
└── hotel_agent.py           # Google Places hotel search

# Utilities
utils/
├── logger.py                # Structured logging
├── validators.py            # Data validation
└── formatters.py            # Response formatting
```

**Django Apps**:

- `langgraph_agents/` - AI orchestration system
- `flights/` - Flight search endpoints (legacy)
- `travelapi/` - Main Django project configuration

## Integration Points

### External APIs

**Google Gemini AI** (`VITE_GOOGLE_GEMINI_AI_API_KEY`):

- **Purpose**: Generate JSON travel itineraries
- **Usage**: `src/config/aimodel.jsx` - Chat session with structured prompts
- **Input**: Trip parameters + user preferences + real data
- **Output**: Complete JSON itinerary with hotels, activities, coordinates

**Google Places API** (`GOOGLE_PLACES_API_KEY`):

- **Purpose**: Hotel search and location data
- **Usage**: Hotel agent in LangGraph system
- **Rate Limits**: Managed in `api_client_service.py`

**SerpAPI** (`SERPAPI_KEY`):

- **Purpose**: Real-time flight search
- **Usage**: Flight agent for Google Flights data
- **Fallback**: Mock data when unavailable

**Firebase/Firestore**:

- **Purpose**: User authentication + trip storage
- **Collections**: `AITrips`, `UserProfiles`
- **Security**: User-owned documents with email-based access

### Configuration Management

**Frontend Environment** (`.env`):

```bash
VITE_GOOGLE_PLACES_API_KEY=      # Google Places integration
VITE_GOOGLE_GEMINI_AI_API_KEY=   # AI itinerary generation
VITE_GOOGLE_AUTH_CLIENT_ID=      # Google OAuth
VITE_API_BASE_URL=               # Django backend URL
# Firebase config variables...
```

**Backend Environment** (`travel-backend/.env`):

```bash
SERPAPI_KEY=                     # Flight search
GOOGLE_PLACES_API_KEY=           # Hotel search
DJANGO_SECRET_KEY=               # Django security
DEBUG=True                       # Development mode
```

## Common Tasks

### Adding a New Agent

```python
# 1. Create agent class
from ..agents.base_agent import BaseAgent

class NewAgent(BaseAgent):
    def _validate_input(self, input_data):
        # Add validation logic
        return input_data

    async def _execute_logic(self, input_data):
        # Implementation
        return {"results": [...]}

# 2. Register in orchestration_service.py
from ..agents.new_agent import NewAgent

class OrchestrationService:
    def __init__(self):
        self.new_agent = NewAgent()

    async def _execute_parallel_agents(self, session_id, plan):
        # Add agent to parallel execution
```

### Adding UI Components

```jsx
// 1. Create in src/components/
export const NewComponent = ({ data, onChange }) => {
  return <div className="space-y-4">{/* Implementation */}</div>;
};

// 2. Add to step configuration in constants/options.jsx
export const STEP_CONFIGS = {
  CREATE_TRIP: [
    // existing steps...
    {
      id: 6,
      title: "New Step",
      component: "NewComponent",
    },
  ],
};
```

### Extending User Profile

```jsx
// 1. Add fields to user-profile components
// 2. Update validation in utils/validators.js
// 3. Add to Firebase document structure
// 4. Update auto-population logic in config/userProfile.js
```

## Debugging & Troubleshooting

### Frontend Issues

**LangGraph Connection Errors**:

```javascript
// Check src/config/langGraphAgent.jsx
console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);
// Verify Django server is running on localhost:8000
```

**Firebase Authentication**:

```javascript
// Check browser network tab for 403/401 errors
// Verify Google OAuth configuration
// Check Firebase console for project settings
```

**Profile Auto-Population Not Working**:

```javascript
// Check src/config/userProfile.js
// Verify user profile completeness
// Check browser console for validation errors
```

### Backend Issues

**LangGraph Agent Failures**:

```python
# Check Django logs for agent execution errors
# Verify API keys in .env file
# Use health check endpoint: /api/langgraph/health/
```

**Database Issues**:

```bash
# Reset database
python manage.py flush
python manage.py migrate
```

**API Key Problems**:

```python
# Check settings.py configuration
# Verify .env file exists and is loaded
# Test API connections manually
```

### Common Error Patterns

**JSON Parsing Errors in Trip Generation**:

- **Cause**: AI response contains invalid JSON
- **Solution**: Enhanced cleanup logic in `create-trip/index.jsx`
- **Prevention**: Improved AI prompts with strict JSON requirements

**CORS Errors**:

- **Cause**: Frontend/backend URL mismatch
- **Solution**: Verify `CORS_ALLOWED_ORIGINS` in Django settings
- **Check**: Environment variables match actual server ports

## Testing Guidelines

### Frontend Testing

```bash
# Manual testing checklist
1. Trip creation flow (all 5 steps)
2. Profile auto-population
3. LangGraph integration
4. Error handling (network failures)
5. Mobile responsive design
```

### Backend Testing

```python
# Test LangGraph agents
from langgraph_agents.services import OrchestrationService

service = OrchestrationService()
result = await service.execute_workflow(
    "test@example.com",
    {"destination": "Test Location", ...}
)
```

### API Testing

```bash
# Health checks
curl http://localhost:8000/api/langgraph/health/
curl http://localhost:5173/  # Frontend health
```

## Performance & Security Notes

### Performance Considerations

**LangGraph Optimization**:

- Agents execute in parallel (flight + hotel simultaneously)
- Database logging is async to prevent blocking
- API responses are cached when possible
- Large JSON responses are paginated

**Frontend Performance**:

- Code splitting with React.lazy() for large components
- Debounced input for location search (300ms)
- Optimistic UI updates for better perceived performance
- Image lazy loading for trip galleries

### Security Best Practices

**API Security**:

- All external API keys are server-side only
- Django CSRF protection enabled
- CORS properly configured for production
- Input validation on all endpoints

**Data Protection**:

- User trips are private by default (email-based ownership)
- No sensitive data in localStorage
- Firebase security rules enforce user access
- Environment variables for all secrets

## Gotchas & Anti-patterns

### ❌ Common Mistakes

**1. Direct API Key Usage in Frontend**:

```jsx
// ❌ NEVER do this
const apiKey = "AIzaSy..."; // Exposed to users!

// ✅ Always use backend proxy
const response = await fetch("/api/langgraph/execute/");
```

**2. Blocking UI During LangGraph Execution**:

```jsx
// ❌ Don't block entire UI
setLoading(true);

// ✅ Use specific loading states
setLangGraphLoading(true);
setFlightLoading(true);
```

**3. Ignoring Profile Auto-Population**:

```jsx
// ❌ Manual form filling
<input placeholder="Enter departure city" />;

// ✅ Auto-populate from profile
const departureCity = extractDepartureFromProfile(userProfile);
```

### ✅ Best Practices

**1. Error Boundary Pattern**:

```jsx
// Always wrap LangGraph calls with error handling
try {
  const result = await langGraphAgent.orchestrateTrip(params);
} catch (error) {
  return createFallbackResults(params);
}
```

**2. Consistent State Management**:

```jsx
// Use centralized validation
const validatedData = validateTripParams(formData);
if (!validatedData.isValid) {
  toast.error(validatedData.error);
  return;
}
```

**3. Modular Agent Architecture**:

```python
# Always extend BaseAgent for consistency
class CustomAgent(BaseAgent):
    def _validate_input(self, data):
        return validate_custom_data(data)

    async def _execute_logic(self, data):
        self.log_execution_start("custom_operation")
        # Implementation
```

### 🔧 Development Tips

- **Use Django shell** for testing agent logic without frontend
- **Check browser network tab** for API response debugging
- **Monitor Django logs** for LangGraph execution traces
- **Test with mock data** when external APIs are rate-limited
- **Profile components** are auto-populated - verify completeness first
- **Multi-step forms** maintain state across navigation
- **Firebase collections** use email-based document IDs for security

### 📱 Mobile Development Notes

- All forms are mobile-responsive (Tailwind CSS)
- Touch-friendly button sizes (min 44px)
- Swipe gestures for step navigation
- Optimized image loading for mobile networks
- Progressive Web App (PWA) capabilities planned

This documentation transforms any AI agent into a TravelRover expert, providing the context needed to understand the codebase architecture, make meaningful contributions, and avoid common pitfalls.
