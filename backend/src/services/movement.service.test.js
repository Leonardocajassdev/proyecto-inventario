/**
 * movement.service.test.js
 *
 * Tests unitarios para createMovement.
 * Se mockean prisma Y calculateStock para aislar completamente la lógica
 * de negocio del service: producto existente, stock insuficiente, mínimo.
 *
 * Cada test verifica UN comportamiento específico con un nombre que describe
 * exactamente lo que debe ocurrir.
 */

import { describe, test, expect, jest, beforeEach } from "@jest/globals";

// ─── Mocks ANTES de importar el service ───────────────────────────────────────
jest.unstable_mockModule("../utils/prisma.js", () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
    },
    inventoryMovement: {
      findMany: jest.fn(),
      create:   jest.fn(),
    },
  },
}));

jest.unstable_mockModule("./stock.service.js", () => ({
  calculateStock: jest.fn(),
}));

const { prisma }          = await import("../utils/prisma.js");
const { calculateStock }  = await import("./stock.service.js");
const { createMovement }  = await import("./movement.service.js");

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PRODUCT_ID = "prod-xyz-456";

function makeProduct(overrides = {}) {
  return {
    id:          PRODUCT_ID,
    name:        "Laptop Test",
    description: "Un producto de prueba",
    minStock:    5,
    ...overrides,
  };
}

function makeMovementResult(overrides = {}) {
  return {
    id:        "mov-001",
    productId: PRODUCT_ID,
    type:      "IN",
    quantity:  10,
    createdAt: new Date(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("createMovement({ productId, type, quantity })", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Producto no encontrado ───────────────────────────────────────────────────

  describe("cuando el producto no existe", () => {
    test("lanza Error('Producto no encontrado')", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "IN", quantity: 10 })
      ).rejects.toThrow("Producto no encontrado");
    });

    test("no llega a calcular el stock ni crear el movimiento", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        createMovement({ productId: "inexistente", type: "IN", quantity: 5 })
      ).rejects.toThrow();

      expect(calculateStock).not.toHaveBeenCalled();
      expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    });

    test("usa el productId correcto para buscar el producto", async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      const id = "prod-especifico-999";

      await expect(
        createMovement({ productId: id, type: "IN", quantity: 1 })
      ).rejects.toThrow();

      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id } });
    });
  });

  // ── Entradas (IN) ────────────────────────────────────────────────────────────

  describe("movimiento tipo IN", () => {
    test("siempre se permite aunque el stock actual sea 0", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 50 }));
      calculateStock.mockResolvedValue(0);
      prisma.inventoryMovement.create.mockResolvedValue(makeMovementResult({ type: "IN", quantity: 1 }));

      const result = await createMovement({ productId: PRODUCT_ID, type: "IN", quantity: 1 });

      expect(result.type).toBe("IN");
      expect(result.quantity).toBe(1);
      expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(1);
    });

    test("se permite aunque el stock sea inferior al mínimo (IN no tiene restricción)", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 100 }));
      calculateStock.mockResolvedValue(3); // muy por debajo del mínimo
      prisma.inventoryMovement.create.mockResolvedValue(makeMovementResult({ type: "IN", quantity: 5 }));

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "IN", quantity: 5 })
      ).resolves.toBeDefined();
    });

    test("crea el movimiento con los datos exactos pasados", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct());
      calculateStock.mockResolvedValue(20);
      const expected = makeMovementResult({ type: "IN", quantity: 30 });
      prisma.inventoryMovement.create.mockResolvedValue(expected);

      await createMovement({ productId: PRODUCT_ID, type: "IN", quantity: 30 });

      expect(prisma.inventoryMovement.create).toHaveBeenCalledWith({
        data: { productId: PRODUCT_ID, type: "IN", quantity: 30 },
      });
    });

    test("retorna el movimiento creado por prisma", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct());
      calculateStock.mockResolvedValue(10);
      const expected = makeMovementResult({ type: "IN", quantity: 10 });
      prisma.inventoryMovement.create.mockResolvedValue(expected);

      const result = await createMovement({ productId: PRODUCT_ID, type: "IN", quantity: 10 });

      expect(result).toEqual(expected);
    });
  });

  // ── Salidas (OUT) — stock insuficiente ───────────────────────────────────────

  describe("movimiento tipo OUT — stock insuficiente", () => {
    test("lanza 'Stock insuficiente' cuando quantity > stock actual", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 0 }));
      calculateStock.mockResolvedValue(5);

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 6 })
      ).rejects.toThrow("Stock insuficiente");
    });

    test("lanza cuando quantity === stock actual + 1 (borde superior)", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 0 }));
      calculateStock.mockResolvedValue(10);

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 11 })
      ).rejects.toThrow("Stock insuficiente");
    });

    test("lanza cuando el stock es 0 y se intenta cualquier salida", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 0 }));
      calculateStock.mockResolvedValue(0);

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 1 })
      ).rejects.toThrow("Stock insuficiente");
    });

    test("no crea el movimiento si hay stock insuficiente", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 0 }));
      calculateStock.mockResolvedValue(3);

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 4 })
      ).rejects.toThrow();

      expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    });
  });

  // ── Salidas (OUT) — stock mínimo ─────────────────────────────────────────────

  describe("movimiento tipo OUT — violación de stock mínimo", () => {
    test("lanza cuando el stock resultante quedaría por debajo del mínimo", async () => {
      // stock: 20, minStock: 10, quantity: 15 → resultante: 5 < 10
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 10 }));
      calculateStock.mockResolvedValue(20);

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 15 })
      ).rejects.toThrow(/stock m[íi]nimo/i);
    });

    test("el mensaje de error incluye el valor del mínimo configurado", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 25 }));
      calculateStock.mockResolvedValue(30);

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 10 })
      ).rejects.toThrow("25");
    });

    test("permite la salida exacta hasta el mínimo (resultante === minStock)", async () => {
      // stock: 20, minStock: 10, quantity: 10 → resultante: 10 === minStock ✓
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 10 }));
      calculateStock.mockResolvedValue(20);
      const expected = makeMovementResult({ type: "OUT", quantity: 10 });
      prisma.inventoryMovement.create.mockResolvedValue(expected);

      const result = await createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 10 });

      expect(result).toEqual(expected);
      expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(1);
    });

    test("rechaza salida que dejaría el stock en minStock - 1 (borde inferior)", async () => {
      // stock: 20, minStock: 10, quantity: 11 → resultante: 9 < 10 ✗
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 10 }));
      calculateStock.mockResolvedValue(20);

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 11 })
      ).rejects.toThrow(/stock m[íi]nimo/i);
    });

    test("con minStock 0: permite bajar hasta 0 pero rechaza negativo", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 0 }));
      calculateStock.mockResolvedValue(5);
      prisma.inventoryMovement.create.mockResolvedValue(makeMovementResult({ type: "OUT", quantity: 5 }));

      // Exactamente hasta 0 → permitido
      await expect(
        createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 5 })
      ).resolves.toBeDefined();
    });

    test("no crea el movimiento cuando viola el mínimo", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 10 }));
      calculateStock.mockResolvedValue(15);

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 10 })
      ).rejects.toThrow();

      expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    });
  });

  // ── Salidas (OUT) — casos válidos ────────────────────────────────────────────

  describe("movimiento tipo OUT — flujo feliz", () => {
    test("crea el movimiento cuando hay stock suficiente y no viola el mínimo", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 5 }));
      calculateStock.mockResolvedValue(20);
      const expected = makeMovementResult({ type: "OUT", quantity: 10 });
      prisma.inventoryMovement.create.mockResolvedValue(expected);

      const result = await createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 10 });

      expect(result).toEqual(expected);
      expect(prisma.inventoryMovement.create).toHaveBeenCalledWith({
        data: { productId: PRODUCT_ID, type: "OUT", quantity: 10 },
      });
    });
  });

  // ── Orden de validaciones ────────────────────────────────────────────────────

  describe("orden de evaluación de reglas de negocio", () => {
    test("'Stock insuficiente' tiene prioridad sobre 'bajo mínimo' (quantity > stock)", async () => {
      // quantity (100) > stock (10), y además violaría mínimo
      prisma.product.findUnique.mockResolvedValue(makeProduct({ minStock: 5 }));
      calculateStock.mockResolvedValue(10);

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 100 })
      ).rejects.toThrow("Stock insuficiente");
    });
  });

  // ── Errores de infraestructura ────────────────────────────────────────────────

  describe("errores de infraestructura", () => {
    test("propaga el error si prisma.product.findUnique falla", async () => {
      prisma.product.findUnique.mockRejectedValue(new Error("DB timeout"));

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "IN", quantity: 5 })
      ).rejects.toThrow("DB timeout");
    });

    test("propaga el error si calculateStock falla", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct());
      calculateStock.mockRejectedValue(new Error("Redis down"));

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "OUT", quantity: 1 })
      ).rejects.toThrow("Redis down");
    });

    test("propaga el error si prisma.inventoryMovement.create falla", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct());
      calculateStock.mockResolvedValue(50);
      prisma.inventoryMovement.create.mockRejectedValue(new Error("Constraint violation"));

      await expect(
        createMovement({ productId: PRODUCT_ID, type: "IN", quantity: 5 })
      ).rejects.toThrow("Constraint violation");
    });
  });
});