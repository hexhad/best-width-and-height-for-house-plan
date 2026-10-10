import { LiquidMetal, MeshGradient } from "@paper-design/shaders-react";
import { useReducedMotion } from "../hooks/useMedia.js";

const MESH = {
  light: ["#e7ebee", "#dde3e8", "#efd8cb", "#e9edf0"],
  dark: ["#0e1114", "#151a1f", "#33201a", "#11161a"],
};

/**
 * A slow mesh gradient behind the whole page, so the glass panels have
 * something to refract. Fixed and pointer-transparent; stills under reduced motion.
 */
export function Backdrop({ theme }) {
  const reduce = useReducedMotion();
  return (
    <div className="backdrop" aria-hidden="true">
      <MeshGradient
        colors={MESH[theme]}
        distortion={0.7}
        swirl={0.15}
        grainMixer={0}
        grainOverlay={theme === "dark" ? 0.12 : 0.08}
        speed={reduce ? 0 : 0.12}
        maxPixelCount={1280 * 800}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

/** The house mark, rendered as liquid metal tinted with the accent (paper-design liquid-logo shader). */
export function LiquidMark({ theme, size = 34 }) {
  const reduce = useReducedMotion();
  return (
    <span className="mark" style={{ width: size, height: size }} aria-hidden="true">
      <LiquidMetal
        image={`${import.meta.env.BASE_URL}mark.svg`}
        colorBack="#00000000"
        colorTint={theme === "dark" ? "#e27a50" : "#b9502a"}
        repetition={2}
        softness={0.1}
        shiftRed={0.25}
        shiftBlue={0.25}
        distortion={0.08}
        contour={0.4}
        angle={70}
        scale={1}
        speed={reduce ? 0 : 0.6}
        style={{ width: size, height: size }}
      />
    </span>
  );
}
