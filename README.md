# 📦 Sistema de Inventario

Aplicación full-stack para la gestión de inventario, que permite registrar productos, controlar movimientos de stock (entradas y salidas) y aplicar validaciones de negocio.

---

## 🚀 Tecnologías

### Backend
- Node.js
- Express
- Prisma ORM
- SQLite

### Frontend
- React
- Vite

---

## 🌐 Despliegue

- 🔗 Frontend: https://proyecto-inventario-iota.vercel.app  
- 🔗 Backend: https://proyecto-inventario-5izm.onrender.com  

---

## 📦 Funcionalidades

- Crear productos con stock mínimo configurable
- Registrar movimientos de inventario:
  - Entrada (IN)
  - Salida (OUT)
- Cálculo dinámico de stock basado en movimientos
- Validación de stock insuficiente
- Alerta visual de stock bajo
- Eliminación de productos

---

## 🧠 Reglas de negocio

- El stock **no se almacena directamente**, se calcula a partir de los movimientos
- No se permite registrar una salida si el stock disponible es insuficiente
- Se muestra una alerta cuando el stock es menor o igual al stock mínimo definido

---

## 🏗️ Estructura del proyecto


proyecto-inventario/
├── backend/
├── frontend/
├── docs/
├── prompts.md
└── README.md


---

## ⚙️ Cómo ejecutar el proyecto en local

### 🔵 Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev

Servidor en:
http://localhost:3000

🟣 Frontend

cd frontend
npm install
npm run dev

Aplicación en:

http://localhost:5173

🔧 Variables de entorno
Backend (backend/.env)
DATABASE_URL="file:./dev.db"

Frontend (frontend/.env)
VITE_API_URL=http://localhost:3000

🔌 Endpoints principales
Productos
GET /products → Obtener productos con stock calculado
POST /products → Crear producto
DELETE /products/:id → Eliminar producto

Movimientos
POST /movements → Registrar movimiento
📌 Decisiones técnicas
El stock se calcula dinámicamente para evitar inconsistencias
Se utiliza Prisma ORM para simplificar la interacción con la base de datos
Separación clara de responsabilidades (routes, services, utils)
Uso de variables de entorno para soportar múltiples entornos (local y producción)