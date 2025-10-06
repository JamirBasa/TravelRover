import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Mail,
  Github,
  Twitter,
  MapPin,
  Plane,
  Star,
} from "lucide-react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-slate-900 via-sky-900 to-blue-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">TravelRover</h3>
                <p className="text-blue-200 text-sm">
                  AI-Powered Travel Planning
                </p>
              </div>
            </div>
            <p className="text-blue-100 text-sm mb-6 max-w-md leading-relaxed">
              Discover amazing destinations with personalized itineraries
              powered by AI. From flight bookings to hotel recommendations, we
              make travel planning effortless and exciting.
            </p>

            {/* Feature Highlights */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge
                variant="secondary"
                className="bg-blue-100/10 text-blue-200 border-blue-400/20"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Smart Routing
              </Badge>
              <Badge
                variant="secondary"
                className="bg-emerald-100/10 text-emerald-200 border-emerald-400/20"
              >
                <Star className="h-3 w-3 mr-1" />
                AI Recommendations
              </Badge>
              <Badge
                variant="secondary"
                className="bg-purple-100/10 text-purple-200 border-purple-400/20"
              >
                <Plane className="h-3 w-3 mr-1" />
                Live Flight Data
              </Badge>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-200 hover:text-white hover:bg-white/10"
              >
                <Github className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-200 hover:text-white hover:bg-white/10"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-200 hover:text-white hover:bg-white/10"
              >
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="/create-trip"
                  className="text-blue-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Create Trip
                </a>
              </li>
              <li>
                <a
                  href="/my-trips"
                  className="text-blue-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  My Trips
                </a>
              </li>
              <li>
                <a
                  href="/user-profile"
                  className="text-blue-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Profile Settings
                </a>
              </li>
              <li>
                <a
                  href="/settings"
                  className="text-blue-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Preferences
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-blue-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-blue-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Travel Guidelines
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-blue-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-blue-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-blue-200">
              <span>
                &copy; {currentYear} TravelRover. All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-blue-200">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-400" />
              <span>for travelers worldwide</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-emerald-600/20 text-emerald-200 border-emerald-400/30"
              >
                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                All Systems Operational
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
