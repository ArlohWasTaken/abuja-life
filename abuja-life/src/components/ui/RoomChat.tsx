"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react";
import { ChatMessage } from "@/lib/realtime/protocol";

interface RoomChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUsername: string;
}

const QUICK_SLANG_CHIPS = [
  "Senior Man! 🫡",
  "Oga Chairman! 🦅",
  "Drop Aza 💳",
  "We dey outside! 🍾",
  "Director is on break ⏳",
];

export function RoomChat({ messages, onSendMessage, currentUsername }: RoomChatProps) {
  const [inputText, setInputText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText("");
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 w-80 md:w-96 max-w-[calc(100vw-2rem)] flex flex-col items-end">
      {/* Header bar / Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-t-xl border border-slate-700 shadow-xl backdrop-blur transition-all"
      >
        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
        <span>Abuja Room Chat ({messages.length})</span>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded Chat Window */}
      {isExpanded && (
        <div className="w-full bg-slate-950/95 border border-slate-800 rounded-b-xl rounded-tl-xl shadow-2xl p-3 backdrop-blur flex flex-col gap-2">
          {/* Messages list */}
          <div ref={scrollRef} className="h-48 overflow-y-auto flex flex-col gap-1.5 pr-1 text-xs">
            {messages.length === 0 ? (
              <div className="text-slate-500 italic text-center py-6">No chat messages yet in this district.</div>
            ) : (
              messages.map((m) => {
                const isMe = m.username === currentUsername;
                return (
                  <div
                    key={m.id}
                    className={`p-2 rounded-lg max-w-[85%] ${
                      isMe
                        ? "self-end bg-emerald-950/70 border border-emerald-800/60 text-emerald-100"
                        : "self-start bg-slate-900/80 border border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mb-0.5">
                      <span className={isMe ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {m.username}
                      </span>
                      <span>•</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="break-words leading-relaxed">{m.text}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Slang Chips */}
          <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none">
            {QUICK_SLANG_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSendMessage(chip)}
                className="whitespace-nowrap px-2 py-0.5 bg-slate-800/80 hover:bg-emerald-900/60 text-slate-300 hover:text-emerald-300 text-[10px] rounded-full border border-slate-700 transition"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-1.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Talk your mind..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-2.5 py-1.5 rounded-lg flex items-center justify-center transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
