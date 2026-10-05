"use client";

import React from "react";
import { X, Navigation, MapPin } from "lucide-react";
import { useGameStore } from "@/lib/game/state";
import { DISTRICTS } from "@/lib/game/constants";
import { sound } from "@/lib/audio/SoundEffects";

interface DistrictMapModalProps {
  onTravel: (districtId: string) => void;
  isLoading?: boolean;
}

export function DistrictMapModal({ onTravel, isLoading }: DistrictMapModalProps) {
  const { activeModal, closeModal, currentLocation } = useGameStore();

  if (activeModal !== "map") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-5 shadow-2xl relative text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Federal Capital Territory Map</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* District Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 overflow-y-auto pr-1">
          {Object.values(DISTRICTS).map((dist) => {
            const isCurrent = dist.id === currentLocation;
            return (
              <div
                key={dist.id}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? "bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/50"
                    : "bg-slate-800/60 border-slate-700/70 hover:border-slate-500"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">{dist.emoji}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">
                        Current
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-100">{dist.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{dist.description}</p>
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => {
                      if (!isCurrent) {
                        sound.playClick();
                        onTravel(dist.id);
                      }
                    }}
                    disabled={isCurrent || isLoading}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      isCurrent
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isCurrent ? "You are here" : "Enter District"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
          Abuja roads are wide and smooth. Watch out for VIO checkpoints along Shehu Shagari Way! 🚨
        </div>
      </div>
    </div>
  );
}
