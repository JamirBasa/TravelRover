/**
 * React Query Hooks for Google Places API
 * 
 * Replaces GlobalApi.jsx with modern React Query patterns
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { imageCache, apiCache } from '../utils/indexedDBCache';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const BACKEND_BASE_URL = `${API_BASE}/langgraph`;
const PLACES_SEARCH_URL = `${BACKEND_BASE_URL}/places-search/`;

// ==========================================
// Query Keys
// ==========================================
export const placesKeys = {
  all: ['places'],
  searches: () => [...placesKeys.all, 'search'],
  search: (textQuery) => [...placesKeys.searches(), textQuery.toLowerCase().trim()],
};

// ==========================================
// Fetch Functions
// ==========================================

/**
 * Search for place details via backend proxy
 */
const searchPlace = async (textQuery) => {
  if (!textQuery) {
    throw new Error('textQuery is required');
  }

  console.log('🔍 Searching via backend proxy:', textQuery);
  
  const cacheKey = textQuery.toLowerCase().trim();
  
  // Try IndexedDB cache first
  const cached = await apiCache.get(cacheKey);
  if (cached) {
    console.log('✅ Places API cache hit:', textQuery);
    return cached;
  }

  // Make API call
  const response = await axios.post(
    PLACES_SEARCH_URL,
    { textQuery },
    { headers: { 'Content-Type': 'application/json' } }
  );

  // Backend returns { success: true, data: { places: [...] } }
  const transformedResponse = {
    data: {
      places: response.data?.data?.places || [],
    },
  };

  console.log('✅ Places API response:', transformedResponse);
  
  // Cache in IndexedDB
  await apiCache.set(
    cacheKey,
    transformedResponse,
    'places-search',
    24 * 60 * 60 * 1000 // 24 hours (places don't change often)
  );

  return transformedResponse;
};

/**
 * Get place photo URL
 */
const getPlacePhoto = async (photoReference, maxWidth = 800) => {
  // This should go through your backend proxy if you have one
  // For now, return the reference as-is
  return photoReference;
};

// ==========================================
// React Query Hooks
// ==========================================

/**
 * Hook: Search for place details
 * 
 * @param {string} textQuery - Place search query
 * @param {Object} options - React Query options
 * @returns {Object} { data, isLoading, error }
 * 
 * @example
 * const { data, isLoading } = usePlaceSearch('Boracay Beach');
 * const place = data?.data?.places?.[0];
 */
export const usePlaceSearch = (textQuery, options = {}) => {
  return useQuery({
    queryKey: placesKeys.search(textQuery),
    queryFn: () => searchPlace(textQuery),
    enabled: !!textQuery && textQuery.length > 0,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (places rarely change)
    cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 days in memory
    retry: 2,
    ...options,
  });
};

/**
 * Hook: Get place photo from cache or API
 * 
 * @param {string} location - Location name
 * @param {Object} options - React Query options
 * @returns {Object} { data: photoUrl, isLoading, error }
 * 
 * @example
 * const { data: photoUrl } = usePlacePhoto('Boracay');
 */
export const usePlacePhoto = (location, options = {}) => {
  return useQuery({
    queryKey: ['place-photo', location],
    queryFn: async () => {
      // Try IndexedDB cache first
      const cached = await imageCache.get(location);
      if (cached) {
        console.log('✅ Photo cache hit:', location);
        return cached;
      }

      // Search for place
      const result = await searchPlace(location);
      const place = result?.data?.places?.[0];
      
      if (!place) {
        throw new Error('Place not found');
      }

      // Get photo URL
      const photoUrl = place.photos?.[0]?.name || '/placeholder-destination.jpg';
      
      // Cache in IndexedDB
      await imageCache.set(
        location,
        photoUrl,
        30 * 24 * 60 * 60 * 1000 // 30 days
      );

      return photoUrl;
    },
    enabled: !!location,
    staleTime: 30 * 24 * 60 * 60 * 1000, // 30 days
    cacheTime: 30 * 24 * 60 * 60 * 1000,
    retry: 1,
    ...options,
  });
};

/**
 * Hook: Prefetch place search
 * 
 * @returns {Function} prefetchPlace
 * 
 * @example
 * const prefetchPlace = usePrefetchPlace();
 * prefetchPlace('Palawan');
 */
export const usePrefetchPlace = () => {
  const queryClient = useQueryClient();
  
  return (textQuery) => {
    queryClient.prefetchQuery({
      queryKey: placesKeys.search(textQuery),
      queryFn: () => searchPlace(textQuery),
      staleTime: 24 * 60 * 60 * 1000,
    });
  };
};

/**
 * Clear places cache
 */
export const clearPlacesCache = async () => {
  await apiCache.clearEndpoint('places-search');
  console.log('🧹 Cleared places cache');
};

export default {
  usePlaceSearch,
  usePlacePhoto,
  usePrefetchPlace,
  clearPlacesCache,
  placesKeys,
};
