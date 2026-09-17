import { describe, expect, it } from "vitest";

function add(a, b) {
  return a + b;
}

describe("範例測試", () => {
  it("add 相加", () => {
    expect(add(1, 2)).toBe(3);
  });
});