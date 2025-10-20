# TravelRover - AI Travel Planning App

**Stack**: React 19 + Vite, Django REST API, LangGraph Multi-Agent System, Firebase
**Purpose**: Generate personalized travel itineraries using AI agents and real-time data

## Development Setup

Frontend
npm run dev # localhost:5173

Backend
cd travel-backend
python manage.py runserver # localhost:8000

text

## Key Architecture

**Frontend** (`src/`):

- `create-trip/index.jsx` - 5-step trip creation wizard
- `user-profile/index.jsx` - User profiling with auto-population
- `view-trip/[tripId]/index.jsx` - Trip display
- `config/langGraphAgent.jsx` - Django API adapter
- `constants/options.jsx` - Validation rules & constants

**Backend** (`travel-backend/langgraph_agents/`):

- `services/orchestration_service.py` - Multi-agent coordinator
- `agents/` - FlightAgent (SerpAPI), HotelAgent (Google Places), CoordinatorAgent
- `views.py` - `/api/langgraph/execute/` endpoint
- Database logging via `TravelPlanningSession` model

**Data Flow**: User input → Profile auto-population → LangGraph orchestration → AI generation → Firebase storage

## Design System (src/index.css)

**Brand Colors**:
--brand-sky: #0ea5e9 /_ Primary sky blue /
--brand-blue: #0284c7 / Primary blue _/

text

**Core Classes**:

- `.brand-gradient` - Sky to blue gradient background
- `.brand-gradient-text` - Gradient text effect
- `.brand-card` - Glassmorphic card with backdrop blur
- `.brand-button` - Styled button with gradient

**Standard Patterns**:

- Headers: `text-2xl font-bold brand-gradient-text mb-3`
- Info Cards: `brand-card p-5 shadow-lg border-sky-200`
- Selection States: `border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50`
- Icons: `brand-gradient p-2.5 rounded-full` with white icons
- Primary Buttons: `brand-button px-6 py-2` (cursor-pointer included)
- Ghost Buttons: `variant="ghost" cursor-pointer` (explicit cursor needed)
- Interactive Cards: `brand-card cursor-pointer` (or conditional cursor)

**Rules**:

- Always use `brand-gradient` instead of custom purple/pink gradients
- Selection states use sky-500 borders, not blue-500
- All text gradients use `brand-gradient-text` class
- All actionable buttons must have visible pointer cursor
- `brand-button` class includes cursor-pointer automatically
- Ghost/variant buttons need explicit `cursor-pointer` class
- Disabled buttons automatically show `cursor-not-allowed`

## File Naming Conventions

- React components: PascalCase (`TripCreation.jsx`)
- Utilities/configs: camelCase (`langGraphAgent.jsx`)
- Django apps: snake_case (`langgraph_agents/`)
- Constants: UPPER_SNAKE_CASE (`API_CONFIG`)

## Import Organization

// 1. React/Third-party
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Internal components
import { LocationSelector } from "./components/LocationSelector";

// 3. Services/Utils
import { validateTripParams } from "../utils/validators";

// 4. Constants/Data
import { BUDGET_OPTIONS } from "../constants/options";

text

## API Response Format

All APIs return consistent structure:
{
success: boolean,
data?: any,
error?: string,
error_type?: 'validation' | 'agent_error' | 'internal_error'
}

text

## Critical Integrations

**Google Gemini AI**: Generate JSON itineraries (`src/config/aimodel.jsx`)
**Google Places API**: Hotel search (HotelAgent)
**SerpAPI**: Real-time flight search (FlightAgent)
**Firebase/Firestore**: Auth + storage (`AITrips`, `UserProfiles` collections)

## Environment Variables

**Frontend** (`.env`):
VITE_GOOGLE_PLACES_API_KEY=
VITE_GOOGLE_GEMINI_AI_API_KEY=
VITE_GOOGLE_AUTH_CLIENT_ID=
VITE_API_BASE_URL=

text

**Backend** (`travel-backend/.env`):
SERPAPI_KEY=
GOOGLE_PLACES_API_KEY=
DJANGO_SECRET_KEY=
DEBUG=True

text

## Common Tasks

**Adding New Agent**:
from ..agents.base_agent import BaseAgent

class NewAgent(BaseAgent):
def \_validate_input(self, input_data):
return input_data

text
async def \_execute_logic(self, input_data):
return {"results": [...]}
text

**Adding UI Step**:
// 1. Create component in src/components/
// 2. Add to STEP_CONFIGS in constants/options.jsx
// 3. Use brand styling: brand-card, brand-gradient-text

text

## Best Practices

✅ **Do**:

- Use backend proxy for all API calls (never expose keys in frontend)
- Wrap LangGraph calls with error handling and fallbacks
- Use centralized validation from `constants/options.jsx`
- Auto-populate from user profile when available
- Use specific loading states (not blocking entire UI)

❌ **Don't**:

- Expose API keys in frontend code
- Use custom gradients (use brand classes)
- Block entire UI during async operations
- Ignore profile auto-population
- Mix ordered/unordered lists

## Debugging

**Frontend Issues**:

- Check `src/config/langGraphAgent.jsx` for API base URL
- Verify Django server running on localhost:8000
- Check browser network tab for 403/401 errors

**Backend Issues**:

- Check Django logs for agent execution errors
- Verify API keys in .env file
- Test health endpoint: `/api/langgraph/health/`

**Common Errors**:

- JSON parsing: Enhanced cleanup in `create-trip/index.jsx`
- CORS: Verify `CORS_ALLOWED_ORIGINS` in Django settings
- 408 Timeout: Check API key validity and request size

---

**Usage**: Reference for TravelRover architecture. Respond with direct, actionable solutions.
