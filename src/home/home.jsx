import React from "react";
import HeroSection from "./components/HeroSection";
import DestinationsSection from "./components/DestinationsSection";

function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <DestinationsSection />
    </div>
  );
}

export default Home;
