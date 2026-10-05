"use client";

import React from "react";
import { X, Utensils, Check } from "lucide-react";
import { useGameStore } from "@/lib/game/state";
import { FOOD_ITEMS } from "@/lib/game/constants";
import { sound } from "@/lib/audio/SoundEffects";

interface FoodModalProps {
  onEat: (foodId: string) => void;
  isLoading?: boolean;
}

export function FoodModal({ onEat, isLoading }: FoodModalProps) {
  const { activeModal, closeModal, money } = useGameStore();

  if (activeModal !== "food") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-5 shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-bold">Chop Life & Refuel</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Food Items List */}
        <div className="flex flex-col gap-2.5 py-4 max-h-[60vh] overflow-y-auto pr-1">
          {Object.values(FOOD_ITEMS).map((item) => {
            const canAfford = money >= item.cost;
            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-100">{item.name}</h4>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex gap-2">
                    <span className="text-amber-400 font-semibold">₦{item.cost.toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-orange-300">+{item.hungerRestore}% Hunger</span>
                    <span>•</span>
                    <span className="text-pink-300">+{item.funRestore}% Fun</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    onEat(item.id);
                  }}
                  disabled={!canAfford || isLoading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    canAfford
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  }`}
                >
                  {canAfford ? "Chop" : "No Cash"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
