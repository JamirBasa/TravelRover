import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function EmptyState({ userTrips, clearFilters }) {
  const navigate = useNavigate();

  if (userTrips.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">✈️</div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            No trips yet
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Ready to explore the world? Start planning your next adventure by
            creating your first trip!
          </p>
          <Button
            onClick={() => navigate("/create-trip")}
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600"
          >
            Create Your First Trip
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          No trips match your filters
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Try adjusting your search or filter criteria to find trips.
        </p>
        <Button
          variant="outline"
          onClick={clearFilters}
          className="px-8 py-3"
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  );
}

export default EmptyState;