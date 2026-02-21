"use client"

import { Plus } from "lucide-react"
import type { StoryboardShot } from "@/lib/storyboard-types"

interface ShotTimelineProps {
  shots: StoryboardShot[]
  selectedShot: string | null
  sceneNumber: number
  onSelectShot: (shotId: string) => void
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
        background: "#000000",
        borderTop: "1px solid #232323",
        padding: "16px 20px",
      }}
    >
      {/* Label row */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="shrink-0"
          style={{
            fontSize: "10px",
            color: "#696969",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Scene {sceneNumber} — Shot Timeline
        </span>
        <div
          className="flex-1"
          style={{ height: "1px", background: "#232323" }}
        />
        <span
          className="shrink-0"
          style={{
            fontSize: "10px",
            color: "#696969",
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
                height: "60px",
                borderRadius: "20px",
                background: "#111111",
                border: isSelected
                  ? "2px solid #696969"
                  : "2px solid transparent",
                boxShadow: isSelected ? "0 0 10px #69696944" : "none",
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
                    "linear-gradient(to right, rgba(17,17,17,0.6), rgba(17,17,17,0.25))",
                }}
              />
              <span
                className="relative z-10"
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: isSelected ? "#FFFFFF" : "#D9D9D9",
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
            width: "60px",
            height: "60px",
            borderRadius: "20px",
            background: "#111111",
            border: "1px dashed #696969",
            color: "#696969",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#343434")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#111111")}
          aria-label="Add shot"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
