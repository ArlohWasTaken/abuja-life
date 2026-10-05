"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AvatarProps {
  position: [number, number, number];
  targetPosition?: [number, number, number] | null;
  onPositionReached?: (pos: [number, number, number]) => void;
  username: string;
  isSelf?: boolean;
  color?: string;
  capColor?: string;
  chatMessage?: string | null;
}

export function Avatar({
  position,
  targetPosition,
  onPositionReached,
  username,
  isSelf = false,
  color = "#15803d", // Emerald Green kaftan
  capColor = "#b91c1c", // Red cap / fila
  chatMessage,
}: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));
  const targetVec = useRef(new THREE.Vector3(position[0], position[1], position[2]));
  const [isWalking, setIsWalking] = useState(false);
  const walkPhase = useRef(0);

  useEffect(() => {
    if (targetPosition) {
      targetVec.current.set(targetPosition[0], targetPosition[1], targetPosition[2]);
      setIsWalking(true);
    }
  }, [targetPosition]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isWalking) {
      const distance = currentPos.current.distanceTo(targetVec.current);
      if (distance > 0.08) {
        // Move towards target
        const speed = 4.5 * delta;
        currentPos.current.lerp(targetVec.current, Math.min(1, speed / distance));

        // Rotate face towards target
        const diffX = targetVec.current.x - currentPos.current.x;
        const diffZ = targetVec.current.z - currentPos.current.z;
        if (Math.abs(diffX) > 0.01 || Math.abs(diffZ) > 0.01) {
          const targetAngle = Math.atan2(diffX, diffZ);
          groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetAngle, 0.2);
        }

        // Bobbing walking motion
        walkPhase.current += delta * 12;
        groupRef.current.position.y = Math.abs(Math.sin(walkPhase.current)) * 0.12;
      } else {
        setIsWalking(false);
        groupRef.current.position.y = 0;
        if (onPositionReached && targetPosition) {
          onPositionReached(targetPosition);
        }
      }
    }

    groupRef.current.position.x = currentPos.current.x;
    groupRef.current.position.z = currentPos.current.z;
  });

  return (
    <group ref={groupRef} position={[position[0], 0, position[2]]}>
      {/* Selection / presence indicator ring */}
      {isSelf && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.55, 0.65, 32]} />
          <meshBasicMaterial color="#eab308" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* Traditional Agbada / Kaftan Body */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.42, 1.1, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#8d5524" roughness={0.8} />
      </mesh>

      {/* Nigerian Fila / Cap */}
      <mesh position={[0, 1.82, 0]} rotation={[0.05, 0, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.23, 0.18, 12]} />
        <meshStandardMaterial color={capColor} roughness={0.6} />
      </mesh>

      {/* Gold Necklace / Bling */}
      {isSelf && (
        <mesh position={[0, 1.35, 0.18]} rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[0.16, 0.025, 8, 16]} />
          <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.1} />
        </mesh>
      )}
    </group>
  );
}
