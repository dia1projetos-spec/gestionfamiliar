// js/config.js - Configuración Firebase y Cloudinary
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️ REEMPLAZA con tus credenciales de Firebase
export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "XXXXXXXX",
  appId: "1:XXXXXXXX:web:XXXXXXXX"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Cloudinary (para subir imágenes si lo necesitas)
export const cloudinaryConfig = {
  cloudName: "TU_CLOUD_NAME",
  uploadPreset: "TU_UPLOAD_PRESET"
};

window.HS_CONFIG = { firebaseConfig, cloudinaryConfig };
