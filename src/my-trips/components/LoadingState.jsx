import React from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function LoadingState() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AiOutlineLoading3Quarters className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your trips...</p>
        </div>
      </div>
    </div>
  );
}

export default LoadingState;