import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

/**
 * Firebase configuration
 * Configuration is loaded from environment variables
 * Create a .env file in the frontend directory with your Firebase credentials
 * See .env.example for required variables
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate that all required config values are present
const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);
if (missingKeys.length > 0) {
  console.error('❌ Missing Firebase configuration:', missingKeys);
  console.error('Please create a .env file with your Firebase credentials. See .env.example for reference.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1'); // Explicitly set region
export const storage = getStorage(app);

// Enable offline persistence for better offline experience
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn('⚠️ Offline persistence: Multiple tabs open, enabled in first tab only');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support offline persistence
    console.warn('⚠️ Offline persistence: Browser doesn\'t support offline mode');
  } else {
    console.error('❌ Error enabling offline persistence:', err);
  }
});

// Connect to emulators in development
if (import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  console.log('🔧 Connecting to Firebase Emulators...');

  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectStorageEmulator(storage, 'localhost', 9199);

  console.log('✅ Connected to Firebase Emulators');
}

export default app;
