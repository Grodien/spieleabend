import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: 'spieleabend-tracker',
  appId: '1:897276956220:web:a45722eb21aedca3d73d39',
  storageBucket: 'spieleabend-tracker.firebasestorage.app',
  apiKey: 'AIzaSyBvCtNQd9EXdmcgzhsgd5tzcEGaMM0KAIw',
  authDomain: 'spieleabend-tracker.firebaseapp.com',
  messagingSenderId: '897276956220',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, 'spieleabend-db');
export const auth = getAuth(app);
