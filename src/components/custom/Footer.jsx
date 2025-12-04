import React from "react";
import { Plane } from "lucide-react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Single Row Layout - Stacks on Mobile */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Brand - Left */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center shadow-sm">
              <Plane className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
              TravelRover
            </span>
          </div>

          {/* Navigation Links - Center */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a
              href="/my-trips"
              className="text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors duration-200 font-medium"
            >
              My Trips
            </a>
            <a
              href="/create-trip"
              className="text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors duration-200 font-medium"
            >
              Create Trip
            </a>
            <a
              href="/set-profile"
              className="text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors duration-200 font-medium"
            >
              Profile
            </a>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <a
              href="/legal"
              className="text-gray-500 dark:text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors duration-200 text-xs"
            >
              Privacy & Terms
            </a>
          </nav>

          {/* Copyright - Right */}
          <div className="text-sm text-gray-500 dark:text-gray-500 font-medium">
            © {currentYear} TravelRover
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
