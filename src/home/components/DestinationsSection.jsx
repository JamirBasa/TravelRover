import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";

function DestinationsSection() {
  const [destinations, setDestinations] = useState([
    {
      id: 1,
      name: "Baguio",
      desc: "3 days trip from ₱5,000",
      image: "/placeholder.png",
      searchQuery: "Baguio City Philippines"
    },
    {
      id: 2,
      name: "Cebu",
      desc: "5 days trip from ₱8,000", 
      image: "/placeholder.png",
      searchQuery: "Cebu City Philippines"
    },
    {
      id: 3,
      name: "Palawan",
      desc: "7 days trip from ₱12,000",
      image: "/placeholder.png", 
      searchQuery: "Palawan Philippines"
    },
  ]);

  useEffect(() => {
    const fetchDestinationImages = async () => {
      const updatedDestinations = await Promise.all(
        destinations.map(async (dest) => {
          try {
            const data = { textQuery: dest.searchQuery };
            const response = await GetPlaceDetails(data);
            
            if (response.data.places && response.data.places.length > 0) {
              const place = response.data.places[0];
              if (place.photos && place.photos.length > 0) {
                const photoUrl = PHOTO_REF_URL.replace("{NAME}", place.photos[0].name);
                return { ...dest, image: photoUrl };
              }
            }
          } catch (error) {
            console.error(`Error fetching image for ${dest.name}:`, error);
          }
          return dest;
        })
      );
      setDestinations(updatedDestinations);
    };

    fetchDestinationImages();
  }, []);

  return (
    <section className="mt-16 px-6 md:px-20">
      <h2 className="font-bold text-2xl mb-6">Popular Destinations</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {destinations.map((dest) => (
          <div
            key={dest.id}
            className="rounded-xl overflow-hidden shadow hover:shadow-lg transition"
          >
            <img
              src={dest.image}
              alt={dest.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.src = "/placeholder.png";
              }}
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg">{dest.name}</h3>
              <p className="text-gray-500 text-sm">{dest.desc}</p>
              <Button className="mt-4 w-full cursor-pointer">View Details</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DestinationsSection;