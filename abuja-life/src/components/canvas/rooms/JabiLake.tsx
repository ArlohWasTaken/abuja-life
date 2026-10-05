"use client";

import React from "react";

export function JabiLake() {
  return (
    <group>
      {/* Grassy Shore / Park Ground */}
      <mesh position={[-3, -0.05, 0]} receiveShadow>
        <boxGeometry args={[12, 0.1, 16]} />
        <meshStandardMaterial color="#3f6212" roughness={0.9} />
      </mesh>

      {/* Jabi Lake Water Plane */}
      <mesh position={[5.5, -0.08, 0]} receiveShadow>
        <boxGeometry args={[7, 0.08, 16]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.6} transparent opacity={0.88} />
      </mesh>

      {/* Wooden Boat Pier Extending into Water */}
      <group position={[2.5, 0.1, 0]}>
        {/* Planks */}
        <mesh receiveShadow castShadow>
          <boxGeometry args={[3.5, 0.12, 1.8]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        {/* Pier Pilings */}
        <mesh position={[1.4, -0.4, 0.8]}>
          <cylinderGeometry args={[0.08, 0.08, 0.9]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
        <mesh position={[1.4, -0.4, -0.8]}>
          <cylinderGeometry args={[0.08, 0.08, 0.9]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
      </group>

      {/* Palm Trees along Shore */}
      {[
        { x: -5, z: -4, h: 3.8 },
        { x: -6, z: 2, h: 4.2 },
        { x: -4, z: 5, h: 3.5 },
      ].map((tree, idx) => (
        <group key={idx} position={[tree.x, 0, tree.z]}>
          {/* Trunk */}
          <mesh position={[0, tree.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.22, tree.h, 7]} />
            <meshStandardMaterial color="#713f12" roughness={0.9} />
          </mesh>
          {/* Foliage canopy */}
          <mesh position={[0, tree.h, 0]} castShadow>
            <coneGeometry args={[1.5, 1.4, 6]} />
            <meshStandardMaterial color="#15803d" roughness={0.6} />
          </mesh>
          <mesh position={[0, tree.h + 0.6, 0]} castShadow>
            <coneGeometry args={[1.1, 1.2, 6]} />
            <meshStandardMaterial color="#16a34a" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Park Bench */}
      <group position={[-1.5, 0.35, -2]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 0.1, 0.6]} />
          <meshStandardMaterial color="#92400e" />
        </mesh>
        <mesh position={[0, 0.35, -0.25]} castShadow>
          <boxGeometry args={[1.8, 0.6, 0.1]} />
          <meshStandardMaterial color="#92400e" />
        </mesh>
      </group>
    </group>
  );
}
