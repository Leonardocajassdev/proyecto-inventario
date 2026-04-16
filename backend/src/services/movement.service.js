import { prisma } from "../utils/prisma.js";
import { calculateStock } from "./stock.service.js";

export const createMovement = async ({ productId, type, quantity }) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  const stock = await calculateStock(productId);

  // 🟢 ENTRADAS (IN) siempre permitidas
  if (type === "OUT") {
    // ❌ No permitir stock negativo
    if (quantity > stock) {
      throw new Error("Stock insuficiente");
    }

    // ❌ No permitir bajar del mínimo
    const newStock = stock - quantity;

    if (newStock < product.minStock) {
      throw new Error(
        `No puedes bajar del stock mínimo (${product.minStock})`
      );
    }
  }

  return prisma.inventoryMovement.create({
    data: {
      productId,
      type,
      quantity,
    },
  });
};