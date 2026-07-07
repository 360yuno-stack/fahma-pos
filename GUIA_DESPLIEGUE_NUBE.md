# 🌐 Guía de Despliegue en la Nube Gratuito (FAHMA POS)

Esta guía explica paso a paso cómo trasladar tu sistema **FAHMA POS** del modo local a Internet utilizando servicios de alojamiento 100% gratuitos y profesionales.

---

## 🏗️ Resumen de la Arquitectura en la Nube

1. **Base de Datos (Nube):** MongoDB Atlas (Free Tier - M0). *Ya está configurado con tus credenciales.*
2. **Servidor / API (Back-End):** [Render.com](https://render.com/) (Web Service - Plan Gratuito).
3. **Aplicación Web (Front-End):** [Vercel.com](https://vercel.com/) o [Netlify.com](https://netlify.com/) (Plan Gratuito).

---

## 💾 Paso 1: Subir tu Código a GitHub (Privado)

Para conectar tu código con los servicios de alojamiento, debes subirlo a un repositorio privado de GitHub:
1. Crea una cuenta gratuita en [GitHub](https://github.com/) si no tienes una.
2. Crea un **Repositorio Privado** llamado `fahma-pos`.
3. Sube las carpetas `backend` y `frontend` a tu repositorio.

---

## ☁️ Paso 2: Desplegar el Backend en Render (Gratis)

Render compilará y ejecutará tu servidor Express automáticamente de forma gratuita.

1. Regístrate en [Render.com](https://render.com/) usando tu cuenta de GitHub.
2. En tu panel, haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu repositorio `fahma-pos`.
4. Configura los siguientes campos:
   - **Name:** `fahma-pos-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free`
5. Haz clic en **Advanced** y añade las siguientes **Variables de Entorno (Environment Variables)**:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: El enlace de tu clúster de MongoDB Atlas (reemplazando el marcador de posición con tu dirección real de Atlas, tal como se indica en la guía de restauración local).
   - `JWT_SECRET`: Una clave de seguridad personalizada (ej. `clave_secreta_produccion_123`).
   - `ALLOWED_ORIGINS`: La URL que te dará Vercel para tu frontend (ej. `https://fahma-pos-frontend.vercel.app`). *Puedes añadir esta variable después de desplegar el frontend.*
6. Haz clic en **Create Web Service**. Una vez termine la compilación, Render te dará una URL (ej. `https://fahma-pos-backend.onrender.com`). ¡Cópiala!

---

## 💻 Paso 3: Desplegar el Frontend en Vercel (Gratis)

Vercel alojará tu aplicación web estática de React de forma gratuita y con gran velocidad.

1. Regístrate en [Vercel.com](https://vercel.com/) usando tu cuenta de GitHub.
2. Haz clic en **Add New** -> **Project**.
3. Importa tu repositorio `fahma-pos`.
4. Configura los siguientes campos:
   - **Framework Preset:** `Vite` (lo detectará automáticamente).
   - **Root Directory:** `frontend`
   - **Build and Output Settings:** Déjalos por defecto.
5. Abre la sección **Environment Variables** y añade la siguiente variable:
   - **Key:** `VITE_API_URL`
   - **Value:** La URL de tu backend en Render incluyendo `/api` (ej: `https://fahma-pos-backend.onrender.com/api`).
6. Haz clic en **Deploy**. ¡Tu aplicación frontend estará en línea en un par de minutos!

---

## 🛠️ Mantenimiento y Actualizaciones
Cualquier cambio que realices en el código y subas a GitHub se desplegará automáticamente tanto en Render como en Vercel, manteniendo tu POS actualizado de forma continua y sin costes.
