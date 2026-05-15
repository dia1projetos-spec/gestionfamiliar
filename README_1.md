# Henrique e Sofia - Sistema de Control Financiero

Sistema completo en HTML/CSS/JS, 100% en español (Argentina), responsive, con Firebase.

## Estructura
```
/henrique-sofia
  index.html
  /css/style.css
  /js/config.js
  /js/auth.js
  /js/dashboard.js
```

## 1) Firebase
1. Crea proyecto en console.firebase.google.com
2. Authentication > Sign-in method > habilita Email/Password
3. Crea usuarios administradores manualmente
4. Firestore Database > crea en modo producción
5. Copia la config en js/config.js

Reglas Firestore sugeridas:
```
rules_version='2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 2) Cloudinary (opcional)
Para imágenes, completa cloudName y uploadPreset en js/config.js

## 3) GitHub + Vercel
1. Sube carpeta a GitHub
2. En Vercel: New Project > importa repo
3. Framework: Other, Build command: (vacío), Output: /
4. Agrega dominio personalizado en Vercel

## Funciones
- Login con Firebase
- Aportes: tabla editable, suma automática
- Gastos: tabla editable, descuenta del total de aportes (saldo visible, aportes no se modifican)
- Calendario grande: días con punto parpadeante cuando hay compromiso, click para agregar/editar/borrar
- Tareas: checklist con opción de borrar
- Diseño tecnológico dark con glassmorphism, totalmente responsive

Todo listo para usar en Argentina.
