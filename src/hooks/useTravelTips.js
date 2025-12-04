/**
 * React Query Hook for AI-Generated Travel Tips
 * Handles lazy loading, Firestore caching, and fallback logic
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { generateTravelTips } from "../services/travelTipsService";
import { logDebug, logError } from "../utils/productionLogger";

/**
 * Safely extract error message
 */
const getErrorMessage = (error) => {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  if (error.error) return error.error;
  return JSON.stringify(error);
};

/**
 * Query keys for React Query cache management
 */
export const travelTipsKeys = {
  all: ["travelTips"],
  trip: (tripId) => ["travelTips", tripId],
};

/**
 * Fetch travel tips from Firestore cache or generate new ones
 * @param {string} tripId - Trip document ID
 * @param {Object} trip - Full trip object for context
 */
const fetchTravelTips = async (tripId, trip) => {
  logDebug("useTravelTips", "Fetching tips", { tripId });

  try {
    // 1. Check Firestore cache first
    const tripRef = doc(db, "AITrips", tripId);
    const tripDoc = await getDoc(tripRef);

    if (tripDoc.exists()) {
      const data = tripDoc.data();

      // Return cached tips if they exist and are recent (< 30 days old)
      if (data.travelTips && !isTipsStale(data.travelTips.generatedAt)) {
        logDebug("useTravelTips", "Using cached tips", {
          generatedAt: data.travelTips.generatedAt,
        });

        return {
          ...data.travelTips,
          fromCache: true,
        };
      }
    }

    // 2. Generate new tips if not cached or stale
    logDebug("useTravelTips", "Generating new tips", { tripId });

    const tripContext = buildTripContext(trip);
    const result = await generateTravelTips(tripContext);

    // 3. Cache the generated tips in Firestore
    if (result.success) {
      await updateDoc(tripRef, {
        travelTips: result.data,
        travelTipsUpdatedAt: new Date().toISOString(),
      });

      logDebug("useTravelTips", "Tips cached in Firestore", { tripId });

      return {
        ...result.data,
        fromCache: false,
      };
    } else {
      // Return fallback tips if generation failed
      logDebug("useTravelTips", "Using fallback tips", { tripId });
      return {
        ...result.fallback,
        fromCache: false,
        generationFailed: true,
      };
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    logError("useTravelTips", "Error fetching/generating tips", {
      error: errorMessage,
      errorType: error?.name || typeof error,
      tripId,
      hasTrip: !!trip,
      location: trip?.userSelection?.location,
    });
    
    // Return fallback tips instead of throwing
    const { getGenericTips } = await import("../services/travelTipsService");
    return {
      ...getGenericTips(trip?.userSelection?.location || "Philippines"),
      fromCache: false,
      generationFailed: true,
      error: errorMessage,
    };
  }
};

/**
 * Main hook for accessing travel tips
 * @param {string} tripId - Trip document ID
 * @param {Object} trip - Full trip object
 * @param {boolean} enabled - Whether to fetch tips automatically
 */
export const useTravelTips = (tripId, trip, { enabled = true } = {}) => {
  return useQuery({
    queryKey: travelTipsKeys.trip(tripId),
    queryFn: () => fetchTravelTips(tripId, trip),
    enabled: enabled && !!tripId && !!trip,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    cacheTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    retry: 1,
    refetchOnWindowFocus: false,
    onError: (error) => {
      logError("useTravelTips", "Query error", {
        error: getErrorMessage(error),
        errorType: error?.name || typeof error,
        tripId,
      });
    },
  });
};

/**
 * Mutation for regenerating tips (user-triggered)
 */
export const useRegenerateTips = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, trip, forceRegenerate = true }) => {
      logDebug("useRegenerateTips", "Regenerating tips", {
        tripId,
        forceRegenerate,
      });

      const tripContext = buildTripContext(trip);
      const result = await generateTravelTips(tripContext);

      if (result.success) {
        // Update Firestore
        const tripRef = doc(db, "AITrips", tripId);
        await updateDoc(tripRef, {
          travelTips: result.data,
          travelTipsUpdatedAt: new Date().toISOString(),
        });

        return result.data;
      } else {
        throw new Error(result.error || "Failed to regenerate tips");
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the query
      queryClient.setQueryData(travelTipsKeys.trip(variables.tripId), data);
      logDebug("useRegenerateTips", "Tips regenerated successfully", {
        tripId: variables.tripId,
      });
    },
    onError: (error, variables) => {
      logError("useRegenerateTips", "Failed to regenerate", {
        error: getErrorMessage(error),
        errorType: error?.name || typeof error,
        tripId: variables.tripId,
      });
    },
  });
};

/**
 * Build trip context for AI generation
 */
const buildTripContext = (trip) => {
  return {
    location: trip?.userSelection?.location || trip?.tripData?.destination,
    duration: trip?.userSelection?.duration || 3,
    travelers: trip?.userSelection?.travelers || "Solo",
    budget:
      trip?.userSelection?.customBudget ||
      trip?.userSelection?.budget ||
      "Moderate",
    startDate: trip?.userSelection?.startDate,
    transportMode: trip?.transportMode?.mode || "flight_preferred",
    userProfile: trip?.userProfile || null,
    specificRequests: trip?.userSelection?.specificRequests || null,
  };
};

/**
 * Check if cached tips are stale (> 30 days old)
 */
const isTipsStale = (generatedAt) => {
  if (!generatedAt) return true;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return new Date(generatedAt) < thirtyDaysAgo;
};

/**
 * Prefetch tips for a trip (useful for preloading)
 */
export const usePrefetchTravelTips = () => {
  const queryClient = useQueryClient();

  return (tripId, trip) => {
    queryClient.prefetchQuery({
      queryKey: travelTipsKeys.trip(tripId),
      queryFn: () => fetchTravelTips(tripId, trip),
      staleTime: 1000 * 60 * 60 * 24,
    });
  };
};
