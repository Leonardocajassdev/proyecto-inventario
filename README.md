📦 Sistema de Inventario

Aplicación full-stack para la gestión de inventario que permite registrar productos, controlar movimientos de stock (entradas y salidas) y aplicar validaciones de negocio en tiempo real.

🌐 Despliegue
🔗 Frontend: https://proyecto-inventario-iota.vercel.app
🔗 Backend: https://proyecto-inventario-5izm.onrender.com

⚠️ Nota: El backend puede tardar unos segundos en responder la primera vez (cold start en Render).

🚀 Tecnologías
Backend
Node.js
Express
Prisma ORM
SQLite
Frontend
React
Vite
Testing & Calidad
Jest (Unit Testing)
Fast-check (Property-Based Testing)
Stryker (Mutation Testing)
Playwright (End-to-End Testing)
GitHub Actions (CI/CD)

📦 Funcionalidades
Crear productos con stock mínimo configurable
Registrar movimientos de inventario:
Entrada (IN)
Salida (OUT)
Cálculo dinámico de stock basado en movimientos
Validación de stock insuficiente
Alerta visual de stock bajo
Eliminación de productos con manejo de relaciones

🧠 Reglas de negocio
El stock no se almacena directamente, se calcula a partir de los movimientos
No se permite registrar una salida si el stock disponible es insuficiente
Se muestra una alerta cuando el stock es menor o igual al stock mínimo definido

🏗️ Estructura del proyecto
proyecto-inventario/
├── backend/        # API REST
├── frontend/       # Aplicación React
├── docs/           # Documentación generada con IA
├── prompts.md      # Uso de IA (requerido)
└── README.md

⚙️ Cómo ejecutar el proyecto en local
🔵 Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev

Servidor en:
👉 http://localhost:3000

🟣 Frontend
cd frontend
npm install
npm run dev

Aplicación en:
👉 http://localhost:5173


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
POST /movements → Registrar movimiento de inventario


🧪 Testing

El proyecto implementa múltiples niveles de pruebas para garantizar calidad y robustez:

✔ Unit Testing

Valida la lógica de cálculo de stock.

cd backend
npm test

🔬 Property-Based Testing (PBT)

Verifica invariantes del sistema con generación de datos aleatorios.

🧬 Mutation Testing

Evalúa la calidad de los tests modificando el código.

cd backend
npx stryker run

🎭 End-to-End Testing (E2E)

Simula el comportamiento real del usuario desde el frontend.

cd frontend
npm run test:e2e

⚙️ CI/CD

El proyecto incluye un pipeline de integración continua con GitHub Actions que:

Instala dependencias
Ejecuta tests del backend
Construye el frontend
Ejecuta pruebas E2E

Archivo: .github/workflows/ci.yml

📌 Decisiones técnicas
El stock se calcula dinámicamente para evitar inconsistencias
Prisma ORM simplifica la gestión de base de datos
Separación clara de responsabilidades (routes, services, utils)
Uso de variables de entorno para soportar múltiples entornos (local/producción)
Diseño de UI enfocado en usabilidad (acciones a la izquierda, visualización a la derecha)

⚠️ Consideraciones
Base de datos SQLite incluida para facilitar ejecución local
No se implementa autenticación (fuera del alcance de la prueba)
Backend desplegado en Render puede presentar latencia inicial