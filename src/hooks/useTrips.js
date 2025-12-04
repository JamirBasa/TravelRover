/**
 * React Query Hooks for Trip Management
 * 
 * Modern server-state management replacing custom cache logic.
 * 
 * Features:
 * - Automatic caching with React Query
 * - Background refetching
 * - Optimistic updates
 * - Request deduplication
 * - Loading & error states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { tripCache } from '../utils/indexedDBCache';

// ==========================================
// Query Keys - Consistent cache key generation
// ==========================================
export const tripKeys = {
  all: ['trips'],
  lists: () => [...tripKeys.all, 'list'],
  list: (userEmail) => [...tripKeys.lists(), { userEmail }],
  details: () => [...tripKeys.all, 'detail'],
  detail: (tripId) => [...tripKeys.details(), tripId],
};

// ==========================================
// Fetch Functions
// ==========================================

/**
 * Fetch all trips for a user
 */
const fetchUserTrips = async (userEmail) => {
  console.log('🔍 Fetching trips for:', userEmail);
  
  const q = query(
    collection(db, 'AITrips'),
    where('userEmail', '==', userEmail)
  );
  
  const querySnapshot = await getDocs(q);
  const trips = [];
  
  querySnapshot.forEach((doc) => {
    trips.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  console.log(`✅ Loaded ${trips.length} trips from Firestore`);
  
  // Store in IndexedDB for offline access
  for (const trip of trips) {
    await tripCache.set(trip.id, trip, userEmail, 5 * 60 * 1000); // 5 min TTL
  }
  
  return trips;
};

/**
 * Fetch single trip by ID
 */
const fetchTrip = async (tripId) => {
  console.log('🔍 Fetching trip:', tripId);
  
  // Try IndexedDB first
  const cached = await tripCache.get(tripId);
  if (cached) {
    console.log('✅ Trip loaded from IndexedDB cache');
    return cached;
  }
  
  // Fetch from Firestore
  const docRef = doc(db, 'AITrips', tripId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Trip not found');
  }
  
  const trip = {
    id: docSnap.id,
    ...docSnap.data(),
  };
  
  console.log('✅ Trip loaded from Firestore');
  
  // Store in IndexedDB
  await tripCache.set(tripId, trip, trip.userEmail, 5 * 60 * 1000);
  
  return trip;
};

/**
 * Create new trip
 */
const createTrip = async ({ tripId, tripData }) => {
  console.log('📝 Creating trip:', tripId);
  
  await setDoc(doc(db, 'AITrips', tripId), {
    ...tripData,
    createdAt: Date.now(),
  });
  
  console.log('✅ Trip created');
  return { id: tripId, ...tripData };
};

/**
 * Update existing trip
 */
const updateTrip = async ({ tripId, tripData }) => {
  console.log('📝 Updating trip:', tripId);
  
  await setDoc(doc(db, 'AITrips', tripId), {
    ...tripData,
    updatedAt: Date.now(),
  }, { merge: true });
  
  console.log('✅ Trip updated');
  return { id: tripId, ...tripData };
};

/**
 * Delete trip
 */
const deleteTrip = async (tripId) => {
  console.log('🗑️ Deleting trip:', tripId);
  
  await deleteDoc(doc(db, 'AITrips', tripId));
  
  console.log('✅ Trip deleted');
  return tripId;
};

// ==========================================
// React Query Hooks
// ==========================================

/**
 * Hook: Fetch all trips for current user
 * 
 * @param {string} userEmail - User's email
 * @param {Object} options - React Query options
 * @returns {Object} { data, isLoading, error, refetch }
 * 
 * @example
 * const { data: trips, isLoading, error } = useUserTrips(user.email);
 */
export const useUserTrips = (userEmail, options = {}) => {
  return useQuery({
    queryKey: tripKeys.list(userEmail),
    queryFn: () => fetchUserTrips(userEmail),
    enabled: !!userEmail, // Only run if userEmail exists
    staleTime: 1 * 60 * 1000, // 1 minute (trips change frequently)
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    ...options,
  });
};

/**
 * Hook: Fetch single trip
 * 
 * @param {string} tripId - Trip ID
 * @param {Object} options - React Query options
 * @returns {Object} { data, isLoading, error, refetch }
 * 
 * @example
 * const { data: trip, isLoading } = useTrip(tripId);
 */
export const useTrip = (tripId, options = {}) => {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => fetchTrip(tripId),
    enabled: !!tripId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

/**
 * Hook: Create new trip
 * 
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 * 
 * @example
 * const createTripMutation = useCreateTrip();
 * 
 * createTripMutation.mutate(
 *   { tripId, tripData },
 *   {
 *     onSuccess: () => toast.success('Trip created!'),
 *     onError: (error) => toast.error(error.message),
 *   }
 * );
 */
export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTrip,
    onSuccess: (newTrip) => {
      // Invalidate trips list to trigger refetch
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      
      // Optimistically add to cache
      queryClient.setQueryData(tripKeys.detail(newTrip.id), newTrip);
      
      console.log('✅ Trip cache updated');
    },
    onError: (error) => {
      console.error('❌ Create trip error:', error);
    },
  });
};

/**
 * Hook: Update existing trip
 * 
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 * 
 * @example
 * const updateTripMutation = useUpdateTrip();
 * 
 * updateTripMutation.mutate({ tripId, tripData });
 */
export const useUpdateTrip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateTrip,
    onMutate: async ({ tripId, tripData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tripKeys.detail(tripId) });
      
      // Snapshot previous value
      const previousTrip = queryClient.getQueryData(tripKeys.detail(tripId));
      
      // Optimistically update cache
      queryClient.setQueryData(tripKeys.detail(tripId), (old) => ({
        ...old,
        ...tripData,
      }));
      
      // Return context with previous value
      return { previousTrip };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousTrip) {
        queryClient.setQueryData(
          tripKeys.detail(variables.tripId),
          context.previousTrip
        );
      }
      console.error('❌ Update trip error:', error);
    },
    onSuccess: (updatedTrip) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(updatedTrip.id) });
      
      console.log('✅ Trip updated successfully');
    },
  });
};

/**
 * Hook: Delete trip
 * 
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 * 
 * @example
 * const deleteTripMutation = useDeleteTrip();
 * 
 * deleteTripMutation.mutate(tripId, {
 *   onSuccess: () => navigate('/my-trips'),
 * });
 */
export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTrip,
    onSuccess: (tripId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: tripKeys.detail(tripId) });
      
      // Invalidate trips list
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      
      // Clear from IndexedDB
      tripCache.get(tripId).then(trip => {
        if (trip) {
          tripCache.invalidateUser(trip.userEmail);
        }
      });
      
      console.log('✅ Trip deleted and cache cleared');
    },
    onError: (error) => {
      console.error('❌ Delete trip error:', error);
    },
  });
};

/**
 * Hook: Prefetch trip (load in background)
 * 
 * @returns {Function} prefetchTrip
 * 
 * @example
 * const prefetchTrip = usePrefetchTrip();
 * 
 * // On hover/focus
 * <div onMouseEnter={() => prefetchTrip(tripId)}>
 */
export const usePrefetchTrip = () => {
  const queryClient = useQueryClient();
  
  return (tripId) => {
    queryClient.prefetchQuery({
      queryKey: tripKeys.detail(tripId),
      queryFn: () => fetchTrip(tripId),
      staleTime: 5 * 60 * 1000,
    });
  };
};

export default {
  useUserTrips,
  useTrip,
  useCreateTrip,
  useUpdateTrip,
  useDeleteTrip,
  usePrefetchTrip,
  tripKeys,
};
