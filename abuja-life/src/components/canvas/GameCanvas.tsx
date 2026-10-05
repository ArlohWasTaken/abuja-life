"use client";

import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { RoomScene } from "./RoomScene";
import { Avatar } from "./Avatar";
import { getRoomConfig } from "@/lib/game/constants";

interface GameCanvasProps {
  roomId: string;
  username: string;
  avatarColor?: string;
  onPositionChange?: (pos: [number, number, number]) => void;
  children?: React.ReactNode;
}

export function GameCanvas({
  roomId,
  username,
  avatarColor = "#15803d",
  onPositionChange,
  children,
}: GameCanvasProps) {
  const config = getRoomConfig(roomId);
  const [targetPos, setTargetPos] = useState<[number, number, number] | null>(null);
  const [currentPos, setCurrentPos] = useState<[number, number, number]>([0, 0, 0]);

  const handleFloorClick = (point: [number, number, number]) => {
    // Clamp coordinates within room bounds
    const halfW = config.bounds.width / 2 - 0.5;
    const halfD = config.bounds.depth / 2 - 0.5;
    const clampedX = Math.max(-halfW, Math.min(halfW, point[0]));
    const clampedZ = Math.max(-halfD, Math.min(halfD, point[2]));

    const target: [number, number, number] = [clampedX, 0, clampedZ];
    setTargetPos(target);
    if (onPositionChange) {
      onPositionChange(target);
    }
  };

  const handlePositionReached = (pos: [number, number, number]) => {
    setCurrentPos(pos);
    setTargetPos(null);
  };

  return (
    <div className="w-full h-full relative overflow-hidden select-none bg-slate-950">
      <Canvas
        shadows
        camera={{
          position: config.cameraPosition,
          fov: 35,
          near: 0.1,
          far: 1000,
        }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Warm Sunlight & Ambient Fill */}
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[15, 25, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={60}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <hemisphereLight args={["#bae6fd", "#334155", 0.4]} />

        {/* Room Environment */}
        <RoomScene districtId={roomId} onFloorClick={handleFloorClick} />

        {/* Local Player Avatar */}
        <Avatar
          position={currentPos}
          targetPosition={targetPos}
          onPositionReached={handlePositionReached}
          username={username}
          isSelf
          color={avatarColor}
        />

        {/* Other Players and additional 3D layers */}
        {children}
      </Canvas>

      {/* Touch / Click Hint Overlay */}
      <div className="absolute bottom-4 left-4 pointer-events-none text-xs text-white/50 bg-black/40 px-2.5 py-1 rounded backdrop-blur border border-white/10">
        Tap or click anywhere to walk
      </div>
    </div>
  );
}
