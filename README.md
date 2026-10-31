# EcoUNAN 🌿

Aplicación móvil desarrollada con **Expo / React Native** para la gestión y seguimiento académico en la UNAN. Permite a estudiantes y docentes consultar rendimiento académico, asistencia, notificaciones y más, a través de una interfaz móvil moderna conectada a un API REST.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend (cliente) | React Native + Expo SDK 57 |
| Backend (API) | Node.js + Express 5 |
| Lenguaje | TypeScript, JavaScript, TSX, JSX |
| Base de datos | MongoDB (Mongoose) |
| Autenticación | JWT + bcryptjs |
| Email | Resend / Nodemailer |
| Navegación | React Navigation v7 |

---

## 🚀 Comandos de inicialización

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd EcoUNAN
```

### 2. Configurar variables de entorno

Copia el archivo de entorno de ejemplo `.env.example` en un nuevo archivo de entorno `.env`:

```bash
# Variables para el FrontEnd/Expo (a la raíz del proyecto)
cp .env.example .env

# Variables para el backend
cp backend/.env.example backend/.env
```

Las variables requeridas en `.env` / `backend/.env` son similares:

```env
PORT=5000
MONGO_URI=mongodb://user:password@host/dbname
JWT_SECRET=<64 bytes aleatorios en hex>
RESEND_API_KEY=re_<tu_clave_de_resend>
QR_SECRET=<32 bytes aleatorios en hex>
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

### 3. Instalar dependencias

```bash
# Dependencias del frontend (desde la raíz)
npm install

# Dependencias del backend
cd backend && npm install && cd ..
```

### 4. Ejecutar el backend

```bash
cd backend
npm run dev
```

> El servidor arranca en `http://localhost:5000` por defecto (modo desarrollo con recarga automática vía `tsx watch`).

### 5. Ejecutar el frontend

```bash
# Desde la raíz del proyecto
npm start          # Abre el menú de Expo (recomendado)

# o tambien
npm run start

# o tambien
npx expo start
```

> Se requiere tener instalado [Expo Go](https://expo.dev/client) en el dispositivo móvil, o un emulador configurado.

---

## 📁 Estructura de directorios
> La estructura del directorio se basa en la estructura que brinda Expo.

```
EcoUNAN/
├── backend/                    # API REST (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── app.ts              # Configuración principal de Express
│   │   ├── server.ts           # Punto de entrada del servidor
│   │   ├── config/             # Conexión a la base de datos y configuración
│   │   ├── controllers/        # Lógica de negocio por recurso
│   │   ├── middlewares/        # Middlewares (autenticación, validación, etc.)
│   │   ├── models/             # Modelos de Mongoose (esquemas de MongoDB)
│   │   ├── routes/             # Definición de rutas de la API
│   │   ├── services/           # Servicios externos (email, notificaciones)
│   │   ├── utils/              # Utilidades y helpers
│   │   ├── seed.ts             # Script de datos iniciales
│   │   ├── seedStudents.ts     # Script para poblar estudiantes
│   │   └── seedPerformance.ts  # Script para poblar rendimiento académico
│   ├── uploads/                # Archivos subidos (imágenes de perfil, etc.)
│   ├── .env.example            # Plantilla de variables de entorno del backend
│   ├── package.json
│   └── tsconfig.json
│
├── src/                        # Código fuente del frontend (Expo / React Native)
│   ├── api/                    # Clientes HTTP y llamadas al backend (axios)
│   ├── components/             # Componentes reutilizables de UI
│   ├── constants/              # Constantes globales (rutas, colores, etc.)
│   ├── context/                # Context API (estado global: auth, usuario)
│   ├── hooks/                  # Custom hooks de React
│   ├── navigation/             # Configuración de React Navigation
│   ├── screens/                # Pantallas de la aplicación
│   ├── theme/                  # Sistema de diseño (colores, tipografía, espaciado)
│   ├── types/                  # Tipos e interfaces de TypeScript
│   └── utils/                  # Funciones utilitarias del frontend
│
├── App.tsx                     # Componente raíz de la aplicación
├── index.js                    # Punto de entrada de Expo
├── app.json                    # Configuración del proyecto Expo
├── package.json                # Dependencias del frontend
├── tsconfig.json               # Configuración de TypeScript
├── .env.example                # Plantilla de variables de entorno del frontend
└── .gitignore
```

---

## 🛠️ Scripts adicionales del backend

```bash
# Poblar la base de datos con datos de rendimiento
npm run seed:perf

# Poblar la base de datos con estudiantes
npm run seed:students

# Compilar TypeScript a JavaScript (producción)
npm run build

# Ejecutar en producción (requiere haber compilado antes)
npm start
```

---

## 📄 Licencia

Este proyecto está bajo la licencia incluida en el archivo [LICENSE](./LICENSE).
