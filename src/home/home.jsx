import React from "react";
import HeroSection from "./components/HeroSection";
import DestinationsSection from "./components/DestinationsSection";
import { usePageTitle } from "../hooks/usePageTitle";

function Home() {
  // Set the page title for the home page
  usePageTitle("Home");

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50/20 to-blue-50/30 relative overflow-hidden">
      {/* Elegant background elements - positioned to not interfere */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-gradient-to-r from-sky-200/15 to-blue-200/15 rounded-full blur-3xl -translate-x-1/2 -z-10"></div>
      <div className="fixed bottom-20 right-0 w-80 h-80 bg-gradient-to-l from-blue-200/10 to-sky-200/10 rounded-full blur-3xl translate-x-1/2 -z-10"></div>

      {/* Content with proper spacing */}
      <div className="relative z-10 min-h-screen">
        <HeroSection />
        <DestinationsSection />
      </div>
    </div>
  );
}

export default Home;
