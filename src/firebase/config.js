import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAAExInvayu7EwPNgdiS6XwSdNuNQiBsME",
  authDomain: "mini-ao-c2901.firebaseapp.com",
  projectId: "mini-ao-c2901",
  storageBucket: "mini-ao-c2901.firebasestorage.app",
  messagingSenderId: "202172408904",
  appId: "1:202172408904:web:b2bf6cf9df3aee5360247d",
  measurementId: "G-TWZXZTEZPK"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app); 