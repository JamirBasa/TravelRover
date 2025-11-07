import axios from "axios";

// ✅ Use Django backend proxy instead of direct API calls
const BACKEND_BASE_URL = "http://localhost:8000/api/langgraph";
const PLACES_SEARCH_URL = `${BACKEND_BASE_URL}/places-search/`;

// ✅ Add caching to prevent duplicate requests
const cache = new Map();
const pendingRequests = new Map();

// ✅ Add function to clear cache
export const clearPlacesCache = () => {
  cache.clear();
  pendingRequests.clear();
};

// ✅ Enhanced API function with backend proxy (no API key needed, no CORS issues!)
export const GetPlaceDetails = async (data) => {
  try {
    if (!data.textQuery) {
      throw new Error("textQuery is required");
    }

    const cacheKey = data.textQuery.toLowerCase().trim();

    // ✅ Return cached result if available
    if (cache.has(cacheKey)) {
      const cachedResponse = cache.get(cacheKey);

      // ✅ DEBUG: Check if cached response has photos
      const place = cachedResponse?.data?.places?.[0];
      if (place) {
        console.log("📦 Cache hit:", cacheKey);
      }

      return cachedResponse;
    }

    // ✅ Prevent duplicate simultaneous requests
    if (pendingRequests.has(cacheKey)) {
      console.log("⏳ Waiting for pending request:", cacheKey);
      return await pendingRequests.get(cacheKey);
    }

    console.log("🔍 Searching via backend proxy:", data.textQuery);

    // ✅ Call Django backend proxy (no API key needed!)
    const requestPromise = axios.post(PLACES_SEARCH_URL, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    pendingRequests.set(cacheKey, requestPromise);

    const response = await requestPromise;

    // ✅ Backend returns { success: true, data: { places: [...] } }
    // Transform to match original format
    const transformedResponse = {
      data: response.data.data, // Extract inner 'data' from backend response
    };

    // ✅ DEBUG: Log what we got back
    const place = transformedResponse?.data?.places?.[0];
    if (place) {
      console.log(
        "✅ Place found:",
        place.displayName?.text || place.displayName,
        "| Photos:",
        place.photos?.length || 0
      );

      // Extra debug for photo issues
      if (!place.photos || place.photos.length === 0) {
        console.warn("⚠️ No photos in response for:", data.textQuery);
        console.warn("⚠️ Place keys:", Object.keys(place));
      }
    }

    // ✅ Cache successful response
    cache.set(cacheKey, transformedResponse);
    pendingRequests.delete(cacheKey);

    return transformedResponse;
  } catch (error) {
    console.error("🚨 API request failed:", error);
    pendingRequests.delete(data.textQuery?.toLowerCase().trim());

    if (error.response) {
      console.error("📄 Response data:", error.response.data);
      console.error("📊 Response status:", error.response.status);
    }

    throw error;
  }
};

// ✅ Photo URL builder - uses backend proxy with proper URL encoding
export const PHOTO_REF_URL = (photoRef) => {
  if (!photoRef) return null;
  return `${BACKEND_BASE_URL}/photo-proxy/?photo_ref=${encodeURIComponent(
    photoRef
  )}&maxHeightPx=600&maxWidthPx=600`;
};

// ✅ Helper function to validate photo URLs (deprecated - use PHOTO_REF_URL directly)
export const validatePhotoUrl = (photoRef) => {
  return PHOTO_REF_URL(photoRef);
};

// ✅ Function to fetch place photo through backend proxy (CORS-free!)
export const fetchPlacePhoto = async (photoReference) => {
  if (!photoReference) {
    throw new Error("Photo reference is required");
  }

  try {
    // Use backend proxy to bypass CORS restrictions
    const proxyUrl = `http://localhost:8000/api/langgraph/photo-proxy/?photo_ref=${encodeURIComponent(
      photoReference
    )}&maxHeightPx=600&maxWidthPx=600`;

    // Fetch through Django proxy (no CORS issues!)
    const response = await fetch(proxyUrl, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch photo: ${response.status} ${response.statusText}`
      );
    }

    // Convert to blob and create object URL
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    return blobUrl;
  } catch (error) {
    console.error("❌ Error fetching place photo:", error);
    throw error;
  }
};
