// src/view-trip/components/LoadingState.jsx
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <AiOutlineLoading3Quarters className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-700">
            Loading your adventure...
          </h2>
          <p className="text-gray-500 mt-2">
            Preparing your personalized itinerary
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingState;
