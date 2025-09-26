import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-20 bg-gray-100 py-10 px-6 md:px-20 text-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-semibold mb-2">About Us</h3>
          <p className="text-sm">
            Making travel planning easier for everyone.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Quick Links</h3>
          <ul className="space-y-1 text-sm">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/destinations">Destinations</Link></li>
            <li><Link to="/create-trip">Plan Trip</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Support</h3>
          <ul className="space-y-1 text-sm">
            <li><Link to="/help">Help Center</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Follow Us</h3>
          <div className="flex gap-3">
            <a href="#">🐦</a>
            <a href="#">📘</a>
            <a href="#">📸</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;