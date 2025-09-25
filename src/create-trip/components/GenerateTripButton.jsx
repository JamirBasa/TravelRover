// src/create-trip/components/GenerateTripButton.jsx
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaRocket, FaCheck } from "react-icons/fa";

function GenerateTripButton({
  loading,
  flightLoading,
  onClick,
  disabled = false,
}) {
  return (
    <Button
      disabled={loading || flightLoading || disabled}
      onClick={onClick}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3"
    >
      {loading ? (
        <>
          <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
          {flightLoading ? "Searching flights..." : "Generating trip..."}
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
