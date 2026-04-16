import { describe, test, expect } from "@jest/globals";

describe("Stock calculation", () => {
  test("suma entradas y resta salidas correctamente", () => {
    const movements = [
      { type: "IN", quantity: 10 },
      { type: "OUT", quantity: 4 },
      { type: "IN", quantity: 2 },
    ];

    const stock = movements.reduce((acc, mov) => {
      if (mov.type === "IN") return acc + mov.quantity;
      if (mov.type === "OUT") return acc - mov.quantity;
      return acc;
    }, 0);

    expect(stock).toBe(8);
  });

  test("retorna 0 si no hay movimientos", () => {
    const movements = [];

    const stock = movements.reduce((acc, mov) => {
      if (mov.type === "IN") return acc + mov.quantity;
      if (mov.type === "OUT") return acc - mov.quantity;
      return acc;
    }, 0);

    expect(stock).toBe(0);
  });
});