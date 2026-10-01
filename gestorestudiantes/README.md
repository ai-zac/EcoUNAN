# Gestor de Estudiantes - Aplicación Móvil Conectada a la Nube

Aplicación móvil desarrollada con **React Native (Expo)** conectada a una API REST y base de datos independiente en la nube (**MongoDB Atlas - Base de datos `gestor_estudiantes`**).

---

## 🚀 Cómo Iniciar el Proyecto

### 1. Iniciar el Servidor Backend (Terminal 1)
En la carpeta principal del proyecto:
```bash
cd backend
npm run dev
```
> El servidor se levantará en el puerto `5000` y conectará automáticamente a las bases de datos de EcoUNAN y a la base de datos independiente **`gestor_estudiantes`**.

*(Opcional) Si deseas recargar los 6 estudiantes de prueba:*
```bash
cd backend
npm run seed:students
```

---

### 2. Iniciar la Aplicación Móvil (Terminal 2)
En una segunda terminal, dirígete a esta carpeta:
```bash
cd gestorestudiantes
npx expo start
```
* Presiona `a` para abrir en emulador de Android.
* O escanea el código QR con la app **Expo Go** en tu dispositivo físico Android.

---

## ⚙️ Conexión desde un Celular Físico en la misma Red Wi-Fi
1. Abre la aplicación en tu celular.
2. En la pantalla de Login, presiona el botón superior derecho **"Configurar IP"**.
3. Ingresa la IP local de tu computadora en la red Wi-Fi (ejemplo: `http://192.168.1.50:5000/api`).
4. Presiona **"Probar Conexión"** y luego **"Guardar IP"**.

---

## 🔑 Credenciales de Acceso para la Demostración
* **Usuario:** `admin`
* **Contraseña:** `admin123`
*(O presiona el botón interactivo de "Rellenar credenciales demo" en la pantalla de inicio de sesión).*

---

## 📋 Endpoints de la API REST Implementados
* `POST   /api/estudiantes/login` → Autenticación de usuario / docente.
* `GET    /api/estudiantes` → Consultar lista de estudiantes (con soporte de búsqueda `?q=`).
* `GET    /api/estudiantes/:id` → Consultar información de un estudiante por su ID.
* `POST   /api/estudiantes` → Registrar un nuevo estudiante en la base de datos.
* `PUT    /api/estudiantes/:id` → Modificar datos del estudiante.
* `DELETE /api/estudiantes/:id` → Eliminar registro de estudiante.
* `POST   /api/estudiantes/seed` → Inicializar la colección con datos de prueba.
