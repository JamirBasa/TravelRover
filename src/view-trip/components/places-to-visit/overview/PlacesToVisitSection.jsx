import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PlaceCardItem from "../../shared/PlaceCardItem";

function PlacesToVisitSection({ placesToVisit }) {
  const scrollContainerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // ✅ Filter out any null/undefined items from the array
  const validPlaces = (placesToVisit || []).filter(
    (place) => place !== null && place !== undefined
  );

  // Update scroll button states
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll to specific card
  const scrollToCard = (direction) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth =
      container.querySelector(".place-card-item")?.offsetWidth || 0;
    const gap = 24; // gap-6 = 24px
    const scrollAmount = cardWidth + gap;

    if (direction === "next") {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  // Update current index based on scroll position
  const updateCurrentIndex = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth =
      container.querySelector(".place-card-item")?.offsetWidth || 0;
    const gap = 24;
    const scrollLeft = container.scrollLeft;
    const index = Math.round(scrollLeft / (cardWidth + gap));
    setCurrentIndex(index);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateScrollButtons();
      updateCurrentIndex();
    };

    container.addEventListener("scroll", handleScroll);
    updateScrollButtons();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [validPlaces.length]);

  // ✅ Safety check: Handle undefined, null, or empty array
  if (validPlaces.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header with Navigation */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 px-6 sm:px-8 py-6 relative overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>

        <div className="relative flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
              Your Itinerary
            </h2>
            <p className="text-emerald-50 text-sm sm:text-base font-medium">
              {validPlaces.length}{" "}
              {validPlaces.length === 1 ? "place" : "places"} to explore
            </p>
          </div>

          {/* Desktop Navigation Arrows */}
          {validPlaces.length > 3 && (
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => scrollToCard("prev")}
                disabled={!canScrollLeft}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 
                         disabled:opacity-40 disabled:cursor-not-allowed
                         flex items-center justify-center transition-all duration-200
                         backdrop-blur-sm border border-white/20"
                aria-label="Previous places"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={() => scrollToCard("next")}
                disabled={!canScrollRight}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 
                         disabled:opacity-40 disabled:cursor-not-allowed
                         flex items-center justify-center transition-all duration-200
                         backdrop-blur-sm border border-white/20"
                aria-label="Next places"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Carousel Container */}
      <div className="p-6 sm:p-8">
        {/* Horizontal Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory
                     pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {validPlaces.map((place, index) => (
            <div
              key={place?.placeName || index}
              className="place-card-item flex-shrink-0 snap-start
                       w-[calc(100%-20px)] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
            >
              <PlaceCardItem place={place} />
            </div>
          ))}
        </div>

        {/* Dot Indicators */}
        {validPlaces.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {validPlaces.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  const container = scrollContainerRef.current;
                  if (!container) return;
                  const cardWidth =
                    container.querySelector(".place-card-item")?.offsetWidth ||
                    0;
                  const gap = 24;
                  container.scrollTo({
                    left: index * (cardWidth + gap),
                    behavior: "smooth",
                  });
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === index
                    ? "w-8 bg-emerald-500"
                    : "w-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400"
                }`}
                aria-label={`Go to place ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlacesToVisitSection;
