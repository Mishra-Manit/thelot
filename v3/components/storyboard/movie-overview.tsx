"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { StoryboardScene, ShotSimulationState } from "@/lib/storyboard-types"
import { deriveSceneStatus, deriveSceneProgress, deriveMovieProgress } from "@/lib/storyboard-utils"
import { ShotStatusDot } from "./shot-status-dot"
import { Progress } from "@/components/ui/progress"

interface MovieOverviewProps {
  scenes: StoryboardScene[]
  simulationByShot: Record<string, ShotSimulationState>
  onSceneSelect: (sceneId: string) => void
  widthPct?: number
}

export function MovieOverview({ scenes, simulationByShot, onSceneSelect, widthPct = 28 }: MovieOverviewProps) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(true)

  const totalShots = scenes.reduce((sum, s) => sum + s.shots.length, 0)
  const movieProgress = Math.round(deriveMovieProgress(scenes, simulationByShot) * 100)

  return (
    <div
      className="flex flex-col h-full overflow-y-auto scrollbar-hide font-sans"
      style={{
        background: "#000000",
        width: `${widthPct}%`,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #1a1a1a" }}>
        {/* Title row */}
        <div className="flex items-baseline justify-between mb-3">
          <h1 style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff" }}>
            Your Movie
          </h1>
          <span style={{ fontSize: "11px", color: "#7A7A7A" }}>
            {scenes.length} scenes &middot; {totalShots} shots
          </span>
        </div>

        {/* Progress section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: "11px", color: "#7A7A7A", letterSpacing: "0.02em" }}>
              Overall progress
            </span>
            <span style={{ fontSize: "11px", color: "#D9D9D9", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              {movieProgress}%
            </span>
          </div>
          <Progress
            value={movieProgress}
            className="h-1.5"
            style={{ background: "#1a1a1a", border: "1px solid #232323" }}
            indicatorClassName="bg-[#D9D9D9]"
          />
        </div>
      </div>

      {/* Status legend */}
      <div
        className="px-4 py-4 flex items-center justify-center gap-6 flex-wrap"
        style={{ borderBottom: "1px solid #232323" }}
      >
        <LegendItem status="draft" label="No frames" size="md" />
        <LegendItem status="frames_ready" label="Frames ready" size="md" />
        <LegendItem status="video_ready" label="Video complete" size="md" />
      </div>

      {/* Scene Breakdown */}
      <div className="flex flex-col px-4 pt-4 pb-3 gap-2">
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "#696969",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Edit your specific scenes below
        </span>

        {scenes.map((scene) => {
          const status = deriveSceneStatus(scene.shots, simulationByShot)
          const progress = Math.round(deriveSceneProgress(scene.shots, simulationByShot) * 100)
          return (
            <button
              key={scene.id}
              className="flex items-center gap-3 rounded-lg transition-colors duration-150 text-left px-3 py-2.5"
              style={{ background: "#111111", border: "1px solid #232323" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#696969")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#232323")}
              onClick={() => onSceneSelect(scene.id)}
            >
              <ShotStatusDot status={status} size="md" />
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span style={{ fontSize: "12px", color: "#D9D9D9", fontWeight: 500 }} className="truncate">
                  {scene.title}
                </span>
                <span style={{ fontSize: "11px", color: "#696969", flexShrink: 0 }}>
                  · {scene.shots.length} shots{progress > 0 ? ` · ${progress}% complete` : ""}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* How It Works */}
      <div 
        className="mx-4 mb-4 mt-2 rounded-xl p-4 transition-colors group/card" 
        style={{ background: "#111111", border: "1px solid #232323" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#464646")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#232323")}
      >
        <button
          className="flex items-center justify-between w-full group"
          onClick={() => setHowItWorksOpen((o) => !o)}
        >
          <span
            className="transition-colors"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#D9D9D9",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            How It Works
          </span>
          {howItWorksOpen ? (
            <ChevronDown size={14} className="text-[#D9D9D9] group-hover:text-white group-hover/card:text-white transition-colors" />
          ) : (
            <ChevronRight size={14} className="text-[#D9D9D9] group-hover:text-white group-hover/card:text-white transition-colors" />
          )}
        </button>

        {howItWorksOpen && (
          <div className="flex flex-col gap-4 mt-4">
            {STEPS.map((step) => (
              <div key={step.number} className="flex items-start gap-3">
                <div 
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "20px",
                    height: "20px",
                    background: "#232323",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {step.number}
                </div>
                <div className="flex flex-col gap-0.5 pt-0.5">
                  <span style={{ fontSize: "13px", color: "#ffffff", fontWeight: 500 }}>
                    {step.title}
                  </span>
                  <span style={{ fontSize: "12px", color: "#D9D9D9", lineHeight: 1.4 }}>
                    {step.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const STEPS = [
  {
    number: "1",
    title: "Script",
    description: "Write and refine your shot descriptions",
  },
  {
    number: "2",
    title: "Frames",
    description: "Generate start and end frames for each shot",
  },
  {
    number: "3",
    title: "Video",
    description: "Animate between frames to create clips",
  },
  {
    number: "4",
    title: "Polish",
    description: "Add voiceover and lip sync",
  },
]

function LegendItem({
  status,
  label,
  size,
}: {
  status: "draft" | "frames_ready" | "video_ready"
  label: string
  size: "sm" | "md"
}) {
  return (
    <div className="flex items-center justify-center gap-2 text-center">
      <ShotStatusDot status={status} size={size} />
      <span style={{ fontSize: "12px", color: "#D9D9D9", fontWeight: 500 }}>{label}</span>
    </div>
  )
}
