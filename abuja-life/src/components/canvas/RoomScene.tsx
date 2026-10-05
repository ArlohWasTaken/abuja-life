"use client";

import React from "react";
import { ThreeEvent } from "@react-three/fiber";
import { SecretariatOffice } from "./rooms/SecretariatOffice";
import { WuseLounge } from "./rooms/WuseLounge";
import { JabiLake } from "./rooms/JabiLake";
import { getRoomConfig } from "@/lib/game/constants";

interface RoomSceneProps {
  districtId: string;
  onFloorClick?: (point: [number, number, number]) => void;
}

export function RoomScene({ districtId, onFloorClick }: RoomSceneProps) {
  const config = getRoomConfig(districtId);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (onFloorClick) {
      onFloorClick([e.point.x, 0, e.point.z]);
    }
  };

  return (
    <group>
      {/* Click-to-move interactive floor plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <planeGeometry args={[config.bounds.width * 2, config.bounds.depth * 2]} />
        <meshBasicMaterial />
      </mesh>

      {/* Dynamic room environment based on current district */}
      {districtId === "secretariat" && <SecretariatOffice />}
      {districtId === "wuse2" && <WuseLounge />}
      {districtId === "jabi_lake" && <JabiLake />}
      {/* Default fallback for kado, maitama, gwarinpa: themed office or lounge */}
      {districtId === "kado" && <JabiLake />}
      {districtId === "maitama" && <WuseLounge />}
      {districtId === "gwarinpa" && <SecretariatOffice />}
    </group>
  );
}
