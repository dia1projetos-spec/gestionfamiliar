// js/auth.js
import { auth } from './config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loader = document.getElementById('loader');
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// Simular carga inicial
setTimeout(() => {
  loader.style.opacity = '0';
  setTimeout(() => loader.style.display = 'none', 600);
}, 1800);

onAuthStateChanged(auth, (user) => {
  if (user) {
    userEmail.textContent = user.email;
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    window.dispatchEvent(new CustomEvent('user-logged', { detail: user }));
  } else {
    appScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = 'Credenciales inválidas. Verifica email y contraseña.';
    console.error(err);
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));
