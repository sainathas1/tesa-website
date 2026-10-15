"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Dynamic Undulating Silk / Metallic Composite Ribbon
function UndulatingFabricMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);

  // Geometry: high subdivision plane for fluid silk undulation
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(3.6, 2.4, 60, 60);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = -0.3 + Math.sin(t * 0.4) * 0.15;
      meshRef.current.rotation.y = Math.sin(t * 0.3) * 0.35;
      meshRef.current.rotation.z = Math.cos(t * 0.25) * 0.1;

      const pos = meshRef.current.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        // Complex harmonic wave resembling fluid silk fabric
        const wave1 = Math.sin(u * 2.5 + t * 1.8) * 0.32;
        const wave2 = Math.cos(v * 2.2 + t * 1.4) * 0.24;
        const wave3 = Math.sin((u + v) * 1.8 + t * 1.2) * 0.18;
        pos.setZ(i, wave1 + wave2 + wave3);
      }
      pos.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
    }

    if (wireframeRef.current && meshRef.current) {
      wireframeRef.current.rotation.copy(meshRef.current.rotation);
      wireframeRef.current.position.copy(meshRef.current.position);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Primary Reflective Metallic Silk Ribbon */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color="#a855f7"
          emissive="#3b0764"
          emissiveIntensity={0.25}
          metalness={0.92}
          roughness={0.16}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
          reflectivity={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating Intertwined High-Tech Torus Ribbon */}
      <FloatingRibbonRing />
    </group>
  );
}

// Secondary Metallic Fiber Filament Ring
function FloatingRibbonRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 0.45;
      ringRef.current.rotation.y = t * 0.35;
      ringRef.current.rotation.z = Math.sin(t * 0.5) * 0.2;
    }
  });

  return (
    <mesh ref={ringRef} scale={1.15}>
      <torusKnotGeometry args={[1.6, 0.08, 120, 16, 2, 5]} />
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#0369a1"
        emissiveIntensity={0.3}
        metalness={0.95}
        roughness={0.12}
      />
    </mesh>
  );
}

export default function TextileCanvas3D() {
  return (
    <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[540px] flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 48 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Ambient & Studio Specular Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 5, 4]} intensity={2.2} color="#ffffff" />
        <pointLight position={[-4, -3, 2]} intensity={3.5} color="#c084fc" />
        <pointLight position={[3, -2, -2]} intensity={2.5} color="#38bdf8" />
        <pointLight position={[0, 4, -2]} intensity={2.0} color="#ec4899" />

        {/* 3D Fabric Model */}
        <UndulatingFabricMesh />
      </Canvas>
    </div>
  );
}
