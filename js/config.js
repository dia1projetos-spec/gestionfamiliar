import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyD2hlgQqhChsPJHOaIdwHXUL4SlEMGN4Ss",
  authDomain: "henrique-sofi.firebaseapp.com",
  projectId: "henrique-sofi",
  storageBucket: "henrique-sofi.firebasestorage.app",
  messagingSenderId: "244619990531",
  appId: "1:244619990531:web:300a96f7a3a0777f7de036"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const cloudinaryConfig = { cloudName: "", uploadPreset: "" };
