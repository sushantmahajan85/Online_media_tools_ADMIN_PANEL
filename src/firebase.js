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
import { getFirestore } from "firebase/firestore"
// import { getMessaging } from "firebase/messaging/sw";
// import { getMessaging } from "firebase/messaging";
 const firebaseConfig = {
    apiKey: "AIzaSyBRcZs3nv3uHLH1LdN5Vp3dO2JUpA2LL3o",
    authDomain: "omd-app-76987.firebaseapp.com",
    databaseURL: "https://omd-app-76987-default-rtdb.firebaseio.com",
    projectId: "omd-app-76987",
    storageBucket: "omd-app-76987.appspot.com",
    messagingSenderId: "603565223533",
    appId: "1:603565223533:web:a0e1224d476bd339b21964",
    measurementId: "G-NJRYJWECRX"
};

export const app =  initializeApp(firebaseConfig);
export const db = getFirestore()
// export const messaging = getMessaging(app);
// // const analytics = getAnalytics(app);

