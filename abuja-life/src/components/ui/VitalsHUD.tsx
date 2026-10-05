"use client";

import React from "react";
import { Zap, Utensils, Smile, Award, Navigation, Briefcase, Moon, Home, DollarSign } from "lucide-react";
import { useGameStore } from "@/lib/game/state";
import { DISTRICTS } from "@/lib/game/constants";
import { sound } from "@/lib/audio/SoundEffects";

interface VitalsHUDProps {
  onAction: (actionType: string, payload?: any) => void;
  isActionLoading?: boolean;
}

export function VitalsHUD({ onAction, isActionLoading }: VitalsHUDProps) {
  const { user, vitals, money, clout, currentLocation, openModal } = useGameStore();
  const district = DISTRICTS[currentLocation] || DISTRICTS.secretariat;

  return (
    <>
      {/* Top Status Bar */}
      <header className="fixed top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Player Identity & Location */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-xl backdrop-blur flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-lg font-black text-emerald-400">
              {user?.username?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{user?.username || "Abuja Citizen"}</span>
                <span className="text-[10px] font-normal uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                  {user?.origin || "corper"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>{district.emoji}</span>
                <span className="font-medium text-slate-300">{district.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Cash Balance, Clout & Vitals */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Cash Alert Pill */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl px-3 py-1.5 shadow-xl backdrop-blur flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              ₦
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-amber-300/80 leading-none">Aza Balance</div>
              <div className="text-sm font-black text-amber-300">
                ₦{money.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Clout Pill */}
          <div className="hidden sm:flex bg-slate-900/90 border border-purple-500/30 rounded-xl px-3 py-1.5 shadow-xl backdrop-blur items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-purple-300/80 leading-none">Clout Level</div>
              <div className="text-sm font-black text-purple-300">{clout}</div>
            </div>
          </div>

          {/* Vitals Progress Bars */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 shadow-xl backdrop-blur flex items-center gap-3">
            {/* Energy */}
            <div className="flex items-center gap-1.5" title={`Energy: ${vitals.energy}%`}>
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <div className="w-12 sm:w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${vitals.energy}%` }}
                />
              </div>
            </div>

            {/* Hunger */}
            <div className="flex items-center gap-1.5" title={`Hunger: ${vitals.hunger}%`}>
              <Utensils className="w-3.5 h-3.5 text-orange-400" />
              <div className="w-12 sm:w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-orange-400 transition-all duration-300"
                  style={{ width: `${vitals.hunger}%` }}
                />
              </div>
            </div>

            {/* Fun */}
            <div className="flex items-center gap-1.5" title={`Fun: ${vitals.fun}%`}>
              <Smile className="w-3.5 h-3.5 text-pink-400" />
              <div className="w-12 sm:w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-pink-400 transition-all duration-300"
                  style={{ width: `${vitals.fun}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Main Action Dock */}
      <footer className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 max-w-[95vw]">
        <div className="bg-slate-950/90 border border-slate-800/90 p-1.5 rounded-2xl shadow-2xl backdrop-blur flex items-center gap-1 sm:gap-2">
          {/* Work Shift */}
          <button
            onClick={() => {
              sound.playClick();
              openModal("minigame");
            }}
            disabled={isActionLoading || vitals.energy < 25}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs transition shadow-lg shadow-emerald-950/50"
          >
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Work Shift</span>
          </button>

          {/* Chop Life (Eat) */}
          <button
            onClick={() => {
              sound.playClick();
              openModal("food");
            }}
            disabled={isActionLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <Utensils className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Chop Life</span>
          </button>

          {/* Sleep / Rest */}
          <button
            onClick={() => {
              sound.playClick();
              onAction("sleep");
            }}
            disabled={isActionLoading || vitals.energy >= 100}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Sleep</span>
          </button>

          {/* Travel Abuja */}
          <button
            onClick={() => {
              sound.playClick();
              openModal("map");
            }}
            disabled={isActionLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Travel</span>
          </button>

          {/* Housing Ladder */}
          <button
            onClick={() => {
              sound.playClick();
              openModal("housing");
            }}
            disabled={isActionLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Housing</span>
          </button>
        </div>
      </footer>
    </>
  );
}
