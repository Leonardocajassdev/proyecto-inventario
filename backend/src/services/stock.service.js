import { prisma } from "../utils/prisma.js";

export const calculateStock = async (productId) => {
  const movements = await prisma.inventoryMovement.findMany({
    where: { productId },
  });

  return movements.reduce((acc, mov) => {
    if (mov.type === "IN")  return acc + mov.quantity;
    if (mov.type === "OUT") return acc - mov.quantity;
    return acc;
  }, 0);
};