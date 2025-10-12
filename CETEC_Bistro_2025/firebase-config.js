// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";
// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyArntNoWXAlL9gzWdP_iWc7pGXhaEvSu3A",
  authDomain: "bistro-cetec-2025.firebaseapp.com",
  projectId: "bistro-cetec-2025",
  storageBucket: "bistro-cetec-2025.firebasestorage.app",
  messagingSenderId: "203632560344",
  appId: "1:203632560344:web:dcd65063ca089f88d5efad",
  measurementId: "G-7FW0HEHMN8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que você quer usar
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;