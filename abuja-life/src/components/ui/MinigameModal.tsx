"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Award, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { useGameStore } from "@/lib/game/state";
import { evaluateStampMinigame, StampEvaluation } from "@/lib/game/minigames";
import { sound } from "@/lib/audio/SoundEffects";

interface MinigameModalProps {
  onCompleteShift: (score: number, evaluation: StampEvaluation) => void;
  isLoading?: boolean;
}

export function MinigameModal({ onCompleteShift, isLoading }: MinigameModalProps) {
  const { activeModal, closeModal, user } = useGameStore();
  const [sliderPos, setSliderPos] = useState(50);
  const [movingRight, setMovingRight] = useState(true);
  const [gameState, setGameState] = useState<"ready" | "playing" | "result">("playing");
  const [result, setResult] = useState<StampEvaluation | null>(null);
  const animRef = useRef<number | null>(null);

  // Oscillating stamp target bar
  useEffect(() => {
    if (activeModal !== "minigame" || gameState !== "playing") return;

    const interval = setInterval(() => {
      setSliderPos((prev) => {
        if (prev >= 95) {
          setMovingRight(false);
          return 94;
        }
        if (prev <= 5) {
          setMovingRight(true);
          return 6;
        }
        return movingRight ? prev + 3 : prev - 3;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [activeModal, gameState, movingRight]);

  if (activeModal !== "minigame") return null;

  const handleStamp = () => {
    sound.playStampThud();

    // Calculate score based on distance from center (50%)
    const distFromCenter = Math.abs(sliderPos - 50);
    // Center is 100, edges drop to ~10
    const rawScore = Math.max(10, Math.round(100 - distFromCenter * 2));

    const evalResult = evaluateStampMinigame(rawScore, user?.careerRank || 1);
    setResult(evalResult);
    setGameState("result");

    if (evalResult.grade === "Distinction" || evalResult.grade === "Satisfactory") {
      sound.playCashAlert();
    }
  };

  const handleClaim = () => {
    if (result) {
      onCompleteShift(100 - Math.abs(sliderPos - 50) * 2, result);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Federal Secretariat Shift Duty</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {gameState === "playing" ? (
          <div className="py-6 flex flex-col items-center gap-5">
            <div className="text-center">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                Civil Service Memo Stamping
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Hit the green center zone to stamp the Permanent Secretary's voucher with zero queries!
              </p>
            </div>

            {/* Target Alignment Track */}
            <div className="w-full relative h-12 bg-slate-950 rounded-xl border border-slate-700 overflow-hidden flex items-center">
              {/* Bullseye Center Zone */}
              <div className="absolute left-[40%] right-[40%] h-full bg-emerald-500/25 border-x-2 border-emerald-400/80 flex items-center justify-center">
                <span className="text-[10px] uppercase font-bold text-emerald-300">Target</span>
              </div>

              {/* Oscillating Needle */}
              <div
                className="absolute top-0 bottom-0 w-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50 transition-none -translate-x-1/2"
                style={{ left: `${sliderPos}%` }}
              />
            </div>

            {/* Action Stamp Button */}
            <button
              onClick={handleStamp}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-sm uppercase tracking-wider transition shadow-xl shadow-emerald-950 flex items-center justify-center gap-2"
            >
              <span>STAMP APPROVED ✍️</span>
            </button>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            {result?.grade === "Distinction" ? (
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle className="w-8 h-8" />
              </div>
            ) : result?.grade === "Satisfactory" ? (
              <div className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40">
                <Award className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                <AlertTriangle className="w-8 h-8" />
              </div>
            )}

            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Performance Evaluation
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">{result?.grade}</h3>
              <p className="text-xs text-slate-300 mt-2 px-2">{result?.message}</p>
            </div>

            {/* Payout Summary */}
            <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex justify-around text-xs">
              <div>
                <div className="text-slate-400">Base Salary</div>
                <div className="font-bold text-white">₦{result?.payout.toLocaleString()}</div>
              </div>
              {result && result.bonus > 0 && (
                <div>
                  <div className="text-emerald-400">Distinction Bonus</div>
                  <div className="font-bold text-emerald-400">+₦{result.bonus.toLocaleString()}</div>
                </div>
              )}
            </div>

            <button
              onClick={handleClaim}
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-950"
            >
              {isLoading ? "Crediting Alert..." : "Claim Salary & Return"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
