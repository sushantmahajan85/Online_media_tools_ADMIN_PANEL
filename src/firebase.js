// import firebase from 'firebase/compat/app';
// import 'firebase/compat/auth';
// import 'firebase/compat/firestore';
// import 'firebase/compat/database';
// import "firebase/compat/storage"

// const firebaseConfig = {
//   apiKey: "AIzaSyALt7MmiQ2rYG1pOmX8_avc-6w8GAvzyyA",
//   authDomain: "kitchendiariesbyzubda-9eab6.firebaseapp.com",
//   databaseURL: "https://kitchendiariesbyzubda-9eab6-default-rtdb.firebaseio.com",
//   projectId: "kitchendiariesbyzubda-9eab6",
//   storageBucket: "kitchendiariesbyzubda-9eab6.appspot.com",
//   messagingSenderId: "84275233808",
//   appId: "1:84275233808:web:25af0a31a86d6cd0503695",
//   measurementId: "G-T4YTX3HZ28"

// };

// firebase.initializeApp(firebaseConfig);

// const database = firebase.database();
// export const storage = firebase.storage();

// export default database;


// import { getMessaging } from "firebase/messaging";
// import  admin from "firebase-admin";

// var serviceAccount = require("path/to/serviceAccountKey.json");

// // import { getAnalytics } from "firebase/analytics";

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
//   });
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { getMessaging } from "firebase/messaging/sw";
// import { getMessaging } from "firebase/messaging";
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore();
export const storage = getStorage(app);
// export const messaging = getMessaging(app);
// // const analytics = getAnalytics(app);

