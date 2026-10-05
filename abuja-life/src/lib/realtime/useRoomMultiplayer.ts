"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RemotePlayer, ChatMessage, ClientPacket, ServerPacket, decodePacket, encodePacket } from "./protocol";

const AMBIENT_ABUJA_CITIZENS: Record<string, RemotePlayer[]> = {
  secretariat: [
    { id: "bot_1", username: "Director_Bala", x: 1.5, z: -1.2, color: "#166534", capColor: "#15803d" },
    { id: "bot_2", username: "Corper_Blessing", x: -2.0, z: 1.0, color: "#a16207", capColor: "#854d0e" },
    { id: "bot_3", username: "Alhaji_Tender", x: 2.2, z: 2.0, color: "#1e3a8a", capColor: "#1d4ed8" },
  ],
  wuse2: [
    { id: "bot_4", username: "Big_Sammy_C300", x: -1.8, z: 0.5, color: "#831843", capColor: "#be185d" },
    { id: "bot_5", username: "Banex_Plug", x: 1.2, z: 1.8, color: "#0f172a", capColor: "#334155" },
  ],
  jabi_lake: [
    { id: "bot_6", username: "Maitama_Runner", x: -2.5, z: -2.0, color: "#065f46", capColor: "#047857" },
    { id: "bot_7", username: "Yacht_Captain", x: 1.8, z: -0.5, color: "#1e40af", capColor: "#1d4ed8" },
  ],
};

const DEFAULT_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  secretariat: [
    { id: "m1", senderId: "bot_1", username: "Director_Bala", text: "Bring that memo to my office before 2 PM.", timestamp: Date.now() - 120000 },
    { id: "m2", senderId: "bot_2", username: "Corper_Blessing", text: "Sir, I already submitted the voucher to Admin! 🙏", timestamp: Date.now() - 60000 },
  ],
  wuse2: [
    { id: "m3", senderId: "bot_4", username: "Big_Sammy_C300", text: "Shawarma at Al-Basha is hitting different tonight 🍾", timestamp: Date.now() - 90000 },
    { id: "m4", senderId: "bot_5", username: "Banex_Plug", text: "Clean iPhone 16 Pro Max available, receipt inside! 📱", timestamp: Date.now() - 30000 },
  ],
  jabi_lake: [
    { id: "m5", senderId: "bot_6", username: "Maitama_Runner", text: "Abuja weather this evening is so serene 🍃", timestamp: Date.now() - 45000 },
  ],
};

export function useRoomMultiplayer(roomId: string, currentUser: { id: string; username: string; color?: string }) {
  const [otherPlayers, setOtherPlayers] = useState<RemotePlayer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize room citizens and chats
  useEffect(() => {
    const ambient = AMBIENT_ABUJA_CITIZENS[roomId] || AMBIENT_ABUJA_CITIZENS.secretariat;
    setOtherPlayers(ambient);

    const defaultMsgs = DEFAULT_CHAT_MESSAGES[roomId] || DEFAULT_CHAT_MESSAGES.secretariat;
    setMessages(defaultMsgs);

    // If WebSocket endpoint is configured in env
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) {
      try {
        const ws = new WebSocket(`${wsUrl}?room=${roomId}&userId=${currentUser.id}`);
        wsRef.current = ws;

        ws.onopen = () => {
          const joinPacket: ClientPacket = {
            type: "JOIN_ROOM",
            roomId,
            username: currentUser.username,
            color: currentUser.color || "#15803d",
          };
          ws.send(encodePacket(joinPacket));
        };

        ws.onmessage = (event) => {
          const packet = decodePacket<ServerPacket>(event.data);
          if (!packet) return;

          switch (packet.type) {
            case "ROOM_STATE":
              setOtherPlayers(packet.players.filter((p) => p.id !== currentUser.id));
              break;
            case "PLAYER_JOIN":
              if (packet.player.id !== currentUser.id) {
                setOtherPlayers((prev) => [...prev.filter((p) => p.id !== packet.player.id), packet.player]);
              }
              break;
            case "PLAYER_MOVE":
              setOtherPlayers((prev) =>
                prev.map((p) => (p.id === packet.playerId ? { ...p, x: packet.x, z: packet.z } : p))
              );
              break;
            case "PLAYER_LEAVE":
              setOtherPlayers((prev) => prev.filter((p) => p.id !== packet.playerId));
              break;
            case "CHAT":
              setMessages((prev) => [...prev, packet]);
              break;
          }
        };

        return () => {
          ws.close();
          wsRef.current = null;
        };
      } catch {
        // Fall back gracefully to ambient simulation
      }
    }
  }, [roomId, currentUser.id, currentUser.username, currentUser.color]);

  const sendMovement = useCallback((x: number, z: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const packet: ClientPacket = { type: "MOVE", x, z };
      wsRef.current.send(encodePacket(packet));
    }
  }, []);

  const sendChat = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId: currentUser.id,
      username: currentUser.username,
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const packet: ClientPacket = { type: "CHAT_SEND", text: trimmed };
      wsRef.current.send(encodePacket(packet));
    }
  }, [currentUser.id, currentUser.username]);

  return { otherPlayers, sendMovement, sendChat, messages };
}
