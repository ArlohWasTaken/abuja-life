"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useGameStore } from "@/lib/game/state";
import { ORIGINS, OriginType, DISTRICTS } from "@/lib/game/constants";
import { VitalsHUD } from "@/components/ui/VitalsHUD";
import { DistrictMapModal } from "@/components/ui/DistrictMapModal";
import { MinigameModal } from "@/components/ui/MinigameModal";
import { EncounterModal } from "@/components/ui/EncounterModal";
import { FoodModal } from "@/components/ui/FoodModal";
import { HousingModal } from "@/components/ui/HousingModal";
import { RoomChat } from "@/components/ui/RoomChat";
import { useRoomMultiplayer } from "@/lib/realtime/useRoomMultiplayer";
import { triggerRandomEncounter } from "@/lib/game/encounters";
import { StampEvaluation } from "@/lib/game/minigames";
import { sound } from "@/lib/audio/SoundEffects";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

// Dynamically import 3D Canvas to avoid SSR issues
const GameCanvas = dynamic(
  () => import("@/components/canvas/GameCanvas").then((mod) => mod.GameCanvas),
  { ssr: false }
);

const OtherPlayers = dynamic(
  () => import("@/components/canvas/OtherPlayers").then((mod) => mod.OtherPlayers),
  { ssr: false }
);

export default function AbujaLifeApp() {
  const {
    user,
    setPlayer,
    currentLocation,
    setCurrentLocation,
    clout,
    setMoney,
    updateVitals,
    setApartmentId,
    openModal,
    closeModal,
  } = useGameStore();

  const [usernameInput, setUsernameInput] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType>("corper");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Realtime room presence & chat
  const { otherPlayers, sendMovement, sendChat, messages } = useRoomMultiplayer(
    currentLocation,
    user || { id: "guest", username: "Guest" }
  );

  // Authentication / Profile initialization
  const handleStartGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setIsAuthLoading(true);
    sound.playClick();

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput.trim(),
          origin: selectedOrigin,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enter Abuja");

      setPlayer(data.user);
      sound.playCashAlert();
      showNotification(`Welcome to Abuja, ${data.user.username}! 🇳🇬`);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Error joining game");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Central Game Action Dispatcher
  const handleGameAction = async (actionType: string, payload?: any) => {
    if (!user) return;
    setIsActionLoading(true);

    try {
      let actionBody: any = { type: actionType };

      if (actionType === "eat") {
        actionBody = { type: "eat", itemId: payload };
      } else if (actionType === "rent_apartment") {
        actionBody = { type: "rent_apartment", apartmentId: payload };
      } else if (actionType === "travel") {
        actionBody = { type: "travel", districtId: payload };
      } else if (actionType === "work_shift") {
        actionBody = { type: "work_shift", skipCooldownCheck: payload?.skipCooldownCheck };
      }

      const res = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: actionBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setPlayer(data.user);

      if (actionType === "eat") {
        sound.playCashAlert();
        showNotification("Belly full! Hunger and energy restored. 🍲");
        closeModal();
      } else if (actionType === "sleep") {
        sound.playCashAlert();
        showNotification("You slept like a Permanent Secretary. Energy is 100%! 💤");
      } else if (actionType === "rent_apartment") {
        sound.playCashAlert();
        showNotification("Keys collected! New crib unlocked. 🔑");
        closeModal();
      } else if (actionType === "travel") {
        closeModal();
        showNotification(`Arrived at ${DISTRICTS[payload]?.name || payload}! 🚗`);

        // 35% chance to trigger random street encounter
        if (Math.random() < 0.35) {
          const encounter = triggerRandomEncounter(payload, clout);
          sound.playSiren();
          openModal("encounter", encounter);
        }
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Minigame Shift Completion Callback
  const handleCompleteShift = async (score: number, evaluation: StampEvaluation) => {
    await handleGameAction("work_shift", { skipCooldownCheck: true });
    closeModal();
    showNotification(`Shift completed! ₦${(evaluation.payout + evaluation.bonus).toLocaleString()} credited. 💼`);
  };

  // Street Encounter Resolution Callback
  const handleResolveEncounter = async (optionId: string, cost?: number) => {
    if (cost && cost > 0 && user) {
      await handleGameAction("eat", "mama_put"); // small debit transaction
    }
    closeModal();
    showNotification("Encounter resolved! Safe journey through the capital. 🛣️");
  };

  // If player hasn't selected their Origin / Username yet
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Federal Capital Territory Simulation</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              ABUJA <span className="text-emerald-400">LIFE</span> 🇳🇬
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
              From Kubwa corper hustle to Maitama ministerial soft life. Choose your origin to start.
            </p>
          </div>

          <form onSubmit={handleStartGame} className="flex flex-col gap-5">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Your Abuja Street Name / Handle
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. Senior_Tunde, Alhaji_Maitama, Corper_Chidi"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Origin Selection Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Select Your Abuja Origin
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(ORIGINS) as OriginType[]).map((key) => {
                  const origin = ORIGINS[key];
                  const isSelected = selectedOrigin === key;
                  return (
                    <div
                      key={key}
                      onClick={() => {
                        sound.playClick();
                        setSelectedOrigin(key);
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{origin.title}</span>
                        <span className="text-[11px] font-black text-amber-400">
                          ₦{origin.startingCash.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{origin.perkDescription}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthLoading || !usernameInput.trim()}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white font-extrabold text-sm uppercase tracking-wider transition shadow-xl shadow-emerald-950 flex items-center justify-center gap-2"
            >
              <span>{isAuthLoading ? "Verifying Credentials..." : "Enter Abuja City"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Active Playable Game Screen
  return (
    <main className="w-screen h-screen overflow-hidden relative bg-slate-950">
      {/* 3D Isometric View */}
      <GameCanvas
        roomId={currentLocation}
        username={user.username}
        onPositionChange={(pos) => sendMovement(pos[0], pos[2])}
      >
        <OtherPlayers players={otherPlayers} />
      </GameCanvas>

      {/* Floating Vitals & Main Action HUD */}
      <VitalsHUD
        onAction={handleGameAction}
        isActionLoading={isActionLoading}
      />

      {/* Floating Multiplayer Chat */}
      <RoomChat
        messages={messages}
        onSendMessage={sendChat}
        currentUsername={user.username}
      />

      {/* Modals */}
      <DistrictMapModal
        onTravel={(dest) => handleGameAction("travel", dest)}
        isLoading={isActionLoading}
      />

      <MinigameModal
        onCompleteShift={handleCompleteShift}
        isLoading={isActionLoading}
      />

      <EncounterModal
        onResolveOption={handleResolveEncounter}
        isLoading={isActionLoading}
      />

      <FoodModal
        onEat={(foodId) => handleGameAction("eat", foodId)}
        isLoading={isActionLoading}
      />

      <HousingModal
        onRentApartment={(aptId) => handleGameAction("rent_apartment", aptId)}
        isLoading={isActionLoading}
      />

      {/* Toast Notification Alert */}
      {notification && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-emerald-500/80 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur animate-fade-in flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}
    </main>
  );
}
