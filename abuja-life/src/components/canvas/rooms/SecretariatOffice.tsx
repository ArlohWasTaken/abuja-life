"use client";

import React from "react";

export function SecretariatOffice() {
  return (
    <group>
      {/* Terrazzo Government Floor */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[14, 0.1, 14]} />
        <meshStandardMaterial color="#d4cebe" roughness={0.6} />
      </mesh>

      {/* Grid lines / floor tile borders */}
      <gridHelper args={[14, 14, "#8a8170", "#b5ad9e"]} position={[0, 0.01, 0]} />

      {/* Heavy Wooden Executive Desk */}
      <group position={[0, 0.5, -2]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.1, 1.6]} />
          <meshStandardMaterial color="#4a2511" roughness={0.4} />
        </mesh>
        {/* Desk legs */}
        <mesh position={[-1.4, 0, 0.6]} castShadow>
          <boxGeometry args={[0.15, 0.9, 0.15]} />
          <meshStandardMaterial color="#2d150a" />
        </mesh>
        <mesh position={[1.4, 0, 0.6]} castShadow>
          <boxGeometry args={[0.15, 0.9, 0.15]} />
          <meshStandardMaterial color="#2d150a" />
        </mesh>
        <mesh position={[-1.4, 0, -0.6]} castShadow>
          <boxGeometry args={[0.15, 0.9, 0.15]} />
          <meshStandardMaterial color="#2d150a" />
        </mesh>
        <mesh position={[1.4, 0, -0.6]} castShadow>
          <boxGeometry args={[0.15, 0.9, 0.15]} />
          <meshStandardMaterial color="#2d150a" />
        </mesh>

        {/* Stacked Nigerian Government Green Files */}
        <mesh position={[-0.8, 0.55, 0.2]} castShadow>
          <boxGeometry args={[0.5, 0.12, 0.7]} />
          <meshStandardMaterial color="#1e5128" />
        </mesh>
        <mesh position={[-0.8, 0.64, 0.22]} rotation={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.5, 0.08, 0.68]} />
          <meshStandardMaterial color="#2e7d32" />
        </mesh>

        {/* Computer Monitor / Screen */}
        <mesh position={[0.4, 0.75, -0.2]} castShadow>
          <boxGeometry args={[0.8, 0.5, 0.08]} />
          <meshStandardMaterial color="#111827" roughness={0.2} />
        </mesh>
        <mesh position={[0.4, 0.55, -0.2]}>
          <cylinderGeometry args={[0.04, 0.08, 0.2]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      </group>

      {/* Nigerian Flag on Brass Pole */}
      <group position={[-3, 1.8, -3]}>
        {/* Pole */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 3.6]} />
          <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Flag fabric (Green - White - Green) */}
        <mesh position={[0.5, 1.2, 0]}>
          <boxGeometry args={[1, 0.7, 0.02]} />
          <meshStandardMaterial color="#15803d" />
        </mesh>
        <mesh position={[0.5, 1.2, 0.005]}>
          <boxGeometry args={[0.34, 0.7, 0.025]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Director's High-Back Leather Swivel Chair */}
      <group position={[0, 0.8, -3.2]}>
        <mesh castShadow>
          <boxGeometry args={[1, 0.9, 0.15]} />
          <meshStandardMaterial color="#1c1917" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.4, 0.4]} castShadow>
          <boxGeometry args={[1, 0.15, 0.9]} />
          <meshStandardMaterial color="#292524" roughness={0.5} />
        </mesh>
      </group>

      {/* Split AC Unit on Back Wall */}
      <mesh position={[0, 3.2, -6.8]} castShadow>
        <boxGeometry args={[2.4, 0.6, 0.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
    </group>
  );
}
