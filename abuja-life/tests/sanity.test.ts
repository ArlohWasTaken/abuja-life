import { describe, it, expect } from "vitest";

describe("Sanity Environment Check", () => {
  it("should confirm the test environment is functional", () => {
    expect(1 + 1).toBe(2);
  });
});
