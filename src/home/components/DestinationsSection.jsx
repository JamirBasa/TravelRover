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
      searchQuery: "Baguio City Philippines",
    },
    {
      id: 2,
      name: "Cebu",
      desc: "5 days trip from ₱8,000",
      image: "/placeholder.png",
      searchQuery: "Cebu City Philippines",
    },
    {
      id: 3,
      name: "Palawan",
      desc: "7 days trip from ₱12,000",
      image: "/placeholder.png",
      searchQuery: "Palawan Philippines",
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
                const photoUrl = PHOTO_REF_URL.replace(
                  "{NAME}",
                  place.photos[0].name
                );
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
    <section className="pt-16 pb-20 px-6 md:px-20 max-w-6xl mx-auto relative">
      {/* Subtle background decoration */}
      <div className="absolute -top-16 right-0 w-32 h-32 bg-gradient-to-br from-sky-100/30 to-blue-100/30 rounded-full blur-2xl -z-20"></div>

      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Popular Destinations
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Explore these handpicked destinations loved by travelers
        </p>
        <div className="w-16 h-1 brand-gradient rounded-full mx-auto mt-4"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {destinations.map((dest, index) => (
          <div
            key={dest.id}
            className="group cursor-pointer transform transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-sky-300/50 transition-all duration-300 relative h-full">
              {/* Image with overlay gradient */}
              <div className="relative overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.target.src = "/placeholder.png";
                  }}
                />
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Floating badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-sky-700 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  Popular Choice
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-lg text-gray-900 group-hover:brand-gradient-text transition-all duration-300">
                  {dest.name}
                </h3>
                <p className="text-gray-500 text-sm mt-1 mb-4">{dest.desc}</p>

                <Button
                  variant="outline"
                  className="w-full border-sky-200 text-sky-700 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 hover:border-sky-400 transition-all duration-300 group-hover:shadow-lg"
                >
                  <span>Explore Destination</span>
                  <div className="ml-2 transform transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </div>
                </Button>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 brand-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DestinationsSection;
