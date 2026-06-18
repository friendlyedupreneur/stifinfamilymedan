import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAfI1UUHUqnpImUpX_fsH_pTeJGZcUcG8s",
  authDomain: "rezaintan-wedding.firebaseapp.com",
  projectId: "rezaintan-wedding",
  storageBucket: "rezaintan-wedding.firebasestorage.app",
  messagingSenderId: "834037181305",
  appId: "1:834037181305:web:4d8335917243a408759da8",
  measurementId: "G-WDJEYXSV6M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };
