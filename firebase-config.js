// Firebase Configuration
// Replace with your actual Firebase project config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// We would normally import from 'https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js'
// and 'https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js'
// But since this is a local demo, I'll export a mock or the config for the user to fill in.

export default firebaseConfig;

/* 
How to integrate in app.js:

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Save Message:
async function saveMessage(to, text, file) {
    let imageUrl = null;
    if (file) {
        const storageRef = ref(storage, `memories/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(snapshot.ref);
    }
    
    await addDoc(collection(db, "messages"), {
        to: to,
        text: text,
        image: imageUrl,
        timestamp: Date.now()
    });
}
*/
