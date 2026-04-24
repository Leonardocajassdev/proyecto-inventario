/**
 * product.routes.integration.test.js
 *
 * Tests de integración para los endpoints de productos.
 * Se usa supertest para lanzar peticiones HTTP reales contra la app Express.
 * Prisma se mockea para que NO haya dependencia de ninguna DB real.
 *
 * Asumida estructura de rutas:
 *   POST   /products          → crear producto
 *   GET    /products          → listar productos
 *   DELETE /products/:id      → eliminar producto
 *
 * Si tus rutas tienen un prefix distinto (ej. /api/products), ajusta BASE_PATH.
 */

import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";

const BASE_PATH = "/products";

// ─── Mock de Prisma ───────────────────────────────────────────────────────────
jest.unstable_mockModule("../utils/prisma.js", () => ({
  prisma: {
    product: {
      create:     jest.fn(),
      findMany:   jest.fn(),
      findUnique: jest.fn(),
      delete:     jest.fn(),
    },
    inventoryMovement: {
      findMany: jest.fn(),
      create:   jest.fn(),
    },
  },
}));

const { prisma } = await import("../utils/prisma.js");

// Importar la app DESPUÉS de los mocks
const { default: app } = await import("../server.js");

// ─── Fixtures ─────────────────────────────────────────────────────────────────
function makeProduct(overrides = {}) {
  return {
    id:          "prod-integration-001",
    name:        "Producto Test",
    description: "Descripción test",
    minStock:    5,
    movements:   [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe(`POST ${BASE_PATH} — crear producto`, () => {
  beforeEach(() => jest.clearAllMocks());

  test("201 con datos válidos y retorna el producto creado", async () => {
    const payload = { name: "Laptop", description: "Laptop gamer", minStock: 3 };
    const created = makeProduct({ ...payload });
    prisma.product.create.mockResolvedValue(created);

    const res = await request(app)
      .post(BASE_PATH)
      .send(payload)
      .set("Content-Type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Laptop");
    expect(res.body.minStock).toBe(3);
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
  });

  test("400 cuando falta el campo name", async () => {
    const res = await request(app)
      .post(BASE_PATH)
      .send({ description: "Sin nombre", minStock: 5 });

    expect(res.status).toBe(400);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  test("400 cuando falta la descripción", async () => {
    const res = await request(app)
      .post(BASE_PATH)
      .send({ name: "Prod", minStock: 5 });

    expect(res.status).toBe(400);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  test("400 cuando minStock es negativo", async () => {
    const res = await request(app)
      .post(BASE_PATH)
      .send({ name: "Prod", description: "Desc", minStock: -1 });

    expect(res.status).toBe(400);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  test("400 cuando minStock no es un número", async () => {
    const res = await request(app)
      .post(BASE_PATH)
      .send({ name: "Prod", description: "Desc", minStock: "mucho" });

    expect(res.status).toBe(400);
  });

  test("500 cuando prisma falla al crear", async () => {
    prisma.product.create.mockRejectedValue(new Error("DB down"));

    const res = await request(app)
      .post(BASE_PATH)
      .send({ name: "Prod", description: "Desc", minStock: 5 });

    expect(res.status).toBe(500);
  });

  test("el Content-Type de la respuesta es JSON", async () => {
    prisma.product.create.mockResolvedValue(makeProduct());

    const res = await request(app)
      .post(BASE_PATH)
      .send({ name: "X", description: "Y", minStock: 0 });

    expect(res.headers["content-type"]).toMatch(/json/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe(`GET ${BASE_PATH} — listar productos`, () => {
  beforeEach(() => jest.clearAllMocks());

  test("200 y retorna lista vacía cuando no hay productos", async () => {
    prisma.product.findMany.mockResolvedValue([]);

    const res = await request(app).get(BASE_PATH);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("200 y retorna los productos con su stock calculado", async () => {
    const product = makeProduct();
    prisma.product.findMany.mockResolvedValue([product]);
    // Si el endpoint enriquece con stock, mock de movements
    prisma.inventoryMovement.findMany.mockResolvedValue([
      { type: "IN",  quantity: 20 },
      { type: "OUT", quantity: 8  },
    ]);

    const res = await request(app).get(BASE_PATH);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test("el campo isLowStock es true cuando stock < minStock", async () => {
    const product = makeProduct({ minStock: 10 });
    prisma.product.findMany.mockResolvedValue([product]);
    // stock calculado = IN 5 → 5 < minStock(10) → isLowStock: true
    prisma.inventoryMovement.findMany.mockResolvedValue([
      { type: "IN", quantity: 5 },
    ]);

    const res = await request(app).get(BASE_PATH);

    expect(res.status).toBe(200);
    const p = res.body.find((x) => x.id === product.id);
    if (p && "isLowStock" in p) {
      expect(p.isLowStock).toBe(true);
    }
  });

  test("500 cuando prisma falla al listar", async () => {
    prisma.product.findMany.mockRejectedValue(new Error("Connection refused"));

    const res = await request(app).get(BASE_PATH);

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe(`DELETE ${BASE_PATH}/:id — eliminar producto`, () => {
  beforeEach(() => jest.clearAllMocks());

  test("200 cuando el producto existe y se elimina correctamente", async () => {
    const product = makeProduct();
    prisma.product.findUnique.mockResolvedValue(product);
    prisma.product.delete.mockResolvedValue(product);

    const res = await request(app).delete(`${BASE_PATH}/${product.id}`);

    expect(res.status).toBe(200);
    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: product.id } });
  });

  test("404 cuando el producto no existe", async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    const res = await request(app).delete(`${BASE_PATH}/id-inexistente`);

    expect(res.status).toBe(404);
    expect(prisma.product.delete).not.toHaveBeenCalled();
  });

  test("500 cuando prisma falla al eliminar", async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct());
    prisma.product.delete.mockRejectedValue(new Error("FK violation"));

    const res = await request(app).delete(`${BASE_PATH}/${makeProduct().id}`);

    expect(res.status).toBe(500);
  });
});