
import { describe, test, expect, jest, beforeEach } from "@jest/globals";

// ─── Mock de prisma ANTES de importar el service ──────────────────────────────
jest.unstable_mockModule("../utils/prisma.js", () => ({
  prisma: {
    inventoryMovement: {
      findMany: jest.fn(),
    },
  },
}));

const { prisma }         = await import("../utils/prisma.js");
const { calculateStock } = await import("./stock.service.js");

// ─── Helper ───────────────────────────────────────────────────────────────────
const PRODUCT_ID = "prod-abc-123";

function mockMovements(movements) {
  prisma.inventoryMovement.findMany.mockResolvedValue(movements);
}

// ─────────────────────────────────────────────────────────────────────────────

describe("calculateStock(productId)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Casos base ──────────────────────────────────────────────────────────────

  test("retorna 0 cuando el producto no tiene movimientos", async () => {
    mockMovements([]);
    const stock = await calculateStock(PRODUCT_ID);
    expect(stock).toBe(0);
  });

  test("acumula correctamente solo entradas", async () => {
    mockMovements([
      { type: "IN", quantity: 30 },
      { type: "IN", quantity: 20 },
    ]);
    expect(await calculateStock(PRODUCT_ID)).toBe(50);
  });

  test("solo salidas resultan en stock negativo (dominio real: imposible, pero el service no lo bloquea)", async () => {
    mockMovements([
      { type: "OUT", quantity: 15 },
    ]);
    // calculateStock no tiene opinión sobre negativos — eso es responsabilidad
    // de movement.service. Verificamos que la aritmética sea correcta.
    expect(await calculateStock(PRODUCT_ID)).toBe(-15);
  });

  test("combina entradas y salidas en el orden correcto", async () => {
    mockMovements([
      { type: "IN",  quantity: 100 },
      { type: "OUT", quantity: 40  },
      { type: "IN",  quantity: 10  },
      { type: "OUT", quantity: 25  },
    ]);
    // 100 - 40 + 10 - 25 = 45
    expect(await calculateStock(PRODUCT_ID)).toBe(45);
  });

  test("movimientos con cantidad 1 (borde inferior)", async () => {
    mockMovements([
      { type: "IN",  quantity: 1 },
      { type: "OUT", quantity: 1 },
    ]);
    expect(await calculateStock(PRODUCT_ID)).toBe(0);
  });

  test("muchos movimientos pequeños acumulan correctamente", async () => {
    const ins  = Array.from({ length: 50 }, () => ({ type: "IN",  quantity: 2 }));
    const outs = Array.from({ length: 30 }, () => ({ type: "OUT", quantity: 1 }));
    mockMovements([...ins, ...outs]);
    // 50×2 - 30×1 = 100 - 30 = 70
    expect(await calculateStock(PRODUCT_ID)).toBe(70);
  });

  test("ignora movimientos con tipo desconocido (no los cuenta)", async () => {
    mockMovements([
      { type: "IN",      quantity: 50 },
      { type: "UNKNOWN", quantity: 99 },
      { type: "OUT",     quantity: 10 },
    ]);
    // UNKNOWN no entra en ningún branch del reduce → no afecta
    expect(await calculateStock(PRODUCT_ID)).toBe(40);
  });

  // ── Interacción con prisma ───────────────────────────────────────────────────

  test("llama a prisma.inventoryMovement.findMany con el productId correcto", async () => {
    mockMovements([]);
    await calculateStock(PRODUCT_ID);
    expect(prisma.inventoryMovement.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.inventoryMovement.findMany).toHaveBeenCalledWith({
      where: { productId: PRODUCT_ID },
    });
  });

  test("cada llamada usa el productId propio, sin contaminación entre productos", async () => {
    prisma.inventoryMovement.findMany
      .mockResolvedValueOnce([{ type: "IN", quantity: 10 }])
      .mockResolvedValueOnce([{ type: "IN", quantity: 99 }]);

    const s1 = await calculateStock("prod-A");
    const s2 = await calculateStock("prod-B");

    expect(s1).toBe(10);
    expect(s2).toBe(99);
    expect(prisma.inventoryMovement.findMany).toHaveBeenNthCalledWith(1, { where: { productId: "prod-A" } });
    expect(prisma.inventoryMovement.findMany).toHaveBeenNthCalledWith(2, { where: { productId: "prod-B" } });
  });

  test("propaga el error si prisma falla", async () => {
    prisma.inventoryMovement.findMany.mockRejectedValue(new Error("DB connection lost"));
    await expect(calculateStock(PRODUCT_ID)).rejects.toThrow("DB connection lost");
  });
});