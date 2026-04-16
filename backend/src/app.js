import express from "express";
import cors from "cors";

import productRoutes from "./routes/product.routes.js";
import movementRoutes from "./routes/movement.routes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use("/products", productRoutes);
app.use("/movements", movementRoutes);

// Ruta base
app.get("/", (req, res) => {
  res.send("API Inventario funcionando");
});

export default app;
