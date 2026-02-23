"use client"

import type { StoryboardScene, ShotSimulationState } from "@/lib/storyboard-types"
import { deriveShotStatus } from "@/lib/storyboard-utils"
import { ShotStatusDot } from "./shot-status-dot"

interface SceneOverviewProps {
  scene: StoryboardScene
  simulationByShot: Record<string, ShotSimulationState>
  durationByShot: Record<string, number>
  onShotSelect: (shotId: string) => void
  onBackToMovie: () => void
}

export function SceneOverview({
  scene,
  simulationByShot,
  durationByShot,
  onShotSelect,
  onBackToMovie,
}: SceneOverviewProps) {
  const totalDuration = scene.shots.reduce(
    (sum, s) => sum + (durationByShot[s.id] ?? s.duration),
    0
  )

  return (
    <div
      className="flex flex-col h-full overflow-y-auto font-sans"
      style={{
        background: "#000000",
        borderRight: "1px solid #232323",
        width: "420px",
        flexShrink: 0,
      }}
    >
      {/* Back + title */}
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid #232323" }}>
        <button
          className="transition-colors duration-150 mb-2"
          style={{ fontSize: "11px", color: "#696969", display: "block" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#696969")}
          onClick={onBackToMovie}
        >
          ← All Scenes
        </button>
        <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginBottom: "4px" }}>
          {scene.number}. {scene.title}
        </h2>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "11px", color: "#696969" }}>
            {scene.shots.length} shots &middot; {totalDuration}s total
          </span>
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

      {/* Shot breakdown */}
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
          Shots
        </span>

        {scene.shots.map((shot) => {
          const sim = simulationByShot[shot.id] ?? { frames: "idle", video: "idle" }
          const status = deriveShotStatus(sim)
          const duration = durationByShot[shot.id] ?? shot.duration
          const previewText = shot.action.slice(0, 60) + (shot.action.length > 60 ? "…" : "")
          return (
            <button
              key={shot.id}
              className="flex items-start gap-3 rounded-lg transition-colors duration-150 text-left px-3 py-2.5"
              style={{ background: "#111111", border: "1px solid #232323" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#232323")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#111111")}
              onClick={() => onShotSelect(shot.id)}
            >
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                <ShotStatusDot status={status} size="sm" />
                <span style={{ fontSize: "10px", color: "#696969", fontWeight: 600 }}>
                  {shot.number}
                </span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span
                  style={{ fontSize: "12px", color: "#D9D9D9", fontWeight: 500 }}
                  className="truncate"
                >
                  {shot.title}
                </span>
                {previewText && (
                  <span
                    style={{ fontSize: "11px", color: "#696969", lineHeight: 1.4, marginTop: "2px" }}
                  >
                    {previewText}
                  </span>
                )}
              </div>
              <span
                style={{ fontSize: "11px", color: "#696969", flexShrink: 0, paddingTop: "1px" }}
              >
                {duration}s
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

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
