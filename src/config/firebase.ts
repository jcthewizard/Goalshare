import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase config (you'll get this from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDXzLxtX-umVFVePFmTjC3D5VyKJp4bqhs",
  authDomain: "goalshare-app-f7c0b.firebaseapp.com",
  projectId: "goalshare-app-f7c0b",
  storageBucket: "goalshare-app-f7c0b.firebasestorage.app",
  messagingSenderId: "378098937072",
  appId: "1:378098937072:web:26e18417409388cbade635",
  measurementId: "G-FBGX3Q42ZS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;