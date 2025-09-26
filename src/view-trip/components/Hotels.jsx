import React from "react";
import HotelCardItem from "./HotelCardItem";

function Hotels({ trip }) {
  const hotels = trip?.tripData?.tripData?.accommodations || [];

  if (!hotels || hotels.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🏨</div>
        <p className="text-gray-500 text-sm">
          No hotel recommendations available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hotels.map((hotel, index) => (
        <HotelCardItem
          key={hotel?.id || hotel?.name || `hotel-${index}`}
          hotel={hotel}
        />
      ))}
    </div>
  );
}

export default Hotels;
