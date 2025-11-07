import { initializeApp } from "firebase/app";
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings
export const db = getFirestore(app);

// ✅ Enable offline persistence for better reliability
// This allows the app to work offline and sync when connection is restored
enableIndexedDbPersistence(db, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
}).catch((err) => {
  if (err.code === "failed-precondition") {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn(
      "⚠️ Firebase persistence failed: Multiple tabs open. Only one tab can have persistence enabled."
    );
  } else if (err.code === "unimplemented") {
    // The current browser doesn't support persistence
    console.warn("⚠️ Firebase persistence not supported in this browser.");
  } else {
    console.error("❌ Firebase persistence error:", err);
  }
});

console.log("✅ Firebase initialized with offline persistence");
