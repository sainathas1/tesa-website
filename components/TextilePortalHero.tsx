"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginButton from "./LoginButton";

// ============================================================================
// REMOTE ASSETS FOR THE HERO PORTAL
// ============================================================================
const BASE = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P";

const ASSETS = {
  MARS_BG: `${BASE}/3c83091e-4046-4fd6-adbb-2edb728be79a.mp4`,
  TO_EARTH: `${BASE}/fc3ded42-e845-41f3-a830-5cab512d79cd.mp4`,
  TO_VENUS: `${BASE}/b30f64d9-1637-477a-83df-d0fc6461a422.mp4`,
  TO_MARS: `${BASE}/5fc5651c-3b5d-4171-b507-87f7e635d1b4.mp4`,
  MERCURY: `${BASE}/d6fb8b6b-c15e-4aaa-9cf7-45bbb5e33372.jpg`,
  LOGO: "/tesa-logo.png",
};

// ============================================================================
// DATA MODEL (WITH TEXTILE & EXTREME-GARMENT SPECS)
// ============================================================================
const ALL_PLANETS = [
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
] as const;

type PlanetKey = "mars" | "earth" | "venus";

interface PlanetConfig {
  name: string;
  next?: string;
  number?: string;
  portal?: string;
  image?: string;
  background: string;
  facts: [string, string][];
}

const STATES: Record<PlanetKey, PlanetConfig> = {
  mars: {
    name: "Mars",
    next: "Earth",
    number: "[03]",
    portal: ASSETS.TO_EARTH,
    background: "mars-background",
    facts: [
      ["Shell Weave:", "900D Basalt-Aramid Ripstop (3/1 Twill, 340 GSM) for dust-storm abrasion."],
      ["Thermal Rating:", "Aerogel-lined hollow-core fleece rated for -60 °C to -125 °C polar winters."],
      ["Conductive Yarn:", "Silver-plated warp threads at 228M km telemetry range (687-day cycle)."],
      ["Membrane Spec:", "Electrospun PTFE nanofiber barrier against 95% CO₂ atmospheric dust."],
    ],
  },
  earth: {
    name: "Earth",
    next: "Venus",
    number: "[02]",
    portal: ASSETS.TO_VENUS,
    background: "earth-background",
    facts: [
      ["Shell Weave:", "Organic Combed Cotton & Recycled Nylon Jacquard (210 GSM breathable weave)."],
      ["Thermal Rating:", "Phase-change micro-encapsulated knit balanced for 15 °C surface climate."],
      ["Yarn Count:", "Ne 40/2 ring-spun warp with hydrophobic lotus-finish weft (365.25-day wear)."],
      ["Membrane Spec:", "Biomimetic moisture-wicking matrix optimized for nitrogen-oxygen humidity."],
    ],
  },
  venus: {
    name: "Venus",
    next: "Mercury",
    number: "[06]",
    image: ASSETS.MERCURY,
    background: "venus-background",
    facts: [
      ["Shell Weave:", "Multi-axial Quartz & Carbon-PBI Preform (1200D high-tensile plain weave)."],
      ["Thermal Rating:", "Refractory ceramic-fiber outer coat engineered for 465 °C surface heat."],
      ["Seam Construction:", "Kevlar lockstitch with fluoropolymer-sealed selvedge (225-day orbital grade)."],
      ["Acid Shielding:", "Fluorocarbon laminated barrier resisting dense CO₂ & sulfuric acid clouds."],
    ],
  },
};

interface TextilePortalHeroProps {
  onOpenRegister?: () => void;
  onOpenVerifiedList?: () => void;
  onOpenContact?: () => void;
}

export default function TextilePortalHero({
  onOpenRegister,
  onOpenVerifiedList,
  onOpenContact,
}: TextilePortalHeroProps) {
  const [currentPlanet, setCurrentPlanet] = useState<PlanetKey>("mars");
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [preloaderPercent, setPreloaderPercent] = useState(0);
  const [isTraveling, setIsTraveling] = useState(false);
  const [isLogoDocked, setIsLogoDocked] = useState(false);
  const [isChromeVisible, setIsChromeVisible] = useState(false);
  const [showLoadingWeave, setShowLoadingWeave] = useState(false);

  // DOM Refs
  const experienceRef = useRef<HTMLElement>(null);
  const portalCanvasRef = useRef<HTMLCanvasElement>(null);
  const sceneCanvasRef = useRef<HTMLCanvasElement>(null);
  const preloaderVideoRef = useRef<HTMLVideoElement>(null);
  const marsBgRef = useRef<HTMLVideoElement>(null);
  const earthBgRef = useRef<HTMLVideoElement>(null);
  const venusBgRef = useRef<HTMLVideoElement>(null);
  const portalBtnRef = useRef<HTMLButtonElement>(null);
  const portalVideoRef = useRef<HTMLVideoElement>(null);
  const portalImageRef = useRef<HTMLImageElement>(null);
  const transitionVideoRef = useRef<HTMLVideoElement>(null);
  const customCursorRef = useRef<HTMLDivElement>(null);

  // 3D Canvas Math & Motion State
  const mouseRef = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });
  const expansionRef = useRef(0);
  const targetExpansionRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);

  // --------------------------------------------------------------------------
  // 1. PRELOADER & INITIALIZATION SEQUENCE
  // --------------------------------------------------------------------------
  useEffect(() => {
    const preloaderVideo = preloaderVideoRef.current;
    if (!preloaderVideo) return;

    let fallbackTimer: NodeJS.Timeout | null = null;

    const handleTimeUpdate = () => {
      const dur = preloaderVideo.duration || 3.2;
      const cur = preloaderVideo.currentTime;
      const progress = Math.min(100, Math.floor((cur / dur) * 100));
      setPreloaderPercent(progress);
    };

    const finishPreloader = () => {
      setPreloaderPercent(100);
      setTimeout(() => {
        setIsPreloaded(true);
        setIsLogoDocked(true);
        setTimeout(() => {
          setIsChromeVisible(true);
          // Start initial background video (Mars)
          if (marsBgRef.current) {
            marsBgRef.current.play().catch(() => {});
          }
          if (portalVideoRef.current) {
            portalVideoRef.current.play().catch(() => {});
          }
        }, 350);
      }, 300);
    };

    preloaderVideo.addEventListener("timeupdate", handleTimeUpdate);
    preloaderVideo.addEventListener("ended", finishPreloader);

    fallbackTimer = setTimeout(finishPreloader, 3600);

    preloaderVideo
      .play()
      .then(() => {})
      .catch(() => {
        // Autoplay policy fallback: advance preloader smoothly
        let count = 0;
        const interval = setInterval(() => {
          count += 5;
          setPreloaderPercent(Math.min(100, count));
          if (count >= 100) {
            clearInterval(interval);
            finishPreloader();
          }
        }, 50);
      });

    return () => {
      preloaderVideo.removeEventListener("timeupdate", handleTimeUpdate);
      preloaderVideo.removeEventListener("ended", finishPreloader);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  // --------------------------------------------------------------------------
  // 2. MOUSE TRACKING & CUSTOM WEAVE CURSOR
  // --------------------------------------------------------------------------
  useEffect(() => {
    const exp = experienceRef.current;
    const cursor = customCursorRef.current;
    if (!exp) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = exp.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Normalized coordinates (-1 to 1) for 3D rotation tilt
      mouseRef.current.targetX = (x / rect.width) * 2 - 1;
      mouseRef.current.targetY = (y / rect.height) * 2 - 1;

      // Update custom cursor
      if (cursor) {
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        cursor.classList.add("is-visible");
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
      if (cursor) cursor.classList.remove("is-visible");
    };

    exp.addEventListener("mousemove", handleMouseMove);
    exp.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      exp.removeEventListener("mousemove", handleMouseMove);
      exp.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // --------------------------------------------------------------------------
  // 3. 3D PROJECTED PORTAL CANVAS ENGINE WITH LOCKSTITCHED SEAM
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = portalCanvasRef.current;
    const expEl = experienceRef.current;
    const portalEl = portalBtnRef.current;
    if (!canvas || !expEl || !portalEl) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Helper: 3D point projection
    const projectPoint = (
      x: number,
      y: number,
      z: number,
      rx: number,
      ry: number,
      cx: number,
      cy: number,
      focal: number
    ) => {
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const scale = focal / (focal + z2);
      return {
        x: cx + x1 * scale,
        y: cy + y1 * scale,
        scale,
      };
    };

    // Helper: Generate 44 rounded-rectangle perimeter points
    const buildRoundedRectPoints = (w: number, h: number, r: number, numPerCorner = 11) => {
      const pts: { x: number; y: number }[] = [];
      const cr = Math.max(0, Math.min(r, w / 2, h / 2));
      const corners = [
        { cx: w / 2 - cr, cy: -h / 2 + cr, startAngle: -Math.PI / 2 },
        { cx: w / 2 - cr, cy: h / 2 - cr, startAngle: 0 },
        { cx: -w / 2 + cr, cy: h / 2 - cr, startAngle: Math.PI / 2 },
        { cx: -w / 2 + cr, cy: -h / 2 + cr, startAngle: Math.PI },
      ];

      for (let c = 0; c < 4; c++) {
        const { cx, cy, startAngle } = corners[c];
        for (let i = 0; i < numPerCorner; i++) {
          const theta = startAngle + (i / (numPerCorner - 1)) * (Math.PI / 2);
          pts.push({
            x: cx + cr * Math.cos(theta),
            y: cy + cr * Math.sin(theta),
          });
        }
      }
      return pts;
    };

    // Helper: Draw image/video cover into projected bounds
    const drawCover = (
      context: CanvasRenderingContext2D,
      source: HTMLVideoElement | HTMLImageElement,
      cx: number,
      cy: number,
      w: number,
      h: number
    ) => {
      const sWidth = "videoWidth" in source ? source.videoWidth : source.naturalWidth || 600;
      const sHeight = "videoHeight" in source ? source.videoHeight : source.naturalHeight || 800;
      if (!sWidth || !sHeight) return;

      const scale = Math.max(w / sWidth, h / sHeight);
      const drawW = sWidth * scale;
      const drawH = sHeight * scale;
      const drawX = cx - drawW / 2;
      const drawY = cy - drawH / 2;

      context.drawImage(source, drawX, drawY, drawW, drawH);
    };

    // Main animation loop
    const render = () => {
      const expRect = expEl.getBoundingClientRect();
      const rect = portalEl.getBoundingClientRect();

      // Relative coordinates locked to .experience
      const rectCx = rect.left - expRect.left + rect.width / 2;
      const rectCy = rect.top - expRect.top + rect.height / 2;
      const W = expRect.width;
      const H = expRect.height;

      // Handle retina resolution
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // Smooth motion damping
      const mouse = mouseRef.current;
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.08;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.08;

      // Lerp expansion factor
      expansionRef.current += (targetExpansionRef.current - expansionRef.current) * 0.12;
      const expansion = expansionRef.current;

      let rotX = mouse.currentY * 0.18;
      let rotY = mouse.currentX * -0.22;
      rotX *= 1 - expansion;
      rotY *= 1 - expansion;

      // Interpolate portal dimensions during expansion travel
      const targetW = W * 2.5;
      const targetH = H * 2.5;
      const curW = rect.width + (targetW - rect.width) * expansion;
      const curH = rect.height + (targetH - rect.height) * expansion;
      const curR = Math.max(0, (1 - expansion) * 28);
      const curCx = rectCx + (W / 2 - rectCx) * expansion;
      const curCy = rectCy + (H / 2 - rectCy) * expansion;

      const focal = 850;

      // 1. Build & Project Outer Rounded-Rect Points
      const outerLocalPts = buildRoundedRectPoints(curW, curH, curR, 11);
      const outerProjPts = outerLocalPts.map((p) =>
        projectPoint(p.x, p.y, 0, rotX, rotY, curCx, curCy, focal)
      );

      // 2. Clip and draw Swatch Cover Image or Video
      if (outerProjPts.length > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(outerProjPts[0].x, outerProjPts[0].y);
        for (let i = 1; i < outerProjPts.length; i++) {
          ctx.lineTo(outerProjPts[i].x, outerProjPts[i].y);
        }
        ctx.closePath();
        ctx.clip();

        // Solid obsidian backing
        ctx.fillStyle = "#030303";
        ctx.fill();

        // Draw active video or image inside swatch
        const activeMedia =
          currentPlanet === "venus"
            ? portalImageRef.current
            : portalVideoRef.current;

        if (activeMedia) {
          drawCover(ctx, activeMedia, curCx, curCy, curW * 1.05, curH * 1.05);
        }

        // Inner textile sheen gradient
        const sheen = ctx.createLinearGradient(
          curCx - curW / 2,
          curCy - curH / 2,
          curCx + curW / 2,
          curCy + curH / 2
        );
        sheen.addColorStop(0, "rgba(255, 255, 255, 0.12)");
        sheen.addColorStop(0.4, "transparent");
        sheen.addColorStop(1, "rgba(0, 0, 0, 0.45)");
        ctx.fillStyle = sheen;
        ctx.fill();

        ctx.restore();
      }

      // 3. 3D Lockstitched Fabric Seam (outer edge + inner dashed stitch)
      if (expansion < 0.98 && outerProjPts.length > 0) {
        // Outer solid selvedge line
        ctx.beginPath();
        ctx.moveTo(outerProjPts[0].x, outerProjPts[0].y);
        for (let i = 1; i < outerProjPts.length; i++) {
          ctx.lineTo(outerProjPts[i].x, outerProjPts[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.stroke();

        // Inner dashed lockstitch seam line (7px stitch, 5px space)
        const insetW = Math.max(10, curW - 14);
        const insetH = Math.max(10, curH - 14);
        const insetR = Math.max(0, curR - 7);
        const insetLocalPts = buildRoundedRectPoints(insetW, insetH, insetR, 11);
        const insetProjPts = insetLocalPts.map((p) =>
          projectPoint(p.x, p.y, 0, rotX, rotY, curCx, curCy, focal)
        );

        if (insetProjPts.length > 0) {
          ctx.beginPath();
          ctx.moveTo(insetProjPts[0].x, insetProjPts[0].y);
          for (let i = 1; i < insetProjPts.length; i++) {
            ctx.lineTo(insetProjPts[i].x, insetProjPts[i].y);
          }
          ctx.closePath();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
          ctx.lineWidth = 1.25;
          ctx.setLineDash([7, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [currentPlanet]);

  // --------------------------------------------------------------------------
  // 4. PLANET JUMPING TRAVEL SEQUENCE (MARS -> EARTH -> VENUS)
  // --------------------------------------------------------------------------
  const travel = useCallback(() => {
    if (isTraveling) return;
    const currConfig = STATES[currentPlanet];
    if (!currConfig.next || !currConfig.portal) return; // Terminal at Venus

    setIsTraveling(true);
    setShowLoadingWeave(true);

    const nextPlanetKey = currConfig.next.toLowerCase() as PlanetKey;
    const transVideo = transitionVideoRef.current;
    const sceneCanvas = sceneCanvasRef.current;
    const expEl = experienceRef.current;

    // Trigger 3D portal expansion
    targetExpansionRef.current = 1;

    if (transVideo) {
      transVideo.src = currConfig.portal;
      transVideo.playbackRate = 1.3;
      transVideo.currentTime = 0;
      transVideo
        .play()
        .then(() => {
          transVideo.parentElement?.classList.add("is-active");
        })
        .catch(() => {});

      const handleTransEnded = () => {
        transVideo.removeEventListener("ended", handleTransEnded);

        // Freeze last frame to sceneCanvas
        if (sceneCanvas && expEl) {
          const sCtx = sceneCanvas.getContext("2d");
          if (sCtx) {
            sceneCanvas.width = expEl.clientWidth;
            sceneCanvas.height = expEl.clientHeight;
            sCtx.drawImage(transVideo, 0, 0, sceneCanvas.width, sceneCanvas.height);
            sceneCanvas.style.opacity = "1";
          }
        }

        // Hide transition layer
        transVideo.parentElement?.classList.remove("is-active");

        // Switch active background video
        if (marsBgRef.current) marsBgRef.current.classList.remove("is-visible");
        if (earthBgRef.current) earthBgRef.current.classList.remove("is-visible");
        if (venusBgRef.current) venusBgRef.current.classList.remove("is-visible");

        if (nextPlanetKey === "earth" && earthBgRef.current) {
          earthBgRef.current.classList.add("is-visible");
          earthBgRef.current.play().catch(() => {});
        } else if (nextPlanetKey === "venus" && venusBgRef.current) {
          venusBgRef.current.classList.add("is-visible");
          venusBgRef.current.play().catch(() => {});
        }

        // Switch state
        setCurrentPlanet(nextPlanetKey);

        // Collapse portal back down
        targetExpansionRef.current = 0;

        // Fade out scene canvas smoothly
        setTimeout(() => {
          if (sceneCanvas) sceneCanvas.style.opacity = "0";
          setIsTraveling(false);
          setShowLoadingWeave(false);

          // Update portal video for next jump
          const nextNext = STATES[nextPlanetKey];
          if (portalVideoRef.current && nextNext.portal) {
            portalVideoRef.current.src = nextNext.portal;
            portalVideoRef.current.play().catch(() => {});
          }
        }, 400);
      };

      transVideo.addEventListener("ended", handleTransEnded);

      // Fallback timer in case video end event is missed
      setTimeout(() => {
        if (targetExpansionRef.current === 1) {
          handleTransEnded();
        }
      }, 3400);
    }
  }, [currentPlanet, isTraveling]);

  const curr = STATES[currentPlanet];

  return (
    <section
      className="experience"
      id="hero-experience"
      data-planet={currentPlanet}
      ref={experienceRef}
    >
      {/* =====================================================================
          1. BACKGROUND VIDEOS LAYER
          ===================================================================== */}
      <div className="backgrounds" aria-hidden="true">
        <video
          ref={marsBgRef}
          id="mars-background"
          className="background is-visible"
          src={ASSETS.MARS_BG}
          muted
          playsInline
          loop
          preload="auto"
        />
        <video
          ref={earthBgRef}
          id="earth-background"
          className="background"
          src={ASSETS.TO_EARTH}
          muted
          playsInline
          loop
          preload="auto"
        />
        <video
          ref={venusBgRef}
          id="venus-background"
          className="background"
          src={ASSETS.TO_VENUS}
          muted
          playsInline
          loop
          preload="auto"
        />
      </div>

      {/* =====================================================================
          2. PRELOADER SEQUENCE & PERCENT COUNTER
          ===================================================================== */}
      <div
        className={`preloader ${isPreloaded ? "is-hidden" : ""}`}
        id="preloader"
        aria-label="Loading Mars"
      >
        <video
          ref={preloaderVideoRef}
          id="preloader-video"
          src={ASSETS.TO_MARS}
          muted
          playsInline
          preload="auto"
        />
        <div className="preloader-shade" />
      </div>

      {/* Center Floating Logo -> Docks to Header at top-left branding slot */}
      <Image
        id="floating-logo"
        className={`floating-logo ${isLogoDocked ? "is-docked" : ""}`}
        src={ASSETS.LOGO}
        alt="TESA SGGSIE&T Crest"
        width={72}
        height={72}
        priority
        onClick={() => {
          if (isLogoDocked) {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      />

      <div
        className={`preloader-count ${isPreloaded ? "is-hidden" : ""}`}
        id="preloader-count"
        aria-live="polite"
      >
        <span id="preloader-value">{preloaderPercent}</span>
        <span className="percent">%</span>
      </div>

      {/* =====================================================================
          3. SCENE FREEZE CANVAS & WOVEN TEXTURE SHADE
          ===================================================================== */}
      <canvas id="scene-canvas" ref={sceneCanvasRef} className="scene-canvas" aria-hidden="true" />
      <div className="shade" aria-hidden="true" />

      {/* =====================================================================
          4. HEADER CHROME WITH DOCKED LOGO & NAVIGATION
          ===================================================================== */}
      <header className={`header chrome ${isChromeVisible ? "is-visible" : ""}`}>
        <div className="header-brand-slot">
          {isLogoDocked && (
            <a
              href="#hero-experience"
              className="header-brand-text hover:text-purple-300 transition-colors cursor-pointer"
            >
              TESA • SGGSIE&amp;T
            </a>
          )}
        </div>

        <div className="header-actions">
          <nav className="nav hidden md:flex" aria-label="Primary navigation">
            <a className="active" href="#hero-experience">
              Atelier
            </a>
            <a href="#events-section">Events</a>
            <a href="#verified-section">Verified List</a>
            <a href="#team-section">TESA Team</a>
          </nav>

          {/* Integrated Firebase Google Auth Pill */}
          <div className="scale-90 origin-right">
            <LoginButton />
          </div>

          {/* Contact Us Modal Launcher */}
          {onOpenContact && (
            <button
              type="button"
              onClick={onOpenContact}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/20 text-zinc-200 hover:text-white font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer"
            >
              <svg className="w-3 h-3 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Contact Us</span>
            </button>
          )}

          {/* Admin Direct Quicklink */}
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/20 text-purple-300 hover:text-white font-mono text-[10px] tracking-wider uppercase transition-all"
          >
            Admin Portal →
          </Link>

          {/* Explore Button */}
          <button
            className="menu"
            type="button"
            onClick={() =>
              document.getElementById("events-section")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore TESA ↓
          </button>
        </div>
      </header>

      {/* =====================================================================
          5. ASIDE: 8-PLANET ORBITAL TRACKER
          ===================================================================== */}
      <aside className={`planet-list chrome ${isChromeVisible ? "is-visible" : ""}`} aria-label="Planets">
        {ALL_PLANETS.map((planet) => {
          const isActive = planet.toLowerCase() === currentPlanet;
          return (
            <div
              key={planet}
              className={`planet-item ${isActive ? "is-active" : ""}`}
            >
              <span className="planet-pip" />
              <span>{planet}</span>
            </div>
          );
        })}
      </aside>

      {/* =====================================================================
          6. 3D PORTAL CANVAS & SWATCH BUTTON
          ===================================================================== */}
      <canvas
        id="portal-canvas"
        ref={portalCanvasRef}
        className="portal-canvas"
        aria-hidden="true"
      />

      <section
        className={`portal-wrap chrome ${isChromeVisible ? "is-visible" : ""}`}
        aria-label="Next destination"
      >
        <div className="portal-heading">
          <span>Next Swatch:</span>
          <span>
            <span id="next-number">{curr.number || "[--]"}</span>{" "}
            <strong id="next-name">{curr.next || "Terminal"}</strong>
          </span>
        </div>

        <button
          className="portal"
          id="portal"
          ref={portalBtnRef}
          type="button"
          onClick={travel}
          aria-label={`Travel to ${curr.next || "Next Specimen"}`}
        >
          <video
            id="portal-video"
            ref={portalVideoRef}
            src={curr.portal || ASSETS.TO_EARTH}
            muted
            playsInline
            loop
            preload="auto"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id="portal-image"
            ref={portalImageRef}
            src={ASSETS.MERCURY}
            alt="Mercury Swatch"
          />
        </button>
      </section>

      {/* =====================================================================
          7. PLANET CONTENT & GARMENT CARE-LABEL SPECIFICATIONS
          ===================================================================== */}
      <section
        className={`planet-content chrome ${isChromeVisible ? "is-visible" : ""}`}
        aria-live="polite"
      >
        <div>
          <div className="tesa-eyebrow">
            SGGSIE&amp;T NANDED • TEXTILE ENGINEERING STUDENTS&apos; ASSOCIATION
          </div>
          <h1 id="planet-title">{curr.name.toUpperCase()}</h1>
        </div>

        <dl id="facts">
          {curr.facts.map(([label, desc], fIdx) => (
            <div key={fIdx} className="fact-row">
              <dt>{label}</dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* =====================================================================
          8. TRAVEL TRANSITION LAYER & CUSTOM WEAVE CURSOR
          ===================================================================== */}
      <div className="transition-layer" aria-hidden="true">
        <video
          id="transition-video"
          ref={transitionVideoRef}
          muted
          playsInline
          preload="auto"
        />
      </div>

      <div
        className={`loading ${showLoadingWeave ? "is-visible" : ""}`}
        aria-hidden="true"
      >
        Weaving warp &amp; weft…
      </div>

      <div
        className="custom-cursor hidden md:block"
        id="custom-cursor"
        ref={customCursorRef}
        aria-hidden="true"
      >
        <span className="cursor-orbit" />
        <span className="cursor-dot" />
        <span className="cursor-label">Weave</span>
      </div>
    </section>
  );
}
