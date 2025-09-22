// src/create-trip/components/GenerateTripButton.jsx
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function GenerateTripButton({ 
  loading, 
  flightLoading, 
  onClick, 
  disabled = false 
}) {
  return (
    <div className="my-10 flex justify-end">
      <Button 
        disabled={loading || flightLoading || disabled} 
        onClick={onClick}
        className="px-8 py-3"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
            {flightLoading ? "Searching flights..." : "Generating trip..."}
          </div>
        ) : (
          "Generate Trip"
        )}
      </Button>
    </div>
  );
}

export default GenerateTripButton;