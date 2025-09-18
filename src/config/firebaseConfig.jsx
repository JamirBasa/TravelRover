// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhr57j8g5YrJWfS2_OPwTXqkN9u-CDY7s",
  authDomain: "travel-rover.firebaseapp.com",
  projectId: "travel-rover",
  storageBucket: "travel-rover.firebasestorage.app",
  messagingSenderId: "962864296018",
  appId: "1:962864296018:web:00668bde40114f379aef8b",
  measurementId: "G-VGEBMH3N75"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db=getFirestore(app);
export const auth = getAuth(app);
