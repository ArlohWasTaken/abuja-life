"use client";

import React from "react";
import { Avatar } from "./Avatar";
import { RemotePlayer } from "@/lib/realtime/protocol";

interface OtherPlayersProps {
  players: RemotePlayer[];
}

export function OtherPlayers({ players }: OtherPlayersProps) {
  return (
    <group>
      {players.map((p) => (
        <Avatar
          key={p.id}
          position={[p.x, 0, p.z]}
          targetPosition={[p.x, 0, p.z]}
          username={p.username}
          isSelf={false}
          color={p.color}
          capColor={p.capColor}
          chatMessage={p.activeChat}
        />
      ))}
    </group>
  );
}
