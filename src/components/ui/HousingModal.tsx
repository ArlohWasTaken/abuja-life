"use client";

import React from "react";
import { X, Home, Check, Crown } from "lucide-react";
import { useGameStore } from "@/lib/game/state";
import { HOUSING_OPTIONS } from "@/lib/game/constants";
import { sound } from "@/lib/audio/SoundEffects";

interface HousingModalProps {
  onRentApartment: (apartmentId: string) => void;
  isLoading?: boolean;
}

export function HousingModal({ onRentApartment, isLoading }: HousingModalProps) {
  const { activeModal, closeModal, apartmentId, money } = useGameStore();

  if (activeModal !== "housing") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">Abuja Housing Ladder</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Housing Options */}
        <div className="flex flex-col gap-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
          {Object.values(HOUSING_OPTIONS).map((opt) => {
            const isCurrent = opt.id === apartmentId;
            const canAfford = money >= opt.weeklyRent;

            return (
              <div
                key={opt.id}
                className={`p-3.5 rounded-xl border transition ${
                  isCurrent
                    ? "bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40"
                    : "bg-slate-800/70 border-slate-700/80 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-100">{opt.name}</h4>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-700">
                          Current Crib
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-2">
                      <span className="text-amber-300 font-semibold">₦{opt.weeklyRent.toLocaleString()} / week</span>
                      <span>•</span>
                      <span className="text-yellow-300">+{opt.energyBonusPerHour} Energy/hr</span>
                      {opt.cloutBonus > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-purple-300">+{opt.cloutBonus} Clout</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!isCurrent) {
                        sound.playClick();
                        onRentApartment(opt.id);
                      }
                    }}
                    disabled={isCurrent || !canAfford || isLoading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isCurrent
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : canAfford
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    }`}
                  >
                    {isCurrent ? "Occupied" : canAfford ? "Rent Crib" : "Insufficient"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
