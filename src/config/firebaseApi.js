// config/firebaseApi.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwgk7RffGiqoefdwCA0Ml_tqc207KpLRQ",
  authDomain: "jumuia-faf7a.firebaseapp.com",
  projectId: "jumuia-faf7a",
  storageBucket: "jumuia-faf7a.firebasestorage.app",
  messagingSenderId: "393899269796",
  appId: "1:393899269796:web:4861946c066837abead031"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;

