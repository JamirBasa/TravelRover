import React, { useState, useEffect } from "react";
import { Shield, FileText, ArrowUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function PrivacyAndTerms() {
  const [activeSection, setActiveSection] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const lastUpdated = "December 5, 2025";

  // Track scroll position for "back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);

      // Update active section based on scroll position
      const sections = document.querySelectorAll("[data-section]");
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= 200) {
          setActiveSection(section.getAttribute("data-section"));
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const sections = [
    { id: "privacy", title: "Privacy Policy", icon: Shield },
    { id: "data-collection", title: "Data We Collect", icon: FileText },
    { id: "data-usage", title: "How We Use Your Data", icon: FileText },
    { id: "your-rights", title: "Your Rights", icon: Shield },
    { id: "terms", title: "Terms of Service", icon: FileText },
    { id: "user-conduct", title: "User Conduct", icon: FileText },
    { id: "disclaimers", title: "Disclaimers", icon: Shield },
    { id: "contact", title: "Contact Us", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-800 dark:to-blue-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Privacy & Terms</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Your trust matters to us. Here's how we protect your data and what
            you need to know about using TravelRover.
          </p>
          <p className="text-blue-200 text-sm mt-4">
            Last updated: <span className="font-semibold">{lastUpdated}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sticky Table of Contents - Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-6 p-4 shadow-lg border-sky-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quick Navigation
              </h3>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                        activeSection === section.id
                          ? "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="flex-1">{section.title}</span>
                      {activeSection === section.id && (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </aside>

          {/* Content Area */}
          <main className="lg:col-span-3 space-y-12">
            {/* Mobile TOC */}
            <Card className="lg:hidden p-4 border-sky-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Jump to Section
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="text-left px-3 py-2 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors"
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </Card>

            {/* Privacy Policy Section */}
            <section
              id="privacy"
              data-section="privacy"
              className="scroll-mt-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Privacy Policy
                </h2>
              </div>

              <div className="prose prose-blue max-w-none dark:prose-invert">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  At TravelRover, we take your privacy seriously. This policy
                  explains how we collect, use, and protect your personal
                  information when you use our AI-powered travel planning
                  service.
                </p>
              </div>
            </section>

            {/* Data Collection Section */}
            <section
              id="data-collection"
              data-section="data-collection"
              className="scroll-mt-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                What Data We Collect
              </h3>

              <div className="space-y-6">
                <Card className="p-6 border-l-4 border-sky-500 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Account Information
                  </h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                    <li>
                      • Email address (for authentication via Google Sign-In)
                    </li>
                    <li>
                      • Display name and profile photo (from Google account)
                    </li>
                    <li>• Travel preferences and profile data you provide</li>
                  </ul>
                </Card>

                <Card className="p-6 border-l-4 border-blue-500 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Trip Data
                  </h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                    <li>• Destinations, dates, and budget preferences</li>
                    <li>• Generated itineraries and customizations</li>
                    <li>• Hotel and flight preferences</li>
                    <li>• Photos you upload to your trips</li>
                  </ul>
                </Card>

                <Card className="p-6 border-l-4 border-indigo-500 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Usage Data
                  </h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                    <li>• Pages visited and features used</li>
                    <li>• Device type and browser information</li>
                    <li>
                      • IP address and general location (for regional pricing)
                    </li>
                  </ul>
                </Card>
              </div>
            </section>

            {/* Data Usage Section */}
            <section
              id="data-usage"
              data-section="data-usage"
              className="scroll-mt-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                How We Use Your Data
              </h3>

              <div className="prose prose-blue max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We use your information to:
                </p>
                <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                  <li>
                    <strong>Generate Personalized Itineraries:</strong> Our AI
                    uses your preferences to create custom travel plans
                  </li>
                  <li>
                    <strong>Provide Real-time Recommendations:</strong> Flight
                    prices, hotel availability, and weather updates
                  </li>
                  <li>
                    <strong>Improve Our Service:</strong> Analyze usage patterns
                    to enhance features and fix bugs
                  </li>
                  <li>
                    <strong>Communicate with You:</strong> Send trip updates and
                    important service notifications
                  </li>
                  <li>
                    <strong>Ensure Security:</strong> Detect and prevent
                    fraudulent activity
                  </li>
                </ul>

                <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-lg mt-6">
                  <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
                    <strong>We never sell your personal data.</strong> Your
                    travel plans and preferences stay private.
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights Section */}
            <section
              id="your-rights"
              data-section="your-rights"
              className="scroll-mt-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Your Rights & Control
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-sky-200 dark:border-sky-800">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Access Your Data
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    View and download all your trip data anytime from your
                    profile settings.
                  </p>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Delete Your Account
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Permanently remove your account and all associated data with
                    one click.
                  </p>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Update Information
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Edit your profile, preferences, and trip details whenever
                    you want.
                  </p>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Opt-out of Analytics
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Disable usage tracking in your settings (core features still
                    work).
                  </p>
                </Card>
              </div>
            </section>

            {/* Terms of Service Section */}
            <section id="terms" data-section="terms" className="scroll-mt-6">
              <div className="flex items-center gap-3 mb-6 pt-8 border-t-2 border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Terms of Service
                </h2>
              </div>

              <div className="prose prose-blue max-w-none dark:prose-invert">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  By using TravelRover, you agree to these terms. Please read
                  them carefully.
                </p>
              </div>
            </section>

            {/* User Conduct Section */}
            <section
              id="user-conduct"
              data-section="user-conduct"
              className="scroll-mt-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                User Conduct & Responsibilities
              </h3>

              <div className="space-y-4">
                <Card className="p-5 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    ✅ You May:
                  </h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                    <li>
                      • Use TravelRover for personal, non-commercial travel
                      planning
                    </li>
                    <li>• Create and customize unlimited trip itineraries</li>
                    <li>• Share your trips with friends and family</li>
                    <li>• Provide feedback to help us improve</li>
                  </ul>
                </Card>

                <Card className="p-5 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    ❌ You May Not:
                  </h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                    <li>• Use the service for illegal activities or scams</li>
                    <li>
                      • Scrape or automate data collection from our platform
                    </li>
                    <li>
                      • Resell or redistribute our AI-generated content
                      commercially
                    </li>
                    <li>• Attempt to hack, disrupt, or abuse the service</li>
                    <li>• Share your account credentials with others</li>
                  </ul>
                </Card>
              </div>
            </section>

            {/* Disclaimers Section */}
            <section
              id="disclaimers"
              data-section="disclaimers"
              className="scroll-mt-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Important Disclaimers
              </h3>

              <div className="space-y-4">
                <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-3">
                    AI-Generated Content
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    Our itineraries are generated by AI and may contain errors.
                    Always verify important details like flight times, hotel
                    availability, and attraction hours before traveling.
                  </p>
                </Card>

                <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
                    Third-Party Services
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    We display flight and hotel information from external
                    providers. We're not responsible for their accuracy,
                    availability, or pricing changes. Always check directly with
                    the provider before booking.
                  </p>
                </Card>

                <Card className="p-6 bg-gray-50 dark:bg-gray-900 border-l-4 border-gray-500">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">
                    No Booking Guarantee
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed">
                    TravelRover is a planning tool, not a booking platform. We
                    don't handle reservations or payments. You'll need to book
                    directly with hotels, airlines, or travel agents.
                  </p>
                </Card>
              </div>
            </section>

            {/* Contact Section */}
            <section
              id="contact"
              data-section="contact"
              className="scroll-mt-6"
            >
              <Card className="p-8 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 border-sky-200 dark:border-sky-800">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Questions or Concerns?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  We're here to help. If you have any questions about your
                  privacy, our terms, or how to use TravelRover, please reach
                  out.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="brand-gradient">Contact Support</Button>
                  <Button
                    variant="outline"
                    className="border-sky-300 dark:border-sky-700"
                  >
                    Email: support@travelrover.com
                  </Button>
                </div>
              </Card>
            </section>

            {/* Footer Note */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-500 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p>
                These terms were last updated on <strong>{lastUpdated}</strong>.
              </p>
              <p className="mt-2">
                We may update this page occasionally. Continued use of
                TravelRover means you accept any changes.
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default PrivacyAndTerms;
