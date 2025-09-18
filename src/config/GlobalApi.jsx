import axios from "axios";

const BASE_URL = "https://places.googleapis.com/v1/places:searchText";

// ✅ Add caching to prevent duplicate requests
const cache = new Map();
const pendingRequests = new Map();

const config = {
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_PLACE_API_KEY,
    "X-Goog-FieldMask": "places.id,places.displayName,places.photos",
  },
};

// ✅ Enhanced API function with caching and rate limiting
export const GetPlaceDetails = async (data) => {
  try {
    if (!data.textQuery) {
      throw new Error("textQuery is required");
    }

    const cacheKey = data.textQuery.toLowerCase().trim();

    // ✅ Return cached result if available
    if (cache.has(cacheKey)) {
      console.log("Returning cached result for:", data.textQuery);
      return cache.get(cacheKey);
    }

    // ✅ Prevent duplicate simultaneous requests
    if (pendingRequests.has(cacheKey)) {
      console.log("Waiting for pending request:", data.textQuery);
      return await pendingRequests.get(cacheKey);
    }

    console.log("Making API request to:", BASE_URL);
    console.log("Request payload:", data);

    // ✅ Create and store the promise
    const requestPromise = axios.post(BASE_URL, data, config);
    pendingRequests.set(cacheKey, requestPromise);

    const response = await requestPromise;

    // ✅ Cache successful response
    cache.set(cacheKey, response);
    pendingRequests.delete(cacheKey);

    return response;
  } catch (error) {
    console.error("API request failed:", error);
    pendingRequests.delete(data.textQuery?.toLowerCase().trim());

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }

    throw error;
  }
};

export const PHOTO_REF_URL =
  "https://places.googleapis.com/v1/{NAME}/media?maxHeightPx=600&maxWidthPx=600&key=" +
  import.meta.env.VITE_GOOGLE_PLACE_API_KEY;
