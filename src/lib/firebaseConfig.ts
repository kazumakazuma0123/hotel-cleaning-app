import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCWZRWawWoQcQEUeOqrn4KdzxZil4lliGw",
  authDomain: "sui-clean.firebaseapp.com",
  projectId: "sui-clean",
  storageBucket: "sui-clean.firebasestorage.app",
  messagingSenderId: "287742948597",
  appId: "1:287742948597:web:5ad5922e0a1372340501bc",
  measurementId: "G-V3Y7ZFD8P2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
