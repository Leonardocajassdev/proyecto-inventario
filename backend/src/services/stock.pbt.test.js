import fc from "fast-check";
import { describe, test, expect } from "@jest/globals";

describe("PBT - Stock invariants", () => {
  test("el stock calculado debe coincidir con suma IN - suma OUT", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom("IN", "OUT"),
            quantity: fc.integer({ min: 1, max: 100 }),
          })
        ),
        (movements) => {
          const stock = movements.reduce((acc, mov) => {
            if (mov.type === "IN") return acc + mov.quantity;
            if (mov.type === "OUT") return acc - mov.quantity;
            return acc;
          }, 0);

          const manual =
            movements
              .filter((m) => m.type === "IN")
              .reduce((a, m) => a + m.quantity, 0) -
            movements
              .filter((m) => m.type === "OUT")
              .reduce((a, m) => a + m.quantity, 0);

          return stock === manual;
        }
      )
    );
  });
});