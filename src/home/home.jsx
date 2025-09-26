import React from "react";
import HeroSection from "./components/HeroSection";
import DestinationsSection from "./components/DestinationsSection";
import Footer from "./components/Footer";

function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <DestinationsSection />
      <Footer />
    </div>
  );
}

export default Home;