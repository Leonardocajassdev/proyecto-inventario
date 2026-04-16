# Sistema de Inventario

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

## 📦 Funcionalidades

- Crear productos con stock mínimo configurable
- Registrar movimientos de inventario:
  - Entrada (IN)
  - Salida (OUT)
- Cálculo dinámico de stock basado en movimientos
- Validación de stock insuficiente (no permite salidas inválidas)
- Alerta visual cuando el stock está por debajo del mínimo
- Eliminación de productos (con manejo de relaciones)

---

## 🧠 Reglas de negocio

- El stock **no se almacena directamente**, se calcula a partir de los movimientos
- No se permite registrar una salida si el stock disponible es insuficiente
- Se muestra una alerta cuando el stock es menor o igual al stock mínimo definido

---

## 🏗️ Estructura del proyecto

proyecto-inventario/
├── backend/ # Código fuente de la API
├── frontend/ # Código fuente de la aplicación React
├── docs/ # Artefactos de documentación generados con IA
│ ├── PRD.md # Product Requirements Document
│ ├── user-stories.md
│ └── tickets.md
├── prompts.md # Bitácora de uso de IA (Obligatorio)
└── README.md # Documentación principal del proyecto



---

## ⚙️ Cómo ejecutar el proyecto

### 1. Backend

```bash
cd backend
npm install
npm run dev

http://localhost:3000


### 2. frontend
cd frontend
npm install
npm run dev

http://localhost:3000

🔌 Endpoints principales
Productos
GET /products → Obtener lista de productos con stock calculado
POST /products → Crear producto
DELETE /products/:id → Eliminar producto
Movimientos
POST /movements → Registrar movimiento de inventario

📌 Decisiones técnicas
Se optó por calcular el stock dinámicamente para evitar inconsistencias
Se utilizó Prisma como ORM para simplificar la gestión de base de datos
La interfaz se diseñó priorizando claridad y flujo de uso (acciones a la izquierda, visualización a la derecha)
⚠️ Consideraciones
Base de datos SQLite incluida para facilidad de ejecución
No se implementa autenticación (fuera del alcance de la prueba)