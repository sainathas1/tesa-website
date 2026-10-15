"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Undulating Synthetic Silk & Carbon Fabric Simulation
function UndulatingCloth() {
  const meshRef = useRef<THREE.Mesh>(null);

  // PlaneGeometry with dense subdivision (80x80 segments) for smooth cloth folds
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(5.2, 3.4, 80, 80);
  }, []);

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();

    if (meshRef.current) {
      // Subtle organic tilt reacting to mouse position
      meshRef.current.rotation.x = -0.35 + Math.sin(t * 0.35) * 0.12 + pointer.y * 0.15;
      meshRef.current.rotation.y = Math.sin(t * 0.28) * 0.25 + pointer.x * 0.2;
      meshRef.current.rotation.z = Math.cos(t * 0.2) * 0.08;

      const pos = meshRef.current.geometry.attributes.position;
      const count = pos.count;

      // Realistic sine-wave cloth simulation manipulating vertices
      for (let i = 0; i < count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);

        // Combined multi-frequency harmonics for authentic waving fabric drape
        const wave1 = Math.sin(u * 2.2 + t * 1.8) * 0.32;
        const wave2 = Math.cos(v * 2.4 + t * 1.4) * 0.26;
        const wave3 = Math.sin((u + v) * 1.6 + t * 1.1) * 0.18;
        const ripple = Math.sin(Math.sqrt(u * u + v * v) * 3.2 - t * 2.2) * 0.12;

        pos.setZ(i, wave1 + wave2 + wave3 + ripple);
      }

      pos.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* High-Gloss Futuristic Synthetic Fiber Fabric */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color="#8b5cf6"
          emissive="#2e1065"
          emissiveIntensity={0.3}
          metalness={0.92}
          roughness={0.14}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
          reflectivity={0.96}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function TextileCanvas() {
  return (
    <div className="relative w-full h-[420px] sm:h-[500px] lg:h-[580px] flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 4.4], fov: 46 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Soft Ambient Light */}
        <ambientLight intensity={0.55} />

        {/* Studio Specular Highlights */}
        <directionalLight position={[0, 6, 5]} intensity={2.0} color="#ffffff" />

        {/* NEON PURPLE POINT LIGHT to illuminate the folds of the fabric */}
        <pointLight
          position={[-4.5, 3.0, 3.0]}
          intensity={5.0}
          distance={12}
          color="#c084fc"
        />

        {/* NEON ELECTRIC BLUE POINT LIGHT to illuminate the opposite folds */}
        <pointLight
          position={[4.5, -2.5, 3.0]}
          intensity={4.8}
          distance={12}
          color="#00f0ff"
        />

        {/* Cyan Ambient Fill Light */}
        <pointLight
          position={[0, -4.0, -2.0]}
          intensity={2.8}
          distance={10}
          color="#38bdf8"
        />

        {/* The Undulating Synthetic Cloth Simulation */}
        <UndulatingCloth />
      </Canvas>
    </div>
  );
}
