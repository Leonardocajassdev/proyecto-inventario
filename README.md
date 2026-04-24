# 📦 Sistema de Inventario

Aplicación full-stack para la gestión de inventario que permite registrar productos, controlar movimientos de stock (entradas y salidas) y aplicar validaciones de negocio en tiempo real.

## 🌐 Despliegue
- 🔗 **Frontend:** https://proyecto-inventario-iota.vercel.app
- 🔗 **Backend:** https://proyecto-inventario-5izm.onrender.com

> ⚠️ El backend puede tardar unos segundos en responder la primera vez (cold start en Render).

---

## 🚀 Tecnologías

**Backend:** Node.js · Express · Prisma ORM · SQLite

**Frontend:** React · Vite

**Testing & Calidad:** Jest · Fast-check · Stryker · Playwright · GitHub Actions

---

## 📦 Funcionalidades

- Crear productos con stock mínimo configurable
- Registrar movimientos de inventario (Entrada / Salida)
- Cálculo dinámico de stock basado en movimientos
- Validación de stock insuficiente
- Alerta visual de stock bajo
- Eliminación de productos con manejo de relaciones

---

## 🧠 Reglas de negocio

- El stock se calcula a partir de los movimientos (no se almacena directamente)
- No se permite registrar una salida si el stock disponible es insuficiente
- Se muestra una alerta cuando el stock es menor o igual al stock mínimo definido

---

## 🏗️ Estructura del proyecto

```
proyecto-inventario/
├── backend/        # API REST
├── frontend/       # Aplicación React
├── docs/           # Documentación generada con IA
├── prompts.md      # Uso de IA (requerido)
└── README.md
```

---

## ⚙️ Cómo ejecutar el proyecto en local

### 🔵 Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Servidor en: http://localhost:3000

### 🟣 Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicación en: http://localhost:5173

### 🔧 Variables de entorno

**Backend** (`backend/.env`):
```
DATABASE_URL="file:./dev.db"
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:3000
```

---

## 🔌 Endpoints principales

**Productos**
- `GET /products` → Obtener productos con stock calculado
- `POST /products` → Crear producto
- `DELETE /products/:id` → Eliminar producto

**Movimientos**
- `POST /movements` → Registrar movimiento de inventario

---

## 🧪 Testing

El proyecto implementa múltiples niveles de pruebas:

### ✔ Unit Testing

Valida la lógica de cálculo de stock y movimientos.

```bash
cd backend
npm run test:unit
```

### 🔬 Property-Based Testing (PBT)

Verifica invariantes del sistema con generación de datos aleatorios usando `fast-check`.

```bash
cd backend
npm run test:pbt
```

### 📊 Coverage

```bash
cd backend
npm run test:coverage
```

### 🧬 Mutation Testing (Stryker)

Evalúa la calidad de los tests modificando el código fuente y verificando que los tests fallen. Score actual: **100%**.

```bash
cd backend
npm run mutation
```

### 🎭 End-to-End Testing (Playwright)

Simula el comportamiento real del usuario desde el navegador. Cubre el flujo completo de creación y visualización de productos.

```bash
cd frontend
npm run test:e2e
```

> ⚠️ Para correr E2E en local, asegúrate de tener el backend corriendo en `http://localhost:3000`.

---

## ⚙️ CI/CD

El proyecto incluye un pipeline completo con **GitHub Actions** (`.github/workflows/ci.yml`) que ejecuta automáticamente en cada push a `main`:

| Job | Descripción |
|-----|-------------|
| 🧪 Backend Tests | Unit, integración, PBT y coverage |
| 🧬 Mutation Testing | Stryker con reporte de mutantes |
| 🏗️ Frontend Build | Build de producción con Vite |
| 🎭 E2E Tests | Playwright con backend y frontend levantados en CI |

---

## 📌 Decisiones técnicas

- El stock se calcula dinámicamente para evitar inconsistencias
- Prisma ORM simplifica la gestión de base de datos
- Separación clara de responsabilidades (routes, services)
- Variables de entorno para soportar múltiples entornos
- Diseño de UI enfocado en usabilidad

## ⚠️ Consideraciones

- Base de datos SQLite para facilitar ejecución local
- No se implementa autenticación (fuera del alcance)
- Backend en Render puede presentar latencia inicial (cold start)