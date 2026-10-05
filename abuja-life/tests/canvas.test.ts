import { describe, it, expect } from "vitest";
import { getRoomConfig, DISTRICTS } from "../src/lib/game/constants";

describe("Room Scene Configuration", () => {
  it("should provide valid camera angles and bounds for all districts", () => {
    const districts = ["secretariat", "wuse2", "jabi_lake", "kado", "maitama", "gwarinpa"];
    
    for (const id of districts) {
      const config = getRoomConfig(id);
      expect(config.id).toBe(id);
      expect(config.cameraPosition).toHaveLength(3);
      expect(config.cameraPosition[0]).toBeGreaterThan(0);
      expect(config.bounds.width).toBeGreaterThan(0);
      expect(config.bounds.depth).toBeGreaterThan(0);
      expect(config.name).toBeTruthy();
    }
  });

  it("should gracefully fallback to secretariat for unknown district", () => {
    const unknown = getRoomConfig("asokoro_unknown");
    expect(unknown.id).toBe("secretariat");
  });
});
