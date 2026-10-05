"use client";

import React from "react";
import { X, ShieldAlert, AlertCircle, Check, ArrowRight } from "lucide-react";
import { useGameStore } from "@/lib/game/state";
import { sound } from "@/lib/audio/SoundEffects";

interface EncounterModalProps {
  onResolveOption: (optionId: string, cost?: number) => void;
  isLoading?: boolean;
}

export function EncounterModal({ onResolveOption, isLoading }: EncounterModalProps) {
  const { activeModal, closeModal, currentEncounter, clout } = useGameStore();

  if (activeModal !== "encounter" || !currentEncounter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-amber-300">Street Encounter</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Encounter Context */}
        <div className="py-4">
          <h3 className="text-base font-extrabold text-white">{currentEncounter.title}</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            {currentEncounter.description}
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2.5 pb-2">
          {currentEncounter.options.map((option) => {
            const hasEnoughClout = !option.cloutRequired || clout >= option.cloutRequired;
            const isMandatory = currentEncounter.mandatoryOption === option.id;

            return (
              <button
                key={option.id}
                disabled={!hasEnoughClout || isLoading}
                onClick={() => {
                  sound.playClick();
                  onResolveOption(option.id, option.cost);
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between group ${
                  hasEnoughClout
                    ? "bg-slate-800/80 border-slate-700 hover:border-emerald-500/80 hover:bg-slate-800"
                    : "bg-slate-950/40 border-slate-800/60 opacity-40 cursor-not-allowed"
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <span>{option.label}</span>
                    {option.cloutRequired && (
                      <span className="text-[10px] text-purple-400 font-normal">
                        (Needs {option.cloutRequired} Clout)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{option.description}</div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition -translate-x-1 group-hover:translate-x-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
