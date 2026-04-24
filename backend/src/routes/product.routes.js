import { Router } from "express";
import { prisma } from "../utils/prisma.js";

const router = Router();


// 🔵 OBTENER PRODUCTOS (con stock calculado)
router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        movements: true,
      },
    });

    const result = products.map((p) => {
      const stock = p.movements.reduce((acc, mov) => {
        if (mov.type === "IN") return acc + mov.quantity;
        if (mov.type === "OUT") return acc - mov.quantity;
        return acc;
      }, 0);

      return {
        ...p,
        stock,
        isLowStock: stock <= p.minStock,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 🟢 CREAR PRODUCTO
router.post("/", async (req, res) => {
  try {
    const { name, description, minStock } = req.body;

    if (!name || minStock == null) {
      return res.status(400).json({
        error: "Nombre y stock mínimo son obligatorios",
      });
    }

    if (!description) {
      return res.status(400).json({ error: "La descripción es obligatoria" });
    }

    if (typeof minStock !== "number" || minStock < 0) {
      return res.status(400).json({
        error: "minStock debe ser un número mayor o igual a 0",
      });
    }

    const product = await prisma.product.create({
      data: { name, description, minStock },
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 🔴 ELIMINAR PRODUCTO
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Verificar existencia primero (el test mockea findUnique para controlar este flujo)
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await prisma.product.delete({ where: { id } });

    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;