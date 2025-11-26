"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

type Stage = "landing" | "main";
type WorldCanvasProps = { stage: Stage };
const WorldCanvas = dynamic<WorldCanvasProps>(() => import("./WorldCanvas.tsx"), {
  ssr: false,
});


export default function LandingExperience() {
  const [stage, setStage] = useState<Stage>("landing");
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Global cursor-none on body while in landing
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (stage === "landing") {
      document.body.classList.add("cursor-none");
    } else {
      document.body.classList.remove("cursor-none");
    }
    return () => {
      document.body.classList.remove("cursor-none");
    };
  }, [stage]);

  const handleProceed = () => {
    if (stage === "landing") {
      setStage("main");
    }
  };

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-transparent text-black"
      onMouseMove={(e) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
        if (!hasMoved) setHasMoved(true);
      }}
      onMouseDown={() => setIsMouseDown(true)}
      onMouseUp={() => setIsMouseDown(false)}
      onClick={handleProceed}
    >
      {/* 3D background */}
      <WorldCanvas stage={stage} />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/5" />

      {/* SECTION 1 – Index / top view */}
      {stage === "landing" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
            DIGITAL BRANDING / VISUAL LANGUAGE
          </p>
          <h1 className="mt-4 text-3xl md:text-5xl font-medium">
            Crafting brand identities
          </h1>
          <p className="mt-3 max-w-md text-xs md:text-sm text-neutral-400">
            Explore our portfolio of visual systems and brand experiences.
            Click to view our work.
          </p>
        </div>
      )}

      {/* SECTION 2 – Main look (UI placeholder for now) */}
      {stage === "main" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
            PORTFOLIO / VISUAL SYSTEMS
          </p>
        </div>
      )}

      {/* Custom cursor for landing stage */}
      <CustomCursor
        stage={stage}
        x={cursorPos.x}
        y={cursorPos.y}
        hasMoved={hasMoved}
        isMouseDown={isMouseDown}
      />
    </main>
  );
}

type CursorProps = {
  stage: Stage;
  x: number;
  y: number;
  hasMoved: boolean;
  isMouseDown: boolean;
};

function CustomCursor({ stage, x, y, hasMoved, isMouseDown }: CursorProps) {
  if (stage !== "landing" || !hasMoved) return null;

  const size = isMouseDown ? 96 : 120;

  return (
    <div
      className="pointer-events-none fixed z-30 flex items-center justify-center rounded-full border border-black/70 bg-white/5 text-[9px] md:text-[10px] font-medium uppercase tracking-[0.3em] backdrop-blur-md"
      style={{
        width: size,
        height: size,
        transform: `translate(${x - size / 2}px, ${y - size / 2}px)`,
        transition:
          "transform 0.12s ease-out, width 0.12s ease-out, height 0.12s ease-out, background 0.12s ease-out",
      }}
    >
      <span>Click to proceed</span>
    </div>
  );
}
