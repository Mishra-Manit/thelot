"use client"

import type { StoryboardScene, ShotSimulationState } from "@/lib/storyboard-types"
import { deriveShotStatus, deriveSceneStatus } from "@/lib/storyboard-utils"
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
  const sceneStatus = deriveSceneStatus(scene.shots, simulationByShot)

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{
        background: "#000000",
        borderRight: "1px solid #232323",
        width: "340px",
        flexShrink: 0,
      }}
    >
      {/* Back + title */}
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid #1a1a1a" }}>
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
          <ShotStatusDot status={sceneStatus} size="sm" />
        </div>
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
              style={{ background: "#111111", border: "1px solid #1a1a1a" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#111111AA")}
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

      {/* Status legend */}
      <div className="px-4 py-2 flex items-center gap-4" style={{ borderTop: "1px solid #1a1a1a" }}>
        <LegendItem status="draft" label="No frames" />
        <LegendItem status="frames_ready" label="Frames ready" />
        <LegendItem status="video_ready" label="Video complete" />
      </div>

      {/* CTA card */}
      <div
        className="mx-4 mt-2 mb-4 rounded-lg px-4 py-3"
        style={{ border: "1px solid #386775", background: "#0d1e1e" }}
      >
        <span style={{ fontSize: "12px", color: "#597D7C" }}>
          Select a shot to start editing
        </span>
      </div>
    </div>
  )
}

function LegendItem({ status, label }: { status: "draft" | "frames_ready" | "video_ready"; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <ShotStatusDot status={status} size="sm" />
      <span style={{ fontSize: "10px", color: "#696969" }}>{label}</span>
    </div>
  )
}
