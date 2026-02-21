"use client"

import { Plus } from "lucide-react"
import type { Shot } from "@/lib/storyboard-data"

interface ShotTimelineProps {
  shots: Shot[]
  selectedShot: number | null
  sceneNumber: number
  onSelectShot: (shotId: number) => void
}

export function ShotTimeline({
  shots,
  selectedShot,
  sceneNumber,
  onSelectShot,
}: ShotTimelineProps) {
  const totalDuration = shots.reduce((s, sh) => s + sh.duration, 0)

  return (
    <div
      className="shrink-0"
      style={{
        background: "#0D0E14",
        borderTop: "1px solid #252933",
        padding: "12px 16px",
      }}
    >
      {/* Label row */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="shrink-0"
          style={{
            fontSize: "10px",
            color: "#404556",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Scene {sceneNumber} — Shot Timeline
        </span>
        <div
          className="flex-1"
          style={{ height: "1px", background: "#252933" }}
        />
        <span
          className="shrink-0"
          style={{
            fontSize: "10px",
            color: "#404556",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {shots.length} shots &middot; {totalDuration}s
        </span>
      </div>

      {/* Pill strip */}
      <div className="flex items-center gap-1">
        {shots.map((shot) => {
          const isSelected = selectedShot === shot.id
          return (
            <button
              key={shot.id}
              className="relative flex items-center justify-center overflow-hidden transition-all duration-150"
              style={{
                flex: shot.duration,
                minWidth: "50px",
                height: "44px",
                borderRadius: "20px",
                background: "#1A1C25",
                border: isSelected
                  ? "2px solid #404556"
                  : "2px solid transparent",
                boxShadow: isSelected ? "0 0 10px #40455644" : "none",
                opacity: isSelected ? 1 : 0.65,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.opacity = "0.9"
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.opacity = "0.65"
              }}
              onClick={() => onSelectShot(shot.id)}
            >
              {/* Gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to right, rgba(13,14,20,0.6), rgba(13,14,20,0.25))",
                }}
              />
              <span
                className="relative z-10"
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: isSelected ? "#404556" : "#777076",
                }}
              >
                {shot.number}
              </span>
            </button>
          )
        })}
        {/* Add shot button */}
        <button
          className="flex items-center justify-center shrink-0 transition-colors duration-150"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "20px",
            background: "#1A1C25",
            border: "1px dashed #404556",
            color: "#404556",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#2A2E3B")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#1A1C25")}
          aria-label="Add shot"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
