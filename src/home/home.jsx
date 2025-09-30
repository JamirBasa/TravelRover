import React from "react";
import HeroSection from "./components/HeroSection";
import DestinationsSection from "./components/DestinationsSection";
import { usePageTitle } from "../hooks/usePageTitle";

function Home() {
  // Set the page title for the home page
  usePageTitle("Home");

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <DestinationsSection />
    </div>
  );
}

export default Home;
