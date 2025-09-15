import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "studio-5908953384-f26d4",
  appId: "1:30293592997:web:86fed49420a4d70cc7b64c",
  storageBucket: "studio-5908953384-f26d4.firebasestorage.app",
  apiKey: "AIzaSyAjW45R_lPqD594vzmW2tGHfu2JWXvwarI",
  authDomain: "studio-5908953384-f26d4.firebaseapp.com",
  messagingSenderId: "30293592997",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
