import { create } from "zustand";
import { User } from "../db/schema";
import { EncounterEvent } from "./encounters";

export type ModalType = "map" | "minigame" | "encounter" | "food" | "housing" | "career" | "origin_select" | null;

export interface GameState {
  user: User | null;
  vitals: {
    energy: number;
    hunger: number;
    fun: number;
  };
  money: number;
  clout: number;
  currentLocation: string;
  apartmentId: string;
  activeModal: ModalType;
  currentEncounter: EncounterEvent | null;

  setPlayer: (user: User) => void;
  updateVitals: (updates: Partial<{ energy: number; hunger: number; fun: number }>) => void;
  setMoney: (amount: number) => void;
  setClout: (clout: number) => void;
  setCurrentLocation: (loc: string) => void;
  setApartmentId: (apartmentId: string) => void;
  openModal: (modal: ModalType, encounterData?: EncounterEvent) => void;
  closeModal: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  user: null,
  vitals: {
    energy: 100,
    hunger: 100,
    fun: 100,
  },
  money: 33000,
  clout: 10,
  currentLocation: "secretariat",
  apartmentId: "kubwa_bq",
  activeModal: null,
  currentEncounter: null,

  setPlayer: (user) =>
    set({
      user,
      money: user.money,
      clout: user.clout,
      currentLocation: user.currentLocation,
      apartmentId: user.apartmentId,
      vitals: {
        energy: user.energy,
        hunger: user.hunger,
        fun: user.fun,
      },
    }),

  updateVitals: (updates) =>
    set((state) => ({
      vitals: {
        ...state.vitals,
        ...updates,
      },
    })),

  setMoney: (money) => set({ money }),
  setClout: (clout) => set({ clout }),
  setCurrentLocation: (currentLocation) => set({ currentLocation }),
  setApartmentId: (apartmentId) => set({ apartmentId }),
  openModal: (modal, encounterData) =>
    set({
      activeModal: modal,
      currentEncounter: encounterData || null,
    }),
  closeModal: () => set({ activeModal: null, currentEncounter: null }),
}));
