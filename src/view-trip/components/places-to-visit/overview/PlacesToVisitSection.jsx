import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PlaceCardItem from "../../shared/PlaceCardItem";

function PlacesToVisitSection({ placesToVisit, trip }) {
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
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 px-6 sm:px-8 py-6 relative overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>

        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
            Your Itinerary
          </h2>
          <p className="text-emerald-50 text-sm sm:text-base font-medium">
            {validPlaces.length} {validPlaces.length === 1 ? "place" : "places"}{" "}
            to explore
          </p>
        </div>
      </div>

      {/* Carousel Container with Side Arrows */}
      <div className="p-6 sm:p-8 relative">
        {/* Left Arrow - Floating */}
        {validPlaces.length > 1 && (
          <button
            onClick={() => scrollToCard("prev")}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10
                       w-12 h-12 rounded-full bg-white dark:bg-slate-800 
                       shadow-lg hover:shadow-xl
                       flex items-center justify-center transition-all duration-200
                       border-2 border-gray-200 dark:border-slate-600
                       hover:border-emerald-500 dark:hover:border-emerald-400
                       disabled:opacity-0 disabled:pointer-events-none
                       hidden md:flex
                       ${canScrollLeft ? "hover:scale-110" : ""}`}
            aria-label="Previous places"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
        )}

        {/* Right Arrow - Floating */}
        {validPlaces.length > 1 && (
          <button
            onClick={() => scrollToCard("next")}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10
                       w-12 h-12 rounded-full bg-white dark:bg-slate-800 
                       shadow-lg hover:shadow-xl
                       flex items-center justify-center transition-all duration-200
                       border-2 border-gray-200 dark:border-slate-600
                       hover:border-emerald-500 dark:hover:border-emerald-400
                       disabled:opacity-0 disabled:pointer-events-none
                       hidden md:flex
                       ${canScrollRight ? "hover:scale-110" : ""}`}
            aria-label="Next places"
          >
            <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
        )}

        {/* Horizontal Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory
                     pb-2 px-2 md:px-14"
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
              <PlaceCardItem place={place} trip={trip} />
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
