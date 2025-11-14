// src/create-trip/components/GenerateTripButton.jsx
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaRocket, FaCheck } from "react-icons/fa";

function GenerateTripButton({
  loading,
  flightLoading,
  hotelLoading,
  langGraphLoading,
  onClick,
  disabled = false,
}) {
  // ✅ IMPROVED: More specific status messages with emojis
  const getLoadingMessage = () => {
    if (langGraphLoading) return "� Optimizing itinerary (GA)...";
    if (flightLoading && hotelLoading) return "✈️🏨 Searching options...";
    if (flightLoading) return "✈️ Finding flights...";
    if (hotelLoading) return "🏨 Finding hotels...";
    if (loading) return "🤖 Generating details (AI)...";
    return "🎉 Generating trip...";
  };

  // ✅ NEW: Calculate estimated completion percentage
  const getProgressPercentage = () => {
    let progress = 0;
    if (!langGraphLoading) progress += 30; // GA complete
    if (!flightLoading && !hotelLoading) progress += 20; // Search complete
    if (!loading) progress += 50; // AI generation complete
    return progress;
  };

  // ✅ NEW: Estimate remaining time dynamically
  const getEstimatedTime = () => {
    let seconds = 0;
    if (langGraphLoading) seconds += 45; // ~30-60s for GA
    if (flightLoading || hotelLoading) seconds += 30; // ~20-40s for searches
    if (loading) seconds += 90; // ~60-120s for AI generation

    if (seconds === 0) return "";
    if (seconds < 60) return ` (~${seconds}s)`;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return ` (~${mins}m ${secs}s)`;
  };

  const isAnyLoading =
    loading || flightLoading || hotelLoading || langGraphLoading;
  const progressPct = getProgressPercentage();
  const eta = getEstimatedTime();

  return (
    <Button
      disabled={isAnyLoading || disabled}
      onClick={onClick}
      className="brand-button flex items-center gap-2 px-8 py-3 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
    >
      {/* ✅ NEW: Progress bar background */}
      {isAnyLoading && (
        <div
          className="absolute inset-0 bg-white/20 transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2">
        {isAnyLoading ? (
          <>
            <div style={{ animation: 'spin 1s linear infinite' }}>
              <AiOutlineLoading3Quarters className="h-4 w-4" />
            </div>
            <span className="flex flex-col items-start">
              <span>{getLoadingMessage()}</span>
              {eta && <span className="text-xs opacity-80">{eta}</span>}
            </span>
          </>
        ) : (
          <>
            <FaRocket />
            Generate My Trip
          </>
        )}
      </span>
    </Button>
  );
}

export default GenerateTripButton;
