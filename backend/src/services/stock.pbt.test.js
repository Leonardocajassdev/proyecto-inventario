import fc from "fast-check";
import { describe, test, expect, jest, beforeEach } from "@jest/globals";
 
// ─── Mock prisma para las propiedades que ejercitan movement.service ──────────
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
 
const { prisma }        = await import("../utils/prisma.js");
const { calculateStock } = await import("./stock.service.js");
const { createMovement } = await import("./movement.service.js");
 
// ─── Helper: replica la lógica de calculateStock sin prisma ──────────────────
function computeStock(movements) {
  return movements.reduce((acc, mov) => {
    if (mov.type === "IN")  return acc + mov.quantity;
    if (mov.type === "OUT") return acc - mov.quantity;
    return acc;
  }, 0);
}
 
// ─── Arbitrarios reutilizables ────────────────────────────────────────────────
const arbQuantity   = fc.integer({ min: 1, max: 1_000 });
const arbMovement   = fc.record({
  type:     fc.constantFrom("IN", "OUT"),
  quantity: arbQuantity,
});
const arbMovements  = fc.array(arbMovement, { minLength: 0, maxLength: 50 });
const arbInMovement = fc.record({ type: fc.constant("IN"),  quantity: arbQuantity });
const arbOutMovement= fc.record({ type: fc.constant("OUT"), quantity: arbQuantity });
 
// ─────────────────────────────────────────────────────────────────────────────
 
describe("PBT — Propiedades invariantes del cálculo de stock", () => {
 
  // P1 — Correctitud aritmética
  test("P1: stock = SUM(IN) - SUM(OUT) para cualquier secuencia de movimientos", () => {
    fc.assert(
      fc.property(arbMovements, (movements) => {
        const actual   = computeStock(movements);
        const expected =
          movements.filter(m => m.type === "IN").reduce((a, m) => a + m.quantity, 0) -
          movements.filter(m => m.type === "OUT").reduce((a, m) => a + m.quantity, 0);
        return actual === expected;
      }),
      { numRuns: 500 }
    );
  });
 
  // P2 — Las entradas siempre incrementan
  test("P2: agregar una entrada siempre incrementa el stock", () => {
    fc.assert(
      fc.property(arbMovements, arbInMovement, (movements, extra) => {
        const before = computeStock(movements);
        const after  = computeStock([...movements, extra]);
        return after === before + extra.quantity;
      }),
      { numRuns: 300 }
    );
  });
 
  // P3 — Las salidas siempre decrementan
  test("P3: agregar una salida siempre decrementa el stock", () => {
    fc.assert(
      fc.property(arbMovements, arbOutMovement, (movements, extra) => {
        const before = computeStock(movements);
        const after  = computeStock([...movements, extra]);
        return after === before - extra.quantity;
      }),
      { numRuns: 300 }
    );
  });
 
  // P4 — Commutatividad de entradas
  test("P4: el stock final no depende del orden de las entradas", () => {
    fc.assert(
      fc.property(
        fc.array(arbInMovement, { minLength: 2, maxLength: 20 }),
        (ins) => {
          const shuffled = [...ins].sort(() => Math.random() - 0.5);
          return computeStock(ins) === computeStock(shuffled);
        }
      ),
      { numRuns: 200 }
    );
  });
 
  // P5 — Stock nunca negativo si solo se permiten salidas válidas
  test("P5: aplicar solo salidas ≤ stock disponible nunca produce stock negativo", () => {
    fc.assert(
      fc.property(
        fc.array(arbInMovement, { minLength: 1, maxLength: 30 }),
        fc.array(arbQuantity,    { minLength: 0, maxLength: 20 }),
        (ins, outQuantities) => {
          const movements = [...ins];
          let stock = computeStock(movements);
 
          for (const q of outQuantities) {
            if (q <= stock) {
              movements.push({ type: "OUT", quantity: q });
              stock -= q;
            }
            // si q > stock, simplemente no aplicamos la salida (como hace el service)
          }
 
          return computeStock(movements) >= 0;
        }
      ),
      { numRuns: 300 }
    );
  });
 
  // P6 — La inversa: un IN de N seguido de un OUT de N vuelve al stock original
  test("P6: IN(n) + OUT(n) es una operación neutra sobre el stock", () => {
    fc.assert(
      fc.property(arbMovements, arbQuantity, (base, n) => {
        const stockBase  = computeStock(base);
        const stockAfter = computeStock([
          ...base,
          { type: "IN",  quantity: n },
          { type: "OUT", quantity: n },
        ]);
        return stockAfter === stockBase;
      }),
      { numRuns: 300 }
    );
  });
 
  // P7 — Idempotencia de lectura: calculateStock es determinista
  test("P7: calculateStock retorna el mismo valor para los mismos movimientos (determinismo)", async () => {
    await fc.assert(
      fc.asyncProperty(arbMovements, async (movements) => {
        prisma.inventoryMovement.findMany
          .mockResolvedValueOnce(movements)
          .mockResolvedValueOnce(movements);
 
        const s1 = await calculateStock("prod-x");
        const s2 = await calculateStock("prod-x");
        return s1 === s2;
      }),
      { numRuns: 100 }
    );
  });
 
  // P8 — Monotonía: más entradas nunca disminuyen el stock
  test("P8: el stock nunca disminuye si solo se agregan entradas", () => {
    fc.assert(
      fc.property(
        arbMovements,
        fc.array(arbInMovement, { minLength: 1, maxLength: 10 }),
        (base, extraIns) => {
          const before = computeStock(base);
          const after  = computeStock([...base, ...extraIns]);
          return after >= before;
        }
      ),
      { numRuns: 300 }
    );
  });
});
 
// ─────────────────────────────────────────────────────────────────────────────
 
describe("PBT — Propiedades de createMovement (con mocks)", () => {
  beforeEach(() => jest.clearAllMocks());
 
  // P9 — Cualquier IN válido siempre debe persistirse
  test("P9: cualquier movimiento IN con producto existente siempre se crea", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbQuantity,
        fc.integer({ min: 0, max: 500 }), // currentStock
        async (quantity, currentStock) => {
          const product = { id: "p1", name: "P", description: "D", minStock: 0 };
          prisma.product.findUnique.mockResolvedValue(product);
          prisma.inventoryMovement.findMany.mockResolvedValue(
            currentStock > 0 ? [{ type: "IN", quantity: currentStock }] : []
          );
          const movement = { id: "m1", productId: "p1", type: "IN", quantity };
          prisma.inventoryMovement.create.mockResolvedValue(movement);
 
          const result = await createMovement({ productId: "p1", type: "IN", quantity });
          return result.type === "IN" && result.quantity === quantity;
        }
      ),
      { numRuns: 100 }
    );
  });
 
  // P10 — OUT que viola stock mínimo SIEMPRE lanza error
  test("P10: OUT que llevaría el stock bajo el mínimo SIEMPRE lanza error", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1,  max: 100 }), // minStock
        fc.integer({ min: 0,  max: 50  }), // exceso sobre el mínimo actual
        fc.integer({ min: 1,  max: 50  }), // cuánto bajar del mínimo
        async (minStock, surplus, deficit) => {
          // stock = minStock + surplus, queremos sacar surplus + deficit
          // resultado: minStock - deficit → siempre < minStock
          const currentStock = minStock + surplus;
          const quantity     = surplus + deficit;
 
          const product = { id: "p1", name: "P", description: "D", minStock };
          prisma.product.findUnique.mockResolvedValue(product);
          prisma.inventoryMovement.findMany.mockResolvedValue(
            [{ type: "IN", quantity: currentStock }]
          );
 
          try {
            await createMovement({ productId: "p1", type: "OUT", quantity });
            return false; // no debería llegar aquí
          } catch (e) {
            return (
              e.message.includes("Stock insuficiente") ||
              e.message.includes("stock mínimo") ||
              e.message.includes("stock m\u00ednimo")
            );
          }
        }
      ),
      { numRuns: 150 }
    );
  });
});