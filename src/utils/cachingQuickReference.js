/**
 * 🚀 TravelRover Modern Caching - Quick Reference
 * 
 * Copy-paste examples for common caching scenarios
 */

// ==========================================
// 1. FETCH USER'S TRIPS
// ==========================================
import { useUserTrips } from '@/hooks/useTrips';

function MyTripsComponent() {
  const user = JSON.parse(localStorage.getItem('user'));
  const { data: trips, isLoading, error, refetch } = useUserTrips(user.email);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return trips.map(trip => <TripCard key={trip.id} trip={trip} />);
}

// ==========================================
// 2. FETCH SINGLE TRIP
// ==========================================
import { useTrip } from '@/hooks/useTrips';
import { useParams } from 'react-router-dom';

function ViewTripComponent() {
  const { tripId } = useParams();
  const { data: trip, isLoading } = useTrip(tripId);

  if (isLoading) return <Skeleton />;
  if (!trip) return <NotFound />;

  return <TripDetails trip={trip} />;
}

// ==========================================
// 3. CREATE NEW TRIP
// ==========================================
import { useCreateTrip } from '@/hooks/useTrips';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

function CreateTripButton() {
  const createTrip = useCreateTrip();
  const navigate = useNavigate();

  const handleCreate = () => {
    createTrip.mutate(
      { 
        tripId: Date.now().toString(), 
        tripData: { name: 'My Trip', destination: 'Boracay' } 
      },
      {
        onSuccess: (trip) => {
          toast.success('Trip created!');
          navigate(`/view-trip/${trip.id}`);
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };

  return (
    <button onClick={handleCreate} disabled={createTrip.isLoading}>
      {createTrip.isLoading ? 'Creating...' : 'Create Trip'}
    </button>
  );
}

// ==========================================
// 4. UPDATE TRIP
// ==========================================
import { useUpdateTrip } from '@/hooks/useTrips';

function EditTripForm({ tripId, currentData }) {
  const updateTrip = useUpdateTrip();
  const [formData, setFormData] = useState(currentData);

  const handleSave = () => {
    updateTrip.mutate(
      { tripId, tripData: formData },
      {
        onSuccess: () => toast.success('Trip updated!'),
        onError: (error) => toast.error(error.message),
      }
    );
  };

  return (
    <form onSubmit={handleSave}>
      {/* form fields */}
      <button type="submit" disabled={updateTrip.isLoading}>
        {updateTrip.isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

// ==========================================
// 5. DELETE TRIP
// ==========================================
import { useDeleteTrip } from '@/hooks/useTrips';

function DeleteTripButton({ tripId }) {
  const deleteTrip = useDeleteTrip();
  const navigate = useNavigate();

  const handleDelete = () => {
    if (!confirm('Delete this trip?')) return;

    deleteTrip.mutate(tripId, {
      onSuccess: () => {
        toast.success('Trip deleted!');
        navigate('/my-trips');
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <button onClick={handleDelete} disabled={deleteTrip.isLoading}>
      {deleteTrip.isLoading ? 'Deleting...' : 'Delete Trip'}
    </button>
  );
}

// ==========================================
// 6. PREFETCH ON HOVER (Performance Boost)
// ==========================================
import { usePrefetchTrip } from '@/hooks/useTrips';

function TripCard({ trip }) {
  const prefetchTrip = usePrefetchTrip();

  return (
    <Link 
      to={`/view-trip/${trip.id}`}
      onMouseEnter={() => prefetchTrip(trip.id)} // Load in background
    >
      <Card>{trip.name}</Card>
    </Link>
  );
}

// ==========================================
// 7. SEARCH PLACES (Google Places API)
// ==========================================
import { usePlaceSearch } from '@/hooks/usePlaces';

function PlaceSearchComponent() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = usePlaceSearch(searchQuery, {
    enabled: searchQuery.length > 2, // Only search if 3+ characters
  });

  const places = data?.data?.places || [];

  return (
    <div>
      <input 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)} 
        placeholder="Search places..."
      />
      {isLoading && <LoadingSpinner />}
      {places.map(place => <PlaceCard key={place.id} place={place} />)}
    </div>
  );
}

// ==========================================
// 8. GET PLACE PHOTO
// ==========================================
import { usePlacePhoto } from '@/hooks/usePlaces';

function PlaceImage({ location }) {
  const { data: photoUrl, isLoading } = usePlacePhoto(location);

  if (isLoading) return <ImageSkeleton />;

  return <img src={photoUrl || '/placeholder.jpg'} alt={location} />;
}

// ==========================================
// 9. MANUAL CACHE INVALIDATION
// ==========================================
import { useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '@/hooks/useTrips';

function RefreshButton() {
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleRefresh = () => {
    // Invalidate all trips for current user
    queryClient.invalidateQueries({ queryKey: tripKeys.list(user.email) });
    toast.success('Refreshing trips...');
  };

  return <button onClick={handleRefresh}>Refresh</button>;
}

// ==========================================
// 10. INDEXEDDB DIRECT ACCESS (Geocoding)
// ==========================================
import { geocodeCache } from '@/utils/indexedDBCache';

async function cacheGeocodeResult() {
  // Store coordinates
  await geocodeCache.set('Boracay Beach', {
    latitude: 11.9674,
    longitude: 121.9248,
  });

  // Retrieve cached coordinates
  const coords = await geocodeCache.get('Boracay Beach');
  console.log(coords); // { latitude: 11.9674, longitude: 121.9248 }

  // Get all cached geocodes
  const allGeocodes = await geocodeCache.getAll();
  console.log(Object.keys(allGeocodes).length); // Total cached locations

  // Clear all geocodes
  await geocodeCache.clear();
}

// ==========================================
// 11. INDEXEDDB DIRECT ACCESS (Images)
// ==========================================
import { imageCache } from '@/utils/indexedDBCache';

async function cacheImageUrl() {
  // Store image URL
  await imageCache.set('Palawan', 'https://example.com/palawan.jpg');

  // Retrieve cached URL
  const url = await imageCache.get('Palawan');
  console.log(url); // 'https://example.com/palawan.jpg'

  // Clear all images
  await imageCache.clear();
}

// ==========================================
// 12. CACHE STATISTICS
// ==========================================
import { getCacheStats } from '@/utils/cacheVersionManager';

function CacheStatsComponent() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getCacheStats().then(setStats);
  }, []);

  return (
    <div>
      <h3>Cache Statistics</h3>
      <p>Geocodes: {stats?.indexedDB?.geocodes || 0}</p>
      <p>Images: {stats?.indexedDB?.images || 0}</p>
      <p>Trips: {stats?.indexedDB?.trips || 0}</p>
      <p>API Cache: {stats?.indexedDB?.api_cache || 0}</p>
      <p>LocalStorage: {stats?.localStorage?.used || 0} KB</p>
    </div>
  );
}

// ==========================================
// 13. FORCE CLEAR ALL CACHES
// ==========================================
import { forceClearAllCaches } from '@/utils/cacheVersionManager';

function ClearCacheButton() {
  const handleClear = async () => {
    if (!confirm('Clear all caches? This will reload the page.')) return;

    await forceClearAllCaches();
    toast.success('Cache cleared!');
    window.location.reload();
  };

  return <button onClick={handleClear}>Clear All Caches</button>;
}

// ==========================================
// 14. OPTIMISTIC UPDATE (Instant UI)
// ==========================================
import { useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '@/hooks/useTrips';

function LikeTripButton({ tripId }) {
  const queryClient = useQueryClient();

  const handleLike = () => {
    // Optimistically update cache
    queryClient.setQueryData(tripKeys.detail(tripId), (old) => ({
      ...old,
      likes: (old.likes || 0) + 1,
    }));

    // Send to server (will auto-revert if fails)
    fetch(`/api/trips/${tripId}/like`, { method: 'POST' });
  };

  return <button onClick={handleLike}>♥ Like</button>;
}

// ==========================================
// 15. BACKGROUND REFETCH (Keep Data Fresh)
// ==========================================
import { useUserTrips } from '@/hooks/useTrips';

function AutoRefreshTrips() {
  const user = JSON.parse(localStorage.getItem('user'));
  
  const { data: trips } = useUserTrips(user.email, {
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Even when tab is inactive
  });

  return <TripsList trips={trips} />;
}

// ==========================================
// 16. CONDITIONAL FETCH (Skip if Not Needed)
// ==========================================
import { useTrip } from '@/hooks/useTrips';

function ConditionalTripLoader({ tripId, shouldLoad }) {
  const { data: trip } = useTrip(tripId, {
    enabled: shouldLoad, // Only fetch if true
  });

  if (!shouldLoad) return <div>Select a trip to view</div>;
  if (!trip) return <LoadingSpinner />;

  return <TripDetails trip={trip} />;
}

// ==========================================
// 17. RETRY ON FAILURE
// ==========================================
import { useUserTrips } from '@/hooks/useTrips';

function RetryExample() {
  const { data, error, refetch } = useUserTrips(email, {
    retry: 3, // Retry 3 times on failure
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
  });

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Try Again</button>
      </div>
    );
  }

  return <TripsList trips={data} />;
}

// ==========================================
// 18. PARALLEL QUERIES (Load Multiple Things)
// ==========================================
import { useQueries } from '@tanstack/react-query';
import { tripKeys } from '@/hooks/useTrips';

function MultiTripLoader({ tripIds }) {
  const tripQueries = useQueries({
    queries: tripIds.map(tripId => ({
      queryKey: tripKeys.detail(tripId),
      queryFn: () => fetchTrip(tripId),
    })),
  });

  const allLoaded = tripQueries.every(q => !q.isLoading);
  const trips = tripQueries.map(q => q.data).filter(Boolean);

  return allLoaded ? <TripsList trips={trips} /> : <LoadingSpinner />;
}

// ==========================================
// 19. DEPENDENT QUERIES (Fetch After Another)
// ==========================================
import { useTrip } from '@/hooks/useTrips';
import { usePlaceSearch } from '@/hooks/usePlaces';

function DependentQueryExample({ tripId }) {
  const { data: trip } = useTrip(tripId);
  
  // Only search place after trip loads
  const { data: placeData } = usePlaceSearch(trip?.destination, {
    enabled: !!trip?.destination, // Wait for trip to load
  });

  return <div>{placeData && <PlaceDetails place={placeData} />}</div>;
}

// ==========================================
// 20. PAGINATION (Future Use)
// ==========================================
import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteTripsExample() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['trips', 'infinite'],
    queryFn: ({ pageParam = 0 }) => fetchTripsPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return (
    <div>
      {data?.pages.map(page => 
        page.trips.map(trip => <TripCard key={trip.id} trip={trip} />)
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </div>
  );
}

// ==========================================
// CONFIGURATION REFERENCE
// ==========================================

/**
 * Cache TTL Settings (Time To Live):
 * 
 * GEOCODE_TTL: 30 days - Coordinates rarely change
 * IMAGE_TTL: 30 days - Photos don't change
 * TRIP_TTL: 5 minutes - Trips change frequently
 * API_RESPONSE_TTL: 24 hours - General API responses
 * 
 * React Query Settings:
 * 
 * staleTime: 5 minutes - How long data is "fresh"
 * cacheTime: 30 minutes - How long unused data stays in memory
 * refetchOnWindowFocus: true - Refetch when user returns to tab
 * refetchOnReconnect: true - Refetch after network reconnect
 * retry: 2 - Retry failed requests twice
 */

/**
 * Cache Storage Locations:
 * 
 * 1. React Query Cache (In-Memory):
 *    - API responses
 *    - Trip data
 *    - User data
 *    - Clears on page reload
 * 
 * 2. IndexedDB (Persistent):
 *    - Geocoding results (geocodes store)
 *    - Google Places images (images store)
 *    - Trip backups (trips store)
 *    - API response cache (api_cache store)
 *    - Survives page reload
 * 
 * 3. LocalStorage (Legacy):
 *    - User auth tokens
 *    - User preferences
 *    - Cache version marker
 *    - Small data only (<5MB total)
 */
