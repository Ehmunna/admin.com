// Admin Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';

const firebaseConfig = {
    apiKey: "AIzaSyC2Bsd-HqfhhC8i5cQUF2ZmofUJaFIcvDs",
    authDomain: "lamim-754aa.firebaseapp.com",
    projectId: "lamim-754aa",
    storageBucket: "lamim-754aa.firebasestorage.app",
    messagingSenderId: "1087897423283",
    appId: "1:1087897423283:web:10a57c0acf8879fc1e4fc6",
    measurementId: "G-R5SNM13YMG"
};

// Initialize Firebase
const adminFirebaseApp = initializeApp(firebaseConfig, 'AdminApp');
window.adminFirebaseApp = adminFirebaseApp;

console.log('Admin Firebase initialized successfully');