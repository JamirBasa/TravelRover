import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

function HeroSection() {
  const categories = [
    { id: 1, name: "Adventure", icon: "🌄" },
    { id: 2, name: "Relax", icon: "🌴" },
    { id: 3, name: "Heritage", icon: "🏛️" },
    { id: 4, name: "Food Trip", icon: "🍜" },
  ];

  return (
    <section className="flex flex-col items-center text-center mt-16 px-4">
      <h1 className="font-extrabold text-4xl md:text-5xl">
        Plan Your Perfect Trip
      </h1>
      <p className="text-gray-500 mt-2 text-lg">
        Discover amazing destinations and create unforgettable memories
      </p>

      {/* Search Bar */}
      <div className="flex items-center gap-2 mt-6 w-full md:w-1/2">
        <Input
          placeholder="Where do you want to go? (e.g., Baguio, Cebu)"
          className="flex-1 rounded-full px-5 py-6 text-lg shadow"
        />
        <Button className="rounded-full px-6 py-6 cursor-pointer">
          <Search className="mr-2 h-5 w-5" /> Search
        </Button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-4 justify-center mt-8">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant="outline"
            className="flex items-center gap-2 px-6 py-5 rounded-xl cursor-pointer"
          >
            <span>{cat.icon}</span> {cat.name}
          </Button>
        ))}
      </div>

      {/* Plan your trip button */}
      <Link to="/create-trip">
        <Button className="mt-8 px-8 py-6 rounded-full cursor-pointer">
          Plan your trip
        </Button>
      </Link>
    </section>
  );
}

export default HeroSection;