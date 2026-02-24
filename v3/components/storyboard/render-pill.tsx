"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { RenderingShot } from "@/lib/storyboard-types"

interface RenderPillProps {
  shotNumber: number
  type: RenderingShot["type"]
  startedAt: number
  durationMs: number
  isComplete: boolean
  onClick: () => void
}

export function RenderPill({ shotNumber, type, startedAt, durationMs, isComplete, onClick }: RenderPillProps) {
  // Capture initial elapsed time to set correct starting width if remounted mid-generation
  const [initialElapsed] = useState(() => Math.max(0, Date.now() - startedAt))
  const label = `S${shotNumber} ${type === "frames" ? "Frames" : "Video"}`

  return (
    <motion.button
      type="button"
      onClick={onClick}
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
        textAlign: "left",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#696969"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#464646"
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
      <div style={{ height: "3px", background: "#464646", borderRadius: "2px", overflow: "hidden" }}>
        <motion.div
          initial={{ width: isComplete ? "100%" : `${Math.min(95, (initialElapsed / durationMs) * 95)}%` }}
          animate={{ width: isComplete ? "100%" : "95%" }}
          transition={{
            duration: isComplete ? 0.15 : Math.max(0, durationMs - initialElapsed) / 1000,
            ease: "linear",
          }}
          style={{
            height: "100%",
            background: "#D9D9D9",
            borderRadius: "2px",
          }}
        />
      </div>
    </motion.button>
  )
}
