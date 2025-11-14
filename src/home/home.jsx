import React from "react";
import HeroSection from "./components/HeroSection";
import { usePageTitle } from "../hooks/usePageTitle";

/**
 * Home Page - Accessible to all users (logged in or not)
 * This is the main landing page of the application
 */
function Home() {
  // Set the page title for the home page
  usePageTitle("Home");

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50/20 to-blue-50/30 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-800/50 relative overflow-hidden transition-colors duration-300">
      {/* Elegant background elements - positioned to not interfere */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-gradient-to-r from-sky-200/15 to-blue-200/15 dark:from-sky-500/10 dark:to-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -z-10"></div>
      <div className="fixed bottom-20 right-0 w-80 h-80 bg-gradient-to-l from-blue-200/10 to-sky-200/10 dark:from-blue-500/8 dark:to-sky-500/8 rounded-full blur-3xl translate-x-1/2 -z-10"></div>

      {/* Content with proper spacing */}
      <div className="relative z-10 min-h-screen">
        <HeroSection />
      </div>
    </div>
  );
}

export default Home;
