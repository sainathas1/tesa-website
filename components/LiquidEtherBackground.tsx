"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ============================================================================
// PARTICLE COUNT & COLOR PALETTE CONSTANTS (Deep Sea Bioluminescence)
// ============================================================================
const PARTICLE_COUNT = 2400;

// Curated bioluminescent spectrum: Deep Sea Cyan, Neon Teal, Electric Blue, Ethereal Violet
const PALETTE = [
  new THREE.Color("#00f0ff"), // Vivid Cyan
  new THREE.Color("#0ea5e9"), // Electric Sky
  new THREE.Color("#2dd4bf"), // Bioluminescent Teal
  new THREE.Color("#38bdf8"), // Soft Cyan
  new THREE.Color("#818cf8"), // Ethereal Indigo
  new THREE.Color("#a855f7"), // Bioluminescent Violet
];

// Helper: Circular soft particle texture generated dynamically with Canvas API
function createGlowPointTexture() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.2, "rgba(0, 240, 255, 0.85)");
  gradient.addColorStop(0.5, "rgba(14, 165, 233, 0.4)");
  gradient.addColorStop(0.8, "rgba(45, 212, 191, 0.15)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// ============================================================================
// BIOLUMINESCENT PARTICLES FLOW (Liquid Ether & Deep-Sea Creatures Swarm)
// ============================================================================
function BioluminescentParticleFlow({
  mouseRef,
  scrollRef,
}: {
  mouseRef: React.MutableRefObject<{ x: number; y: number; targetX: number; targetY: number }>;
  scrollRef: React.MutableRefObject<{ y: number; speed: number }>;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const glowTexture = useMemo(() => createGlowPointTexture(), []);

  // Initialize particle positions, original anchors, velocities, colors, and phases
  const { positions, originalPositions, colors, phases, speeds } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const orig = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const ph = new Float32Array(PARTICLE_COUNT);
    const sp = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Cylinder / fluid flow distribution
      const radius = 2.5 + Math.random() * 8.5;
      const angle = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 22;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.7;

      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;

      orig[i3] = x;
      orig[i3 + 1] = y;
      orig[i3 + 2] = z;

      // Pick organic bioluminescent color
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;

      phases[i] = Math.random() * Math.PI * 2;
      sp[i] = 0.4 + Math.random() * 0.8;
    }

    return {
      positions: pos,
      originalPositions: orig,
      colors: col,
      phases: ph,
      speeds: sp,
    };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position;
    const array = posAttr.array as Float32Array;

    const mx = mouseRef.current.x * 4.5;
    const my = mouseRef.current.y * 3.5;
    const scrollOffset = scrollRef.current.y * 0.003;
    const scrollSpeed = scrollRef.current.speed * 0.02;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const ox = originalPositions[i3];
      const oy = originalPositions[i3 + 1];
      const oz = originalPositions[i3 + 2];
      const phase = phases[i];
      const speed = speeds[i];

      // Organic fluid swirling motion (sinusoidal ocean current drift)
      const currentX = Math.sin(t * 0.35 * speed + phase + oz * 0.2) * 1.2;
      const currentY = Math.cos(t * 0.28 * speed + phase + ox * 0.25) * 1.0;
      const currentZ = Math.sin(t * 0.4 * speed + phase) * 1.5;

      // Cursor vortex attractor/repulsor influence
      const dx = ox + currentX - mx;
      const dy = oy + currentY - my;
      const distSq = dx * dx + dy * dy;
      let mouseInfluenceX = 0;
      let mouseInfluenceY = 0;

      if (distSq < 16) {
        const factor = (16 - distSq) / 16;
        // Swirling vortex curl around the mouse
        mouseInfluenceX = (-dy * 0.6 + dx * 0.3) * factor;
        mouseInfluenceY = (dx * 0.6 + dy * 0.3) * factor;
      }

      // Dynamic position calculation
      array[i3] = ox + currentX + mouseInfluenceX;
      // Scroll velocity causes organic vertical & depth surge
      array[i3 + 1] = oy + currentY + mouseInfluenceY - (scrollOffset * speed * 2) % 18;
      if (array[i3 + 1] < -10) array[i3 + 1] += 20;
      if (array[i3 + 1] > 10) array[i3 + 1] -= 20;

      array[i3 + 2] = oz + currentZ + scrollSpeed * 0.5;
      if (array[i3 + 2] < -12) array[i3 + 2] += 24;
      if (array[i3 + 2] > 12) array[i3 + 2] -= 24;
    }

    posAttr.needsUpdate = true;

    // Subtle breathing pulse rotation
    pointsRef.current.rotation.z = Math.sin(t * 0.1) * 0.15;
    pointsRef.current.rotation.y = Math.cos(t * 0.08) * 0.12;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        map={glowTexture || undefined}
      />
    </points>
  );
}

// ============================================================================
// DEEP-SEA CREATURE TENTACLES / ETHER FLUID RIBBONS (Siphonophore Undulation)
// ============================================================================
function DeepSeaCreatureRibbons({
  mouseRef,
  scrollRef,
}: {
  mouseRef: React.MutableRefObject<{ x: number; y: number; targetX: number; targetY: number }>;
  scrollRef: React.MutableRefObject<{ y: number; speed: number }>;
}) {
  const ribbon1Ref = useRef<THREE.Mesh>(null);
  const ribbon2Ref = useRef<THREE.Mesh>(null);
  const creatureSpineRef = useRef<THREE.Group>(null);

  // Generate ribbon plane geometries for fluid undulating tentacles
  const geom1 = useMemo(() => new THREE.PlaneGeometry(14, 1.8, 64, 16), []);
  const geom2 = useMemo(() => new THREE.PlaneGeometry(16, 1.4, 64, 16), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const scrollDelta = scrollRef.current.y * 0.001;

    // Follow mouse with organic creature inertia
    if (creatureSpineRef.current) {
      creatureSpineRef.current.position.x = THREE.MathUtils.lerp(
        creatureSpineRef.current.position.x,
        mx * 3.5,
        0.03
      );
      creatureSpineRef.current.position.y = THREE.MathUtils.lerp(
        creatureSpineRef.current.position.y,
        my * 2.5 - scrollDelta * 0.5,
        0.03
      );
      creatureSpineRef.current.rotation.z = THREE.MathUtils.lerp(
        creatureSpineRef.current.rotation.z,
        -mx * 0.4 + Math.sin(t * 0.4) * 0.15,
        0.04
      );
    }

    // Undulate Primary Ribbon (Creature Siphonophore fin)
    if (ribbon1Ref.current) {
      const pos = ribbon1Ref.current.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        // Harmonic waves travelling down creature's body
        const wave =
          Math.sin(u * 0.8 - t * 2.2) * 0.6 +
          Math.cos(v * 1.5 + t * 1.5) * 0.3 +
          Math.sin((u + v) * 0.5 - t * 1.8) * 0.25;
        pos.setZ(i, wave);
      }
      pos.needsUpdate = true;
      ribbon1Ref.current.geometry.computeVertexNormals();
    }

    // Undulate Secondary Ribbon
    if (ribbon2Ref.current) {
      const pos = ribbon2Ref.current.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const wave =
          Math.cos(u * 0.7 - t * 1.9 + 1.2) * 0.55 +
          Math.sin(v * 1.8 + t * 1.7) * 0.25 +
          Math.cos((u - v) * 0.6 - t * 2.1) * 0.2;
        pos.setZ(i, wave);
      }
      pos.needsUpdate = true;
      ribbon2Ref.current.geometry.computeVertexNormals();
    }
  });

  return (
    <group ref={creatureSpineRef} position={[0, 0, -2]}>
      {/* Primary Bioluminescent Ether Fin */}
      <mesh ref={ribbon1Ref} geometry={geom1} rotation={[-0.4, 0.3, 0.1]}>
        <meshPhysicalMaterial
          color="#00f0ff"
          emissive="#0284c7"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
          transmission={0.4}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          wireframe={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Secondary Ethereal Violet-Cyan Ribbon Tentacle */}
      <mesh
        ref={ribbon2Ref}
        geometry={geom2}
        rotation={[0.35, -0.4, -0.2]}
        position={[0, -0.8, -1.2]}
      >
        <meshPhysicalMaterial
          color="#2dd4bf"
          emissive="#7c3aed"
          emissiveIntensity={0.45}
          roughness={0.25}
          metalness={0.7}
          transmission={0.5}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// CAMERA CONTROLLER & MOUSE/SCROLL INTERACTION RIG
// ============================================================================
function SceneRig({
  mouseRef,
  scrollRef,
}: {
  mouseRef: React.MutableRefObject<{ x: number; y: number; targetX: number; targetY: number }>;
  scrollRef: React.MutableRefObject<{ y: number; speed: number }>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    // Smooth damp mouse position
    mouseRef.current.x = THREE.MathUtils.lerp(
      mouseRef.current.x,
      mouseRef.current.targetX,
      0.06
    );
    mouseRef.current.y = THREE.MathUtils.lerp(
      mouseRef.current.y,
      mouseRef.current.targetY,
      0.06
    );

    // Parallax camera tilt tracking mouse coordinates
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseRef.current.x * 0.9, 0.05);
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      mouseRef.current.y * 0.7 - scrollRef.current.y * 0.0006,
      0.05
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ============================================================================
// MAIN LIQUID ETHER BACKGROUND COMPONENT
// ============================================================================
export default function LiquidEtherBackground() {
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef({ y: 0, speed: 0 });
  const lastScrollY = useRef(0);

  useEffect(() => {
    // Passive cursor tracking on window (never interrupts or blocks clicks/scrolls)
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;

      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }

      // Normalized device coordinates (-1 to 1)
      const nx = (clientX / window.innerWidth) * 2 - 1;
      const ny = -(clientY / window.innerHeight) * 2 + 1;

      mouseRef.current.targetX = nx;
      mouseRef.current.targetY = ny;
    };

    // Passive scroll tracking
    const handleScroll = () => {
      const currentY = window.scrollY || window.pageYOffset;
      const delta = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      scrollRef.current.y = currentY;
      scrollRef.current.speed = THREE.MathUtils.clamp(delta, -40, 40);
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none"
      style={{ pointerEvents: "none" }}
    >
      {/* Ambient Radial Deep Sea Glow Underlay */}
      <div className="absolute inset-0 bg-[#030712] pointer-events-none" />
      <div className="absolute -top-32 left-1/4 w-[750px] h-[550px] bg-cyan-600/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-[700px] h-[600px] bg-purple-700/10 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[800px] h-[600px] bg-teal-600/10 blur-[170px] rounded-full pointer-events-none" />

      {/* WebGL 3D Ambient Ether & Deep-Sea Flow Canvas */}
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        className="w-full h-full pointer-events-none"
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.4} color="#0c4a6e" />
        <pointLight position={[5, 6, 4]} intensity={1.8} color="#00f0ff" distance={25} />
        <pointLight position={[-6, -4, -2]} intensity={1.4} color="#a855f7" distance={25} />
        <pointLight position={[0, 0, 6]} intensity={0.9} color="#2dd4bf" distance={20} />

        <SceneRig mouseRef={mouseRef} scrollRef={scrollRef} />
        <BioluminescentParticleFlow mouseRef={mouseRef} scrollRef={scrollRef} />
        <DeepSeaCreatureRibbons mouseRef={mouseRef} scrollRef={scrollRef} />
      </Canvas>
    </div>
  );
}
