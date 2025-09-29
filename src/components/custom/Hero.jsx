import { Button } from "@/components/ui/button";
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, MapPin, Clock, Users, Star } from "lucide-react";

function Hero() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user && user.email) {
      // User is logged in, redirect to home page
      navigate("/home");
    }
  }, [navigate]);

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      text: "AI-Powered Planning",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      text: "Real-time Data",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      text: "Minutes to Plan",
    },
    {
      icon: <Users className="w-5 h-5" />,
      text: "Personalized",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-sky-200 rounded-full px-4 py-2 text-sm font-medium text-sky-600 shadow-lg">
            <Star className="w-4 h-4 fill-current" />
            <span>Philippines' #1 AI Travel Planner</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-sky-700 bg-clip-text text-transparent animate-pulse">
                Discover Amazing
              </span>
              <br />
              <span className="text-gray-900">Destinations with</span>
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                  AI Magic
                </span>
                <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4">
                  <Sparkles className="w-6 h-6 md:w-10 md:h-10 lg:w-12 lg:h-12 text-yellow-400 animate-bounce" />
                </div>
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Your personal AI travel companion that creates
            <span className="text-sky-600 font-semibold">
              {" "}
              personalized itineraries{" "}
            </span>
            in minutes, not hours
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <span className="text-sky-500">{feature.icon}</span>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="space-y-6 pt-6">
            <div className="group">
              <Link to={"/create-trip"}>
                <Button
                  size="lg"
                  className="brand-button text-lg md:text-xl px-10 py-6 font-bold shadow-2xl hover:shadow-sky-500/25 transform hover:scale-110 active:scale-95 transition-all duration-300 border-0 overflow-hidden group"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -top-10 -left-10 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>

                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 mr-3 animate-spin-slow" />
                  <span className="relative z-10">
                    Start Planning Your Adventure
                  </span>
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✨</span>
                <span>Free to use</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <span className="text-sky-500">🚀</span>
                <span>Instant results</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">🌍</span>
                <span>Philippines specialist</span>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="pt-12 space-y-6">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30 max-w-md mx-auto">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex justify-center items-center gap-3">
                  <div className="flex -space-x-3">
                    {["👨‍💼", "👩‍🎓", "🧑‍🍳", "👩‍⚕️", "👨‍🎨"].map((emoji, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 border-3 border-white flex items-center justify-center text-lg shadow-lg hover:scale-110 transition-transform duration-200"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      1,000+
                    </span>
                    <br />
                    <span className="text-xs">happy travelers</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400 drop-shadow-sm animate-pulse"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-800">
                    4.9/5 rating
                  </span>
                </div>

                <p className="text-xs text-gray-500 text-center italic">
                  "Most intuitive travel planner I've ever used!" - Recent user
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
