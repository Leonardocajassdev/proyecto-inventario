import { Router } from "express";
import { createMovement } from "../services/movement.service.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const movement = await createMovement(req.body);
    res.json(movement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;