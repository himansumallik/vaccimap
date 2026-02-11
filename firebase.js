import { initializeApp } from 'firebase/app';
// Import the specific auth functions we need
import { 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// This is YOUR config object from the Firebase console (Web App)
const firebaseConfig = {
  apiKey: "AIzaSyBQ0ZQWeZrHKeZqenbJUObRoVKgM0k9_os",
  authDomain: "vaccimap-f8c80.firebaseapp.com",
  projectId: "vaccimap-f8c80",
  storageBucket: "vaccimap-f8c80.firebasestorage.app",
  messagingSenderId: "928018190071",
  appId: "1:928018190071:web:e8abf5c5e5834607ab4df2"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

// We'll just use the appId from your config.
// This is used for your Firestore database path.
const appId = firebaseConfig.appId;

// --- THIS IS THE FIX ---
// Export the config object itself
export { auth, db, appId, firebaseConfig };

