// ============================================================
// Gourmet Map - Firebase Initialization
// Firebase 初期設定・初期化
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCwCvKcYkGdqsIf9srXHiX4RGKtEEi0Tj8",
  authDomain: "my-gourmet-map-25508.firebaseapp.com",
  databaseURL: "https://my-gourmet-map-25508-default-rtdb.firebaseio.com",
  projectId: "my-gourmet-map-25508",
  storageBucket: "my-gourmet-map-25508.firebasestorage.app",
  messagingSenderId: "118013321716",
  appId: "1:118013321716:web:33dd3ea5c2ce2aa50fd9a1",
  measurementId: "G-RM3R988L24"
};

// Firebase 初期化
firebase.initializeApp(firebaseConfig);

// Firebase Authentication
const auth = firebase.auth();

// Firebase Realtime Database
const database = firebase.database();

// Firebase Analytics
firebase.analytics();