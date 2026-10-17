"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useFabricTheme, FabricThemeConfig } from "@/context/FabricThemeContext";

// ============================================================================
// 1. BILLOWING 3D CLOTH WITH DUAL-LAYER PHYSICAL & WIREFRAME WEAVE MESH
// ============================================================================

interface ClothProps {
  theme: FabricThemeConfig;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollRef: React.MutableRefObject<number>;
}

function BillowingClothMesh({ theme, pointerRef, scrollRef }: ClothProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeMeshRef = useRef<THREE.Mesh>(null);

  // High-density 3D plane (28 wide x 18 high with 120 x 120 subdivisions = 14,641 vertices)
  const sharedClothGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(28, 18, 120, 120);
    // Store original base positions for deformation math
    return geo;
  }, []);

  // Material instances
  const physicalMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.clothColor),
      emissive: new THREE.Color(theme.clothEmissive),
      emissiveIntensity: theme.clothEmissiveIntensity,
      roughness: theme.roughness,
      metalness: theme.metalness,
      clearcoat: theme.clearcoat,
      clearcoatRoughness: theme.clearcoatRoughness,
      sheen: 1.0,
      sheenColor: new THREE.Color(theme.sheenColor),
      sheenRoughness: theme.sheenRoughness,
      iridescence: theme.iridescence,
      iridescenceIOR: 1.45,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.94,
    });
  }, [theme]);

  const wireframeMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.wireframeColor),
      wireframe: true,
      transparent: true,
      opacity: theme.wireframeOpacity,
      depthTest: true,
    });
  }, [theme]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const ptr = pointerRef.current;
    const scroll = scrollRef.current;

    if (meshRef.current) {
      // Perspective tilting responsive to mouse and scroll
      meshRef.current.rotation.x = -0.62 + ptr.y * 0.12 - scroll * 0.18;
      meshRef.current.rotation.y = 0.14 + ptr.x * 0.15;
      meshRef.current.rotation.z = -0.06 + Math.sin(t * 0.22) * 0.03;
      meshRef.current.position.y = -1.2 + scroll * 2.0;

      // Animate every vertex along Z based on multi-harmonic tension & pointer proximity
      const pos = sharedClothGeometry.attributes.position;
      const count = pos.count;

      // Projected pointer target in local mesh coordinate units
      const targetX = ptr.x * 12.0;
      const targetY = ptr.y * 7.5;

      for (let i = 0; i < count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);

        // Layer 1: Warp tension sine wave
        const warpWave = Math.sin(u * 0.42 + t * 1.55) * 1.15;
        // Layer 2: Weft tension cosine wave
        const weftWave = Math.cos(v * 0.52 + t * 1.25) * 0.88;
        // Layer 3: Diagonal cross-twill shear tension
        const twillWave = Math.sin((u + v) * 0.32 + t * 0.85) * 0.55;
        // Layer 4: Micro-shearing fabric ripples
        const microRipple = Math.sin(u * 1.1 - v * 0.7 + t * 1.75) * 0.22;

        // Interactive mouse pointer displacement (physically ripples and pushes away)
        const dx = u - targetX;
        const dy = v - targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let pointerPush = 0;
        if (dist < 5.8) {
          const falloff = 1.0 - dist / 5.8;
          // Creates a kinetic wave that pushes the cloth away like pressing a fingertip on stretched silk
          pointerPush = Math.sin(dist * 2.4 - t * 4.2) * (falloff * falloff) * 1.85;
        }

        pos.setZ(i, warpWave + weftWave + twillWave + microRipple + pointerPush);
      }

      pos.needsUpdate = true;
      sharedClothGeometry.computeVertexNormals();
    }
  });

  return (
    <group position={[0, -1.2, -4.5]}>
      {/* Primary 3D Physical Woven Silk/Carbon Mesh */}
      <mesh ref={meshRef} geometry={sharedClothGeometry} material={physicalMat}>
        {/* Secondary Synchronized Wireframe Overlay (Shows individual moving threads) */}
        <mesh
          ref={wireframeMeshRef}
          geometry={sharedClothGeometry}
          material={wireframeMat}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// 2. 3D INTERLACING YARN STRANDS (WARP & WEFT TUBES WEAVING OVER AND UNDER)
// ============================================================================

interface YarnStrandsProps {
  theme: FabricThemeConfig;
  scrollRef: React.MutableRefObject<number>;
}

function InterlacingYarnStrands({ theme, scrollRef }: YarnStrandsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate 10 distinct 3D CatmullRom curves (5 Warp vertical, 5 Weft horizontal)
  // that authentically weave over and under each other
  const yarnCurves = useMemo(() => {
    const curves: { curve: THREE.CatmullRomCurve3; colorIndex: number; isWarp: boolean }[] = [];

    // 5 Warp Strands (Vertical, alternating Z crests and troughs)
    const warpXOffsets = [-8.5, -4.2, 0.0, 4.2, 8.5];
    warpXOffsets.forEach((xPos, idx) => {
      const points: THREE.Vector3[] = [];
      const numPoints = 14;
      for (let j = 0; j < numPoints; j++) {
        const yPos = 8.5 - (j / (numPoints - 1)) * 17.0;
        // Sinusoidal Z oscillation creates alternating over-and-under weave pattern
        const phase = idx * Math.PI * 0.4;
        const zPos = Math.sin((j / (numPoints - 1)) * Math.PI * 4.0 + phase) * 0.95;
        const xWander = xPos + Math.sin(j * 0.8 + idx) * 0.35;
        points.push(new THREE.Vector3(xWander, yPos, zPos));
      }
      curves.push({
        curve: new THREE.CatmullRomCurve3(points),
        colorIndex: idx,
        isWarp: true,
      });
    });

    // 5 Weft Strands (Horizontal, alternating opposite phase Z)
    const weftYOffsets = [6.0, 3.0, 0.0, -3.0, -6.0];
    weftYOffsets.forEach((yPos, idx) => {
      const points: THREE.Vector3[] = [];
      const numPoints = 16;
      for (let j = 0; j < numPoints; j++) {
        const xPos = -11.5 + (j / (numPoints - 1)) * 23.0;
        // Cosine Z oscillation complements the warp strands to weave under and over
        const phase = idx * Math.PI * 0.35;
        const zPos = Math.cos((j / (numPoints - 1)) * Math.PI * 4.0 + phase) * 0.95;
        const yWander = yPos + Math.cos(j * 0.8 + idx) * 0.35;
        points.push(new THREE.Vector3(xPos, yWander, zPos));
      }
      curves.push({
        curve: new THREE.CatmullRomCurve3(points),
        colorIndex: idx + 2,
        isWarp: false,
      });
    });

    return curves;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scroll = scrollRef.current;

    if (groupRef.current) {
      // Smooth continuous drift combined with scroll-linked parallax
      groupRef.current.position.y = -scroll * 4.5 + Math.sin(t * 0.35) * 0.2;
      groupRef.current.rotation.y = scroll * 0.35 + Math.sin(t * 0.2) * 0.05;
      groupRef.current.rotation.x = -scroll * 0.2 + Math.cos(t * 0.25) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -2.5]}>
      {yarnCurves.map((item, idx) => {
        const strandColor =
          theme.yarnColors[item.colorIndex % theme.yarnColors.length] ||
          theme.accentColorHex;

        return (
          <mesh key={idx}>
            <tubeGeometry args={[item.curve, 80, 0.085, 10, false]} />
            <meshStandardMaterial
              color={strandColor}
              emissive={strandColor}
              emissiveIntensity={0.28}
              metalness={0.88}
              roughness={0.22}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ============================================================================
// 3. 3D ROTATING SPOOL / FIBER TORUS KNOT (HERO INTERACTIVE SCULPTURE)
// ============================================================================

interface TorusKnotProps {
  theme: FabricThemeConfig;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
}

function FiberTorusKnot({ theme, pointerRef }: TorusKnotProps) {
  const knotRef = useRef<THREE.Mesh>(null);
  const wireKnotRef = useRef<THREE.Mesh>(null);

  // 3D woven torus knot representing a wound fiber spool / smart yarn knot
  const knotGeo = useMemo(() => {
    return new THREE.TorusKnotGeometry(1.8, 0.35, 200, 32, 3, 5);
  }, []);

  const knotMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.spoolColor),
      emissive: new THREE.Color(theme.spoolEmissive),
      emissiveIntensity: 0.38,
      metalness: theme.spoolMetalness,
      roughness: theme.spoolRoughness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      sheen: 1.0,
      sheenColor: new THREE.Color(theme.sheenColor),
      sheenRoughness: 0.25,
      iridescence: 0.6,
      iridescenceIOR: 1.5,
    });
  }, [theme]);

  const wireKnotMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.accentSecondaryHex),
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
  }, [theme]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const ptr = pointerRef.current;

    if (knotRef.current) {
      // Continuous slow rotation
      knotRef.current.rotation.x += 0.007;
      knotRef.current.rotation.y += 0.01;
      knotRef.current.rotation.z += 0.004;

      // Organic floating bobbing motion
      knotRef.current.position.y = 1.0 + Math.sin(t * 0.8) * 0.25;

      // Tilts and tracks smoothly towards the user's mouse pointer
      const targetTiltX = ptr.y * 0.55;
      const targetTiltY = ptr.x * 0.65;

      knotRef.current.position.x = 2.8 + targetTiltY * 0.5;
      knotRef.current.position.z = -1.0 + targetTiltX * 0.4;
    }
  });

  return (
    <group position={[2.8, 0.6, -1.0]}>
      {/* Solid High-Sheen Torus Knot */}
      <mesh ref={knotRef} geometry={knotGeo} material={knotMat}>
        {/* Wireframe Overlap showing thread geometry */}
        <mesh ref={wireKnotRef} geometry={knotGeo} material={wireKnotMat} />
      </mesh>
    </group>
  );
}

// ============================================================================
// 4. MAIN THREE.JS 3D SCENE ORCHESTRATION WITH REALISTIC LIGHTING
// ============================================================================

interface SceneContentProps {
  theme: FabricThemeConfig;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollRef: React.MutableRefObject<number>;
}

function SceneContent({ theme, pointerRef, scrollRef }: SceneContentProps) {
  return (
    <>
      {/* Atmospheric Depth Fog */}
      <fog attach="fog" args={[theme.fogColor, 12, 38]} />

      {/* Ambient Lighting tailored to fabric swatch */}
      <ambientLight color={theme.ambientColor} intensity={theme.ambientIntensity} />

      {/* Main Studio Key Light */}
      <directionalLight
        position={[4, 8, 8]}
        intensity={theme.keyLightIntensity}
        color={theme.keyLightColor}
      />

      {/* Rim Light 1 (Top Left): Accentuates silk folds and yarn sheen */}
      <pointLight
        position={[-9, 7, 5]}
        intensity={6.5}
        color={theme.rimLightColor}
        distance={22}
      />

      {/* Fill Light 2 (Bottom Right): Contrasting warm/cool undertones */}
      <pointLight
        position={[9, -6, 5]}
        intensity={5.5}
        color={theme.fillLightColor}
        distance={20}
      />

      {/* Center Subsurface Glow */}
      <pointLight
        position={[0, 0, -1]}
        intensity={2.8}
        color={theme.accentColorHex}
        distance={15}
      />

      {/* 1. Billowing 3D Woven Cloth Plane */}
      <BillowingClothMesh
        theme={theme}
        pointerRef={pointerRef}
        scrollRef={scrollRef}
      />

      {/* 2. Interlacing 3D Warp & Weft Yarn Tubes */}
      <InterlacingYarnStrands theme={theme} scrollRef={scrollRef} />

      {/* 3. Interactive Rotating Spool Torus Knot in Hero Area */}
      <FiberTorusKnot theme={theme} pointerRef={pointerRef} />
    </>
  );
}

// ============================================================================
// 5. EXPORTED CANVAS WRAPPER (FIXED TO FULL VIEWPORT, HIGH-FPS CLIENT ONLY)
// ============================================================================

export default function TextileCanvas3D() {
  const { config } = useFabricTheme();
  const [isClient, setIsClient] = useState(false);

  // Mutable refs for zero-latency 60+ FPS window mouse & scroll tracking
  const pointerRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);

  useEffect(() => {
    setIsClient(true);

    const onPointerMove = (e: PointerEvent) => {
      // Normalize to [-1, 1] across full window
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      scrollRef.current = window.scrollY / maxScroll;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!isClient) {
    // Return subtle dark placeholder during server SSR hydration
    return (
      <div
        className="fixed inset-0 z-0 bg-[#040509] pointer-events-none"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none transition-colors duration-700"
      style={{ backgroundColor: config.fogColor }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 48 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
        }}
        dpr={[1, 1.75]} // Cap DPR at 1.75 for crisp 3D rendering with high battery/GPU efficiency
        className="w-full h-full"
      >
        <SceneContent
          theme={config}
          pointerRef={pointerRef}
          scrollRef={scrollRef}
        />
      </Canvas>
    </div>
  );
}
