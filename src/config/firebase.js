import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC-yYTNr9iET5QHy6Pw0-OP-Dy8niPZe3c",
    authDomain: "monicafritzrealtor.firebaseapp.com",
    projectId: "monicafritzrealtor",
    storageBucket: "monicafritzrealtor.firebasestorage.app",
    messagingSenderId: "728509071959",
    appId: "1:728509071959:web:18502a3d8a34dd6cd71912",
    measurementId: "G-E1M4SP2G08",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
