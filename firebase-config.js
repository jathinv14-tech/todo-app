// Firebase Configuration
// Replace these values with your own Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps > Web app

const firebaseConfig = {
    apiKey: "AIzaSyDwqNUfOTj_K3cT0bGajM7c-1h6syZx7PI",
  authDomain: "todo-app-a0b93.firebaseapp.com",
  projectId: "todo-app-a0b93",
  storageBucket: "todo-app-a0b93.firebasestorage.app",
  messagingSenderId: "635521722399",
  appId: "1:635521722399:web:41438190dfa537b0750d2a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Export for use in other files
window.firebaseDB = database;
