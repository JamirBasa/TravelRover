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
  const getLoadingMessage = () => {
    if (langGraphLoading) return "🤖 LangGraph optimizing...";
    if (flightLoading) return "✈️ Searching flights...";
    if (hotelLoading) return "🏨 Finding hotels...";
    return "🎉 Generating trip...";
  };

  const isAnyLoading =
    loading || flightLoading || hotelLoading || langGraphLoading;

  return (
    <Button
      disabled={isAnyLoading || disabled}
      onClick={onClick}
      className="brand-button flex items-center gap-2 px-8 py-3 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
    >
      {isAnyLoading ? (
        <>
          <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
          {getLoadingMessage()}
        </>
      ) : (
        <>
          <FaRocket />
          Generate My Trip
        </>
      )}
    </Button>
  );
}

export default GenerateTripButton;
