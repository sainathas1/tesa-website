"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type FabricThemeKey =
  | "royal-silk"
  | "pearl-jacquard"
  | "indigo-denim"
  | "carbon-basalt";

export interface FabricThemeConfig {
  id: FabricThemeKey;
  name: string;
  shortName: string;
  tagline: string;
  icon: string;
  previewColors: [string, string, string];
  // 3D Cloth Physics & Material
  clothColor: string;
  clothEmissive: string;
  clothEmissiveIntensity: number;
  wireframeColor: string;
  wireframeOpacity: number;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  sheenColor: string;
  sheenRoughness: number;
  iridescence: number;
  // 3D Interlacing Yarn Tubes
  yarnColors: string[];
  // 3D Torus Knot / Spool
  spoolColor: string;
  spoolEmissive: string;
  spoolMetalness: number;
  spoolRoughness: number;
  // 3D Lighting & Atmosphere
  ambientColor: string;
  ambientIntensity: number;
  keyLightColor: string;
  keyLightIntensity: number;
  rimLightColor: string;
  fillLightColor: string;
  fogColor: string;
  // UI Theme Tokens
  accentColorHex: string;
  accentSecondaryHex: string;
  badgeBorderClass: string;
  badgeTextClass: string;
  heroGradientClass: string;
  cardGlow: string;
}

export const FABRIC_THEMES: Record<FabricThemeKey, FabricThemeConfig> = {
  "royal-silk": {
    id: "royal-silk",
    name: "Royal Silk & Gold Zari",
    shortName: "Royal Silk",
    tagline: "Deep Obsidian Silk • Handcrafted Metallic Gold Zari Weave",
    icon: "👑",
    previewColors: ["#450a18", "#f59e0b", "#fef3c7"],
    clothColor: "#22040b",
    clothEmissive: "#450a18",
    clothEmissiveIntensity: 0.38,
    wireframeColor: "#f59e0b",
    wireframeOpacity: 0.38,
    roughness: 0.22,
    metalness: 0.72,
    clearcoat: 1.0,
    clearcoatRoughness: 0.12,
    sheenColor: "#fde68a",
    sheenRoughness: 0.25,
    iridescence: 0.55,
    yarnColors: ["#f59e0b", "#fbbf24", "#d97706", "#fef3c7", "#fef08a", "#b45309"],
    spoolColor: "#f59e0b",
    spoolEmissive: "#78350f",
    spoolMetalness: 0.95,
    spoolRoughness: 0.18,
    ambientColor: "#fffbeb",
    ambientIntensity: 0.65,
    keyLightColor: "#fff7ed",
    keyLightIntensity: 2.2,
    rimLightColor: "#f59e0b",
    fillLightColor: "#991b1b",
    fogColor: "#050204",
    accentColorHex: "#f59e0b",
    accentSecondaryHex: "#fbbf24",
    badgeBorderClass: "border-amber-500/40 bg-amber-950/40 text-amber-300",
    badgeTextClass: "text-amber-400",
    heroGradientClass: "from-amber-400 via-orange-300 to-amber-500",
    cardGlow: "rgba(245, 158, 11, 0.25)",
  },
  "pearl-jacquard": {
    id: "pearl-jacquard",
    name: "Pearl Studio Jacquard",
    shortName: "Pearl Jacquard",
    tagline: "Architectural Woven Linen • Cobalt Blue Structural Filaments",
    icon: "🪡",
    previewColors: ["#e2e8f0", "#3b82f6", "#1d4ed8"],
    clothColor: "#cbd5e1",
    clothEmissive: "#1e293b",
    clothEmissiveIntensity: 0.25,
    wireframeColor: "#2563eb",
    wireframeOpacity: 0.42,
    roughness: 0.35,
    metalness: 0.25,
    clearcoat: 0.9,
    clearcoatRoughness: 0.18,
    sheenColor: "#60a5fa",
    sheenRoughness: 0.35,
    iridescence: 0.3,
    yarnColors: ["#2563eb", "#3b82f6", "#60a5fa", "#e2e8f0", "#93c5fd", "#1d4ed8"],
    spoolColor: "#60a5fa",
    spoolEmissive: "#1e3a8a",
    spoolMetalness: 0.75,
    spoolRoughness: 0.25,
    ambientColor: "#f8fafc",
    ambientIntensity: 0.85,
    keyLightColor: "#ffffff",
    keyLightIntensity: 2.4,
    rimLightColor: "#3b82f6",
    fillLightColor: "#1e40af",
    fogColor: "#040711",
    accentColorHex: "#3b82f6",
    accentSecondaryHex: "#60a5fa",
    badgeBorderClass: "border-blue-500/40 bg-blue-950/40 text-blue-300",
    badgeTextClass: "text-blue-400",
    heroGradientClass: "from-sky-300 via-blue-400 to-indigo-400",
    cardGlow: "rgba(59, 130, 246, 0.25)",
  },
  "indigo-denim": {
    id: "indigo-denim",
    name: "Indigo Denim & Cyan Loom",
    shortName: "Indigo Denim",
    tagline: "Rich Indigo Twill • Glowing Electric Cyan Conductive Bus",
    icon: "🧵",
    previewColors: ["#0f172a", "#00f0ff", "#8b5cf6"],
    clothColor: "#090d16",
    clothEmissive: "#0f172a",
    clothEmissiveIntensity: 0.32,
    wireframeColor: "#00f0ff",
    wireframeOpacity: 0.45,
    roughness: 0.28,
    metalness: 0.65,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    sheenColor: "#38bdf8",
    sheenRoughness: 0.2,
    iridescence: 0.65,
    yarnColors: ["#00f0ff", "#38bdf8", "#818cf8", "#c084fc", "#06b6d4", "#a855f7"],
    spoolColor: "#00f0ff",
    spoolEmissive: "#083344",
    spoolMetalness: 0.9,
    spoolRoughness: 0.15,
    ambientColor: "#e0f2fe",
    ambientIntensity: 0.7,
    keyLightColor: "#ffffff",
    keyLightIntensity: 2.2,
    rimLightColor: "#00f0ff",
    fillLightColor: "#7c3aed",
    fogColor: "#03060c",
    accentColorHex: "#00f0ff",
    accentSecondaryHex: "#38bdf8",
    badgeBorderClass: "border-cyan-500/40 bg-cyan-950/40 text-cyan-300",
    badgeTextClass: "text-cyan-400",
    heroGradientClass: "from-cyan-400 via-teal-300 to-purple-400",
    cardGlow: "rgba(0, 240, 255, 0.25)",
  },
  "carbon-basalt": {
    id: "carbon-basalt",
    name: "Carbon & Basalt Preform",
    shortName: "Carbon & Basalt",
    tagline: "Aerospace Gunmetal Matrix • Emerald & Copper High-Modulus Tow",
    icon: "⚡",
    previewColors: ["#18181b", "#10b981", "#d97706"],
    clothColor: "#0c0d10",
    clothEmissive: "#022c22",
    clothEmissiveIntensity: 0.3,
    wireframeColor: "#10b981",
    wireframeOpacity: 0.45,
    roughness: 0.3,
    metalness: 0.85,
    clearcoat: 1.0,
    clearcoatRoughness: 0.14,
    sheenColor: "#34d399",
    sheenRoughness: 0.22,
    iridescence: 0.48,
    yarnColors: ["#10b981", "#34d399", "#d97706", "#f59e0b", "#059669", "#78350f"],
    spoolColor: "#10b981",
    spoolEmissive: "#064e3b",
    spoolMetalness: 0.92,
    spoolRoughness: 0.18,
    ambientColor: "#ecfdf5",
    ambientIntensity: 0.65,
    keyLightColor: "#f0fdf4",
    keyLightIntensity: 2.2,
    rimLightColor: "#10b981",
    fillLightColor: "#d97706",
    fogColor: "#030705",
    accentColorHex: "#10b981",
    accentSecondaryHex: "#34d399",
    badgeBorderClass: "border-emerald-500/40 bg-emerald-950/40 text-emerald-300",
    badgeTextClass: "text-emerald-400",
    heroGradientClass: "from-emerald-400 via-teal-300 to-amber-400",
    cardGlow: "rgba(16, 185, 129, 0.25)",
  },
};

interface FabricThemeContextValue {
  currentTheme: FabricThemeKey;
  setTheme: (key: FabricThemeKey) => void;
  config: FabricThemeConfig;
}

const FabricThemeContext = createContext<FabricThemeContextValue>({
  currentTheme: "royal-silk",
  setTheme: () => {},
  config: FABRIC_THEMES["royal-silk"],
});

export function FabricThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<FabricThemeKey>("royal-silk");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tesa_fabric_theme");
      if (saved && saved in FABRIC_THEMES) {
        setCurrentTheme(saved as FabricThemeKey);
      }
    } catch {}
  }, []);

  const setTheme = (key: FabricThemeKey) => {
    if (key in FABRIC_THEMES) {
      setCurrentTheme(key);
      try {
        localStorage.setItem("tesa_fabric_theme", key);
      } catch {}
    }
  };

  const config = FABRIC_THEMES[currentTheme];

  return (
    <FabricThemeContext.Provider value={{ currentTheme, setTheme, config }}>
      {children}
    </FabricThemeContext.Provider>
  );
}

export function useFabricTheme() {
  return useContext(FabricThemeContext);
}
