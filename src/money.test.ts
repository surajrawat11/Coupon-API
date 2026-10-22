import { describe, expect, it } from "vitest";
import { roundToPaisa } from "./money.js";

describe("roundToPaisa", () => {
  it("keeps amounts with two decimal places unchanged", () => {
    expect(roundToPaisa(99.99)).toBe(99.99);
  });

  it("rounds to the nearest paisa", () => {
    expect(roundToPaisa(10.126)).toBe(10.13);
  });

  it("handles floating-point precision", () => {
    expect(roundToPaisa(0.1 + 0.2)).toBe(0.3);
  });

  it("handles whole-number amounts", () => {
    expect(roundToPaisa(100)).toBe(100);
  });
});
