import axios from "axios";

const BASE_URL = "https://places.googleapis.com/v1/places:searchText";

// ✅ Add caching to prevent duplicate requests
const cache = new Map();
const pendingRequests = new Map();

// Debug API key availability
const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
console.log("🔑 Google Places API Key status:", {
  hasKey: !!apiKey,
  keyLength: apiKey?.length || 0,
  keyPreview: apiKey
    ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
    : "MISSING",
});

const config = {
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask":
      "places.id,places.displayName,places.photos,places.formattedAddress",
  },
};

// ✅ Add function to clear cache
export const clearPlacesCache = () => {
  cache.clear();
  pendingRequests.clear();
  console.log("🗑️ Places cache cleared!");
};

// ✅ Enhanced API function with better caching and debugging
export const GetPlaceDetails = async (data) => {
  try {
    if (!data.textQuery) {
      throw new Error("textQuery is required");
    }

    const cacheKey = data.textQuery.toLowerCase().trim();

    // ✅ Return cached result if available
    if (cache.has(cacheKey)) {
      console.log("Returning cached result for:", data.textQuery);
      const cachedResponse = cache.get(cacheKey);

      // ✅ DEBUG: Check if cached response has photos
      const place = cachedResponse?.data?.places?.[0];
      if (place) {
        console.log("📸 Cached place photos:", {
          hasPhotos: !!place.photos,
          photoCount: place.photos?.length || 0,
          firstPhotoRef: place.photos?.[0]?.name?.substring(0, 50) + "...",
        });
      }

      return cachedResponse;
    }

    // ✅ Prevent duplicate simultaneous requests
    if (pendingRequests.has(cacheKey)) {
      console.log("Waiting for pending request:", data.textQuery);
      return await pendingRequests.get(cacheKey);
    }

    console.log("🌐 Making NEW API request to:", BASE_URL);
    console.log("📤 Request payload:", data);

    // ✅ Create and store the promise
    const requestPromise = axios.post(BASE_URL, data, config);
    pendingRequests.set(cacheKey, requestPromise);

    const response = await requestPromise;

    // ✅ DEBUG: Log what we got back
    const place = response?.data?.places?.[0];
    if (place) {
      console.log("📍 New API response:", {
        placeName: place.displayName?.text,
        hasPhotos: !!place.photos,
        photoCount: place.photos?.length || 0,
        firstPhotoRef: place.photos?.[0]?.name,
      });
    }

    // ✅ Cache successful response
    cache.set(cacheKey, response);
    pendingRequests.delete(cacheKey);

    return response;
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

export const PHOTO_REF_URL =
  "https://places.googleapis.com/v1/{NAME}/media?maxHeightPx=600&maxWidthPx=600&key=" +
  import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// ✅ Helper function to validate photo URLs
export const validatePhotoUrl = (photoRef) => {
  if (!photoRef) return false;

  const url = PHOTO_REF_URL.replace("{NAME}", photoRef);
  console.log("🔗 Generated photo URL:", url);

  return url;
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

    console.log(
      "📸 Fetching photo via backend proxy:",
      photoReference.substring(0, 50) + "..."
    );

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

    console.log("✅ Photo fetched successfully via proxy");
    return blobUrl;
  } catch (error) {
    console.error("❌ Error fetching place photo:", error);
    throw error;
  }
};
