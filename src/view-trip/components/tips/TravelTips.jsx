/**
 * AI-Powered Travel Tips Component
 * Displays destination-specific, personalized travel tips with loading states
 */

import React from "react";
import { RefreshCw, AlertTriangle, Sparkles, Phone } from "lucide-react";
import { useTravelTips, useRegenerateTips } from "@/hooks/useTravelTips";
import { TIPS_CATEGORIES } from "@/services/travelTipsService";
import { toast } from "sonner";

function TravelTips({ trip, tripId }) {
  const {
    data: tipsData,
    isLoading,
    error,
    refetch,
  } = useTravelTips(tripId, trip);
  const regenerateMutation = useRegenerateTips();

  const handleRegenerate = async () => {
    try {
      await regenerateMutation.mutateAsync({ tripId, trip });
      toast.success("Travel tips updated successfully! ✨");
    } catch {
      toast.error("Failed to regenerate tips. Please try again.");
    }
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-950/50 rounded-lg flex items-center justify-center">
            <span className="text-orange-600 dark:text-orange-400 text-sm">
              💡
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Travel Tips & Information
            </h2>
            <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2 mt-1">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Generating personalized tips for {trip?.userSelection?.location}
              ...
            </p>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-orange-100 dark:border-orange-900/50 animate-pulse"
            >
              <div className="h-4 bg-orange-200 dark:bg-orange-800 rounded w-3/4 mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-orange-100 dark:bg-orange-900/50 rounded w-full"></div>
                <div className="h-3 bg-orange-100 dark:bg-orange-900/50 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Unable to Load Travel Tips
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We're having trouble generating personalized tips right now.
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  // No data fallback
  if (!tipsData || !tipsData.tips) {
    return null;
  }

  const { tips, emergencyContacts, localInsights, fromCache, isFallback } =
    tipsData;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 sm:p-6">
      {/* Header with regenerate button */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-950/50 rounded-lg flex items-center justify-center">
            <span className="text-orange-600 dark:text-orange-400 text-sm">
              {isFallback ? "💡" : "✨"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Travel Tips & Information
              {!isFallback && (
                <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-normal">
                  AI-Powered
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
              {isFallback
                ? `Essential travel information for ${trip?.userSelection?.location}`
                : `Personalized tips for your trip to ${trip?.userSelection?.location}`}
            </p>
          </div>
        </div>

        {/* Regenerate button */}
        {!isFallback && (
          <button
            onClick={handleRegenerate}
            disabled={regenerateMutation.isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg text-sm text-orange-700 dark:text-orange-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generate fresh tips"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                regenerateMutation.isLoading ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>

      {/* Tips Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {tips.map((tip, index) => {
          const category =
            TIPS_CATEGORIES[tip.category] || TIPS_CATEGORIES.practical;

          return (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-orange-100 dark:border-orange-900/50 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
            >
              <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2 flex items-center gap-2 text-sm">
                <span className="text-base">{tip.icon || category.icon}</span>
                {tip.title}
              </h3>
              <p className="text-orange-800 dark:text-orange-400/90 text-xs leading-relaxed">
                {tip.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Emergency Contacts */}
      {emergencyContacts && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-red-900 dark:text-red-400 mb-3 flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4" />
            Emergency Contacts
          </h3>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            {emergencyContacts.police && (
              <div>
                <span className="text-red-700 dark:text-red-400 font-medium">
                  Police:
                </span>
                <p className="text-red-800 dark:text-red-300">
                  {emergencyContacts.police}
                </p>
              </div>
            )}
            {emergencyContacts.hospital && (
              <div>
                <span className="text-red-700 dark:text-red-400 font-medium">
                  Hospital:
                </span>
                <p className="text-red-800 dark:text-red-300">
                  {emergencyContacts.hospital}
                </p>
              </div>
            )}
            {emergencyContacts.tourism && (
              <div>
                <span className="text-red-700 dark:text-red-400 font-medium">
                  Tourism:
                </span>
                <p className="text-red-800 dark:text-red-300">
                  {emergencyContacts.tourism}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Local Insights */}
      {localInsights && localInsights.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 dark:text-amber-400 mb-3 flex items-center gap-2 text-sm">
            <span className="text-base">🌟</span>
            Local Insider Tips
          </h3>
          <ul className="space-y-2 text-xs text-amber-800 dark:text-amber-400/90">
            {localInsights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-500 mt-0.5">
                  •
                </span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cache indicator */}
      {fromCache && !isFallback && (
        <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-4 text-center">
          Tips cached for faster loading • Last updated{" "}
          {new Date(tipsData.generatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export default TravelTips;
