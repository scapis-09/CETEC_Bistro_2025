// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"; // Importa a função para inicializar o app Firebase
import { getAuth } from "firebase/auth"; // Importa as funções do Firebase Authentication

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
const db = initializeApp(firebaseConfig); // VARIAVEL FIREBASE = db