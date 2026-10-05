"use client";

import React from "react";

export function WuseLounge() {
  return (
    <group>
      {/* Dark Polished Lounge Floor */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[16, 0.1, 14]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.4} />
      </mesh>

      {/* Velvet VIP Booth (Deep Maroon / Gold) */}
      <group position={[-3, 0.6, -2]}>
        {/* Backrest */}
        <mesh castShadow>
          <boxGeometry args={[3.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#881337" roughness={0.6} />
        </mesh>
        {/* Cushion seat */}
        <mesh position={[0, -0.4, 0.6]} castShadow>
          <boxGeometry args={[3.4, 0.35, 1.2]} />
          <meshStandardMaterial color="#9f1239" roughness={0.5} />
        </mesh>
      </group>

      {/* Glass & Gold Lounge Table */}
      <group position={[-3, 0.4, -0.6]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.1, 1.1, 0.08, 16]} />
          <meshStandardMaterial color="#fef08a" metalness={0.8} roughness={0.1} transparent opacity={0.85} />
        </mesh>
        {/* Gold Table Stand */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.08, 0.25, 0.4, 12]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Ice Bucket & Champagne Bottle */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.16, 0.25, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.35, 0]} rotation={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 0.3, 10]} />
          <meshStandardMaterial color="#14532d" roughness={0.2} />
        </mesh>
      </group>

      {/* Glowing Neon Bar Counter */}
      <group position={[3.5, 0.6, -1]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.2, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} />
        </mesh>
        {/* Neon Light Strip */}
        <mesh position={[-0.72, 0.5, 0]}>
          <boxGeometry args={[0.05, 0.08, 5.8]} />
          <meshStandardMaterial color="#a855f7" emissive="#9333ea" emissiveIntensity={2} />
        </mesh>
        {/* Bar Stools */}
        {[-1.8, 0, 1.8].map((z, idx) => (
          <group key={idx} position={[-1.2, 0, z]}>
            <mesh position={[0, 0.2, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.3, 0.1, 12]} />
              <meshStandardMaterial color="#eab308" metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Mood Accent Light */}
      <pointLight position={[-3, 2.5, -1]} color="#f43f5e" intensity={1.8} distance={8} />
      <pointLight position={[3, 2.5, 0]} color="#38bdf8" intensity={1.5} distance={8} />
    </group>
  );
}
