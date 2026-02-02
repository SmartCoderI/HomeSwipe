// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB_5UGnaktd7qQ25q40mMHSw3QdMmBGSlA",
  authDomain: "homeswipe-50d93.firebaseapp.com",
  projectId: "homeswipe-50d93",
  storageBucket: "homeswipe-50d93.firebasestorage.app",
  messagingSenderId: "518474429757",
  appId: "1:518474429757:web:f05fe9d1487cfd359d0154",
  measurementId: "G-3G4ZCKN0Z2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
