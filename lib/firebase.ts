import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQzlnpmR5R9_10He0E7pxDW8zgNkXUUPE",
  authDomain: "po-bazar-c14f0.firebaseapp.com",
  projectId: "po-bazar-c14f0",
  storageBucket: "po-bazar-c14f0.firebasestorage.app",
  messagingSenderId: "769390579331",
  appId: "1:769390579331:web:771b2546eff98baa7dd5b6",
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore instance
export const db = getFirestore(app);
