/**
 * movement.routes.integration.test.js
 *
 * Tests de integración para los endpoints de movimientos.
 * Verifica el contrato HTTP completo: status codes, cuerpo de respuesta,
 * mensajes de error, validaciones de entrada.
 *
 * Asumida estructura de rutas:
 *   POST /movements  → registrar movimiento (IN o OUT)
 *   GET  /movements  → listar movimientos
 */

import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";

const BASE_PATH = "/movements";

// ─── Mocks ───────────────────────────────────────────────────────────────────
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

const { prisma } = await import("../utils/prisma.js");
const { default: app } = await import("../server.js");

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PRODUCT_ID = "prod-route-test-001";

function makeProduct(minStock = 5) {
  return { id: PRODUCT_ID, name: "Producto Test", description: "Desc", minStock };
}

function makeMovement(overrides = {}) {
  return {
    id:        "mov-001",
    productId: PRODUCT_ID,
    type:      "IN",
    quantity:  10,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe(`POST ${BASE_PATH} — registrar movimiento`, () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Entradas (IN) ────────────────────────────────────────────────────────────

  describe("tipo IN", () => {
    test("201 y retorna el movimiento creado", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct());
      prisma.inventoryMovement.findMany.mockResolvedValue([]);
      prisma.inventoryMovement.create.mockResolvedValue(makeMovement({ type: "IN", quantity: 20 }));

      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: PRODUCT_ID, type: "IN", quantity: 20 });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe("IN");
      expect(res.body.quantity).toBe(20);
    });

    test("201 cuando el stock actual es 0 (las entradas siempre se permiten)", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct(100));
      prisma.inventoryMovement.findMany.mockResolvedValue([]);
      prisma.inventoryMovement.create.mockResolvedValue(makeMovement({ type: "IN", quantity: 5 }));

      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: PRODUCT_ID, type: "IN", quantity: 5 });

      expect(res.status).toBe(201);
    });
  });

  // ── Salidas (OUT) — casos válidos ────────────────────────────────────────────

  describe("tipo OUT — flujo feliz", () => {
    test("201 cuando hay stock suficiente y no viola el mínimo", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct(5));
      prisma.inventoryMovement.findMany.mockResolvedValue([
        { type: "IN", quantity: 50 },
      ]);
      prisma.inventoryMovement.create.mockResolvedValue(
        makeMovement({ type: "OUT", quantity: 10 })
      );

      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: PRODUCT_ID, type: "OUT", quantity: 10 });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe("OUT");
    });
  });

  // ── Salidas (OUT) — errores de negocio ───────────────────────────────────────

  describe("tipo OUT — errores de negocio", () => {
    test("400 con 'Stock insuficiente' cuando quantity > stock", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct(0));
      prisma.inventoryMovement.findMany.mockResolvedValue([
        { type: "IN", quantity: 5 },
      ]);

      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: PRODUCT_ID, type: "OUT", quantity: 10 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/stock insuficiente/i);
    });

    test("400 cuando el stock resultante quedaría bajo el mínimo", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct(10)); // minStock=10
      prisma.inventoryMovement.findMany.mockResolvedValue([
        { type: "IN", quantity: 20 },
      ]);
      // stock=20, quantity=15 → resultante=5 < minStock(10) → rechazado

      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: PRODUCT_ID, type: "OUT", quantity: 15 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/stock m[íi]nimo/i);
    });

    test("el mensaje de error incluye el valor del stock mínimo", async () => {
      prisma.product.findUnique.mockResolvedValue(makeProduct(25));
      prisma.inventoryMovement.findMany.mockResolvedValue([
        { type: "IN", quantity: 30 },
      ]);

      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: PRODUCT_ID, type: "OUT", quantity: 10 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("25");
    });
  });

  // ── Producto no encontrado ───────────────────────────────────────────────────

  describe("producto no encontrado", () => {
    test("404 cuando el productId no existe", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: "id-fantasma", type: "IN", quantity: 5 });

      // Aceptamos 404 o 400 según cómo mapee tu route handler el error
      expect([400, 404]).toContain(res.status);
      expect(res.body.error).toMatch(/no encontrado/i);
    });
  });

  // ── Validaciones de entrada ──────────────────────────────────────────────────

  describe("validaciones HTTP de entrada", () => {
    test("400 cuando falta productId", async () => {
      const res = await request(app)
        .post(BASE_PATH)
        .send({ type: "IN", quantity: 5 });

      expect(res.status).toBe(400);
    });

    test("400 cuando falta type", async () => {
      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: PRODUCT_ID, quantity: 5 });

      expect(res.status).toBe(400);
    });

    test("400 cuando falta quantity", async () => {
      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: PRODUCT_ID, type: "IN" });

      expect(res.status).toBe(400);
    });

    test("400 cuando quantity es 0", async () => {
      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: PRODUCT_ID, type: "IN", quantity: 0 });

      expect(res.status).toBe(400);
    });

    test("400 cuando quantity es negativa", async () => {
      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: PRODUCT_ID, type: "IN", quantity: -5 });

      expect(res.status).toBe(400);
    });

    test("400 cuando type tiene un valor no permitido", async () => {
      const res = await request(app)
        .post(BASE_PATH)
        .send({ productId: PRODUCT_ID, type: "TRANSFER", quantity: 5 });

      expect(res.status).toBe(400);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe(`GET ${BASE_PATH} — listar movimientos`, () => {
  beforeEach(() => jest.clearAllMocks());

  test("200 y lista vacía cuando no hay movimientos", async () => {
    prisma.inventoryMovement.findMany.mockResolvedValue([]);

    const res = await request(app).get(BASE_PATH);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("200 y retorna los movimientos registrados", async () => {
    const movements = [
      makeMovement({ id: "m1", type: "IN",  quantity: 10 }),
      makeMovement({ id: "m2", type: "OUT", quantity: 3  }),
    ];
    prisma.inventoryMovement.findMany.mockResolvedValue(movements);

    const res = await request(app).get(BASE_PATH);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});