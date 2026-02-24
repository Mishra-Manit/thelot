"use client"

import { motion } from "framer-motion"
import type { RenderingShot } from "@/lib/storyboard-types"

type RenderPillProps = Omit<RenderingShot, "shotId">

export function RenderPill({ shotNumber, type, startedAt, durationMs }: RenderPillProps) {
  // Negative animation-delay starts the progress bar at the correct mid-stream position
  const elapsed = Date.now() - startedAt
  const label = `S${shotNumber} ${type === "frames" ? "Frames" : "Video"}`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      style={{
        background: "#111111",
        border: "1px solid #464646",
        borderRadius: "4px",
        padding: "4px 8px 4px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        overflow: "hidden",
        minWidth: "96px",
      }}
    >
      <span
        style={{
          color: "#D9D9D9",
          fontSize: "10px",
          lineHeight: "1",
          letterSpacing: "0.04em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {label}
      </span>
      {/* Progress track */}
      <div style={{ height: "3px", background: "#464646", borderRadius: "2px" }}>
        <div
          style={{
            height: "100%",
            background: "#D9D9D9",
            borderRadius: "2px",
            animationName: "render-progress",
            animationDuration: `${durationMs}ms`,
            animationTimingFunction: "linear",
            animationFillMode: "forwards",
            animationDelay: `-${elapsed}ms`,
          }}
        />
      </div>
    </motion.div>
  )
}
