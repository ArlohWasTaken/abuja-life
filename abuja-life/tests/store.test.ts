import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../src/lib/game/state";

describe("Client Game Store", () => {
  beforeEach(() => {
    useGameStore.setState({
      user: null,
      vitals: { energy: 100, hunger: 100, fun: 100 },
      money: 33000,
      clout: 10,
      currentLocation: "secretariat",
      apartmentId: "kubwa_bq",
      activeModal: null,
    });
  });

  it("should initialize with default vitals and allow updates", () => {
    const store = useGameStore.getState();
    expect(store.vitals.energy).toBe(100);
    expect(store.vitals.hunger).toBe(100);
    expect(store.vitals.fun).toBe(100);

    store.updateVitals({ energy: 80, hunger: 75 });
    expect(useGameStore.getState().vitals.energy).toBe(80);
    expect(useGameStore.getState().vitals.hunger).toBe(75);
    expect(useGameStore.getState().vitals.fun).toBe(100);
  });

  it("should update player money and clout", () => {
    const store = useGameStore.getState();
    store.setMoney(150000);
    store.setClout(50);

    expect(useGameStore.getState().money).toBe(150000);
    expect(useGameStore.getState().clout).toBe(50);
  });

  it("should handle district changes", () => {
    const store = useGameStore.getState();
    store.setCurrentLocation("wuse2");
    expect(useGameStore.getState().currentLocation).toBe("wuse2");
  });

  it("should toggle active modals", () => {
    const store = useGameStore.getState();
    expect(store.activeModal).toBeNull();

    store.openModal("map");
    expect(useGameStore.getState().activeModal).toBe("map");

    store.closeModal();
    expect(useGameStore.getState().activeModal).toBeNull();
  });
});
