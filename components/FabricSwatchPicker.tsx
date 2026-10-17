"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  useFabricTheme,
  FABRIC_THEMES,
  FabricThemeKey,
} from "@/context/FabricThemeContext";

export default function FabricSwatchPicker() {
  const { currentTheme, setTheme, config } = useFabricTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const themesList = Object.values(FABRIC_THEMES);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Sleek 3D Fabric Swatch Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="group min-h-[44px] px-3.5 py-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-white/15 hover:border-cyan-400/50 backdrop-blur-xl flex items-center gap-2.5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer"
        title="Change 3D Woven Fabric Swatch & Lighting Theme"
      >
        {/* 3-Color Micro Fabric Swatch Dot */}
        <div className="w-4 h-4 rounded-full overflow-hidden flex shadow-sm border border-white/20 shrink-0">
          <div
            className="w-1/3 h-full"
            style={{ backgroundColor: config.previewColors[0] }}
          />
          <div
            className="w-1/3 h-full"
            style={{ backgroundColor: config.previewColors[1] }}
          />
          <div
            className="w-1/3 h-full"
            style={{ backgroundColor: config.previewColors[2] }}
          />
        </div>

        {/* Text Details */}
        <div className="text-left font-mono">
          <span className="text-[8px] text-slate-400 uppercase tracking-widest block leading-none">
            3D FABRIC SWATCH
          </span>
          <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1 mt-0.5 leading-none">
            <span>{config.icon}</span>
            <span className="truncate max-w-[110px] sm:max-w-none">
              {config.shortName}
            </span>
          </span>
        </div>

        {/* Chevron Indicator */}
        <span
          className={`text-[10px] text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-cyan-300" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Floating 3D Glass Swatch Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-2.5 w-72 sm:w-80 rounded-2xl bg-[#090b12]/95 border border-cyan-500/30 backdrop-blur-2xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(0,240,255,0.2)] z-50 animate-in fade-in slide-in-from-top-2 duration-200 font-mono"
        >
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
              3D TEXTILE LOOM SWATCHES
            </span>
            <span className="text-[9px] text-slate-500">4 REAL-TIME PRESETS</span>
          </div>

          <div className="mt-1.5 space-y-1">
            {themesList.map((item) => {
              const isSelected = currentTheme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTheme(item.id as FabricThemeKey);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-white/[0.08] border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                      : "hover:bg-white/[0.04] border border-transparent text-slate-300 hover:text-white"
                  }`}
                >
                  {/* Swatch Color Preview Pill */}
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex flex-col shadow border border-white/20 shrink-0 mt-0.5">
                    <div
                      className="w-full h-1/3"
                      style={{ backgroundColor: item.previewColors[0] }}
                    />
                    <div
                      className="w-full h-1/3"
                      style={{ backgroundColor: item.previewColors[1] }}
                    />
                    <div
                      className="w-full h-1/3"
                      style={{ backgroundColor: item.previewColors[2] }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{item.icon}</span>
                        <span className="truncate">{item.name}</span>
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-cyan-300 font-bold">
                          ACTIVE ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                      {item.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-white/5 px-2 text-[9px] text-slate-500 text-center">
            Dynamically shifts 3D WebGL cloth shaders, specular lighting &amp; yarn sheen
          </div>
        </div>
      )}
    </div>
  );
}
