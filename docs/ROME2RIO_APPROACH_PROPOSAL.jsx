/**
 * PROPOSAL: Enhanced Travel Services Selector (Rome2Rio Style)
 *
 * CURRENT PROBLEM:
 * - Binary flight toggle (on/off) hides ground transport options
 * - No cost comparison visible during selection
 * - User can't see trade-offs before deciding
 *
 * ROME2RIO APPROACH:
 * - Shows ALL transport options simultaneously
 * - Displays time + cost + convenience ratings
 * - Pre-selects recommended option but allows override
 * - Clear comparison matrix
 *
 * RECOMMENDED CHANGES FOR TRAVELROVER:
 */

// ============================================
// OPTION 1: "SMART RECOMMENDATION" (RECOMMENDED)
// ============================================
// Best balance of simplicity + flexibility

const SmartRecommendationApproach = () => {
  return (
    <div className="space-y-6">
      {/* 1. AI RECOMMENDATION CARD (Prominent) */}
      <div className="brand-card p-6 border-3 border-sky-400 bg-gradient-to-r from-sky-50 to-blue-50">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🎯</span>
          <div>
            <h3 className="font-bold text-lg brand-gradient-text">
              Recommended for You: Direct Flight
            </h3>
            <p className="text-sm text-gray-600">
              Based on Zamboanga → Ozamiz (241 km)
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-sky-600">3-4 hrs</div>
            <div className="text-xs text-gray-600">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">₱2.5-4k</div>
            <div className="text-xs text-gray-600">Estimated Cost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">⭐⭐⭐⭐⭐</div>
            <div className="text-xs text-gray-600">Convenience</div>
          </div>
        </div>

        {/* Accept Recommendation Button */}
        <button className="w-full brand-button py-3 mb-2">
          ✓ Use Recommended Option (Flight)
        </button>

        {/* View All Options Link */}
        <button className="w-full text-sm text-sky-600 hover:text-sky-700 underline">
          Or view all transport options ↓
        </button>
      </div>

      {/* 2. ALL OPTIONS (Collapsible/Expandable) */}
      <details className="brand-card p-5">
        <summary className="cursor-pointer font-bold flex items-center gap-2">
          <span>📊 Compare All Options</span>
          <span className="text-xs text-gray-500">(2 more alternatives)</span>
        </summary>

        <div className="mt-4 space-y-3">
          {/* Option A: Direct Flight (Already shown above) */}
          <div className="p-3 border-2 border-sky-300 bg-sky-50 rounded-lg opacity-60">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold">✈️ Direct Flight</div>
                <div className="text-xs text-gray-600">
                  3-4 hrs • ₱2.5-4k • ⭐⭐⭐⭐⭐
                </div>
              </div>
              <span className="text-xs bg-sky-200 px-2 py-1 rounded">
                SELECTED
              </span>
            </div>
          </div>

          {/* Option B: Bus/Van */}
          <button className="w-full p-3 border-2 border-gray-200 hover:border-emerald-400 bg-white rounded-lg text-left transition-all">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold">🚌 Bus/Van (Ground)</div>
                <div className="text-xs text-gray-600">
                  7-8 hrs • ₱550-850 • ⭐⭐⭐ • Saves ₱2,000
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  ✓ Best for budget travelers & groups
                </div>
              </div>
              <span className="text-xs text-gray-400">Click to select</span>
            </div>
          </button>

          {/* Option C: Via Manila (Not Recommended) */}
          <div className="p-3 border-2 border-red-200 bg-red-50 rounded-lg opacity-50">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-600">
                  ✈️🔄 Via Manila (Connecting)
                </div>
                <div className="text-xs text-gray-500">
                  8-12 hrs • ₱5-8k • ⭐⭐
                </div>
                <div className="text-xs text-red-600 mt-1">
                  ✗ Not recommended: Longer & more expensive
                </div>
              </div>
              <span className="text-xs bg-red-100 px-2 py-1 rounded">SKIP</span>
            </div>
          </div>
        </div>
      </details>

      {/* 3. BUDGET IMPACT PREVIEW */}
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <div className="flex items-center gap-2 mb-2">
          <span>💰</span>
          <span className="font-bold text-sm">Budget Impact</span>
        </div>
        <div className="text-xs text-gray-700">
          Direct Flight: +₱2,500-4,000 to total budget
          <br />
          Ground Transport: +₱550-850 to total budget
        </div>
      </div>
    </div>
  );
};

// ============================================
// OPTION 2: "COMPARISON TABLE" (Rome2Rio Style)
// ============================================
// More detailed, better for analytical users

const ComparisonTableApproach = () => {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">
        Select Transport: Zamboanga → Ozamiz
      </h3>

      {/* Comparison Cards */}
      <div className="space-y-3">
        {/* Flight Option */}
        <button className="w-full p-4 border-3 border-sky-400 bg-sky-50 rounded-xl text-left hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✈️</span>
              <div>
                <div className="font-bold text-lg">Direct Flight</div>
                <div className="text-xs text-gray-600">ZAM → OZC</div>
              </div>
            </div>
            <span className="bg-sky-600 text-white px-3 py-1 rounded-full text-xs font-bold">
              RECOMMENDED
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center mb-2">
            <div>
              <div className="text-sm font-bold">3-4 hrs</div>
              <div className="text-[10px] text-gray-600">Time</div>
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-600">₱2.5-4k</div>
              <div className="text-[10px] text-gray-600">Cost</div>
            </div>
            <div>
              <div className="text-sm">⭐⭐⭐⭐⭐</div>
              <div className="text-[10px] text-gray-600">Comfort</div>
            </div>
            <div>
              <div className="text-sm font-bold">Daily</div>
              <div className="text-[10px] text-gray-600">Frequency</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-700">
            <span>✓ Fastest</span>
            <span>✓ Most convenient</span>
            <span>✓ Arrive fresh</span>
          </div>
        </button>

        {/* Bus Option */}
        <button className="w-full p-4 border-2 border-gray-300 hover:border-emerald-400 bg-white rounded-xl text-left hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚌</span>
              <div>
                <div className="font-bold text-lg">Bus/Van</div>
                <div className="text-xs text-gray-600">
                  Via Dipolog coastal route
                </div>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
              BEST VALUE
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center mb-2">
            <div>
              <div className="text-sm font-bold">7-8 hrs</div>
              <div className="text-[10px] text-gray-600">Time</div>
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-600">₱550-850</div>
              <div className="text-[10px] text-gray-600">Cost</div>
            </div>
            <div>
              <div className="text-sm">⭐⭐⭐</div>
              <div className="text-[10px] text-gray-600">Comfort</div>
            </div>
            <div>
              <div className="text-sm font-bold">Hourly</div>
              <div className="text-[10px] text-gray-600">Frequency</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-700">
            <span>✓ Cheapest</span>
            <span>✓ Flexible schedule</span>
            <span>✓ Scenic</span>
          </div>
        </button>

        {/* Via Manila - Collapsed/Dimmed */}
        <div className="p-3 border border-gray-200 bg-gray-50 rounded-lg opacity-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">✈️🔄</span>
              <div>
                <div className="text-sm font-medium text-gray-600">
                  Via Manila
                </div>
                <div className="text-[10px] text-red-600">Not recommended</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">8-12 hrs • ₱5-8k</div>
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
        <div className="text-sm font-medium mb-1">
          ✓ Selected: Direct Flight
        </div>
        <div className="text-xs text-gray-600">
          Budget impact: +₱2,500-4,000 per person
        </div>
      </div>
    </div>
  );
};

// ============================================
// OPTION 3: "TOGGLE WITH ALTERNATIVES" (Hybrid)
// ============================================
// Keeps current UI but shows alternatives

const ToggleWithAlternativesApproach = () => {
  return (
    <div className="space-y-4">
      {/* Current Flight Toggle */}
      <div className="brand-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <FaPlane className="text-2xl text-sky-500" />
            <div>
              <h3 className="font-bold">Flight Search</h3>
              <p className="text-xs text-gray-600">Direct flights available</p>
            </div>
          </div>
          <button className="w-12 h-6 bg-sky-500 rounded-full relative">
            <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
          </button>
        </div>

        {/* NEW: Alternative Option Banner */}
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-emerald-900">
                💰 Save ₱2,000: Take the bus instead?
              </div>
              <div className="text-xs text-gray-600">
                7-8 hrs travel time • Daily departures
              </div>
            </div>
            <button className="text-xs text-emerald-600 font-bold hover:underline">
              Switch →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// RECOMMENDED IMPLEMENTATION PLAN
// ============================================

/**
 * PHASE 1: Quick Win (1-2 days)
 * - Add "View Alternative Options" collapsible section
 * - Show ground transport details even when flight enabled
 * - Display cost comparison banner
 * - Pre-select recommended option
 *
 * PHASE 2: Enhanced UX (3-5 days)
 * - Implement full comparison cards
 * - Add "Why recommended" explanations
 * - Show budget impact preview
 * - Add traveler profile considerations (business vs budget)
 *
 * PHASE 3: Advanced Features (1 week)
 * - Multi-criteria sorting (time/cost/convenience)
 * - "Optimize for: [Time/Cost/Comfort]" toggle
 * - Show real-time availability
 * - Add booking links
 *
 * KEY PRINCIPLES FROM ROME2RIO:
 * 1. Transparency - Show ALL options, not just recommended
 * 2. Empowerment - Let user choose based on THEIR priorities
 * 3. Context - Explain WHY each option is good/bad
 * 4. Flexibility - Pre-select smart default but allow override
 * 5. Comparison - Make trade-offs crystal clear
 */

// ============================================
// WHAT TO CHANGE IN TravelServicesSelector.jsx
// ============================================

/**
 * MINIMAL CHANGES (Quick Implementation):
 *
 * 1. Change flight toggle behavior:
 *    - Don't hide ground transport when flight enabled
 *    - Show both options simultaneously
 *
 * 2. Add comparison banner after transport analysis:
 *    ```jsx
 *    {transportAnalysis && (
 *      <div className="grid grid-cols-2 gap-3">
 *        <TransportOptionCard
 *          type="flight"
 *          time="3-4 hrs"
 *          cost="₱2.5-4k"
 *          recommended={true}
 *          selected={flightData.includeFlights}
 *        />
 *        <TransportOptionCard
 *          type="ground"
 *          time="7-8 hrs"
 *          cost="₱550-850"
 *          recommended={false}
 *          selected={!flightData.includeFlights}
 *        />
 *      </div>
 *    )}
 *    ```
 *
 * 3. Add "searchGroundTransport" flag (parallel to includeFlights):
 *    - User can enable BOTH flight AND ground search
 *    - Backend shows both options in itinerary
 *    - Let user book whichever they prefer
 *
 * 4. Show budget impact immediately:
 *    - "Choosing flights adds ₱2,500-4,000 to your budget"
 *    - "Choosing ground saves ₱2,000 but adds 4 hours"
 */

export {
  SmartRecommendationApproach,
  ComparisonTableApproach,
  ToggleWithAlternativesApproach,
};
