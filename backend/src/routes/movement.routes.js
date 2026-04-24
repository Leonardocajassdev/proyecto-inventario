import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { createMovement } from "../services/movement.service.js";

const router = Router();

// 🔵 LISTAR MOVIMIENTOS
router.get("/", async (req, res) => {
  try {
    const movements = await prisma.inventoryMovement.findMany();
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 REGISTRAR MOVIMIENTO
router.post("/", async (req, res) => {
  try {
    const movement = await createMovement(req.body);
    res.status(201).json(movement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;