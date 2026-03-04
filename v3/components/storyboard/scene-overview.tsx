"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import type { StoryboardScene, ShotSimulationState } from "@/lib/storyboard-types"
import { deriveShotStatus } from "@/lib/storyboard-utils"
import { ShotStatusDot } from "./shot-status-dot"
import { LegendItem } from "./legend-item"
import { CollapseButton } from "./scene-sidebar"

interface SceneOverviewProps {
  scene: StoryboardScene
  simulationByShot: Record<string, ShotSimulationState>
  durationByShot: Record<string, number>
  onShotSelect: (shotId: string) => void
  onBackToMovie: () => void
  isCollapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export function SceneOverview({
  scene,
  simulationByShot,
  durationByShot,
  onShotSelect,
  onBackToMovie,
  isCollapsed,
  onCollapsedChange,
}: SceneOverviewProps) {
  const totalDuration = scene.shots.reduce(
    (sum, s) => sum + (durationByShot[s.id] ?? s.duration),
    0
  )

  return (
    <motion.aside
      role="navigation"
      className="flex flex-col shrink-0 overflow-hidden font-sans"
      style={{ background: "#000000", borderRight: "1px solid #232323" }}
      initial={false}
      animate={{ width: isCollapsed ? 44 : 420 }}
      transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.7 }}
      aria-label={isCollapsed ? "Scene panel (collapsed)" : "Scene panel"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isCollapsed ? (
          <CollapsedScenePanel
            scene={scene}
            onExpand={() => onCollapsedChange(false)}
            onShotSelect={onShotSelect}
          />
        ) : (
          <ExpandedScenePanel
            scene={scene}
            simulationByShot={simulationByShot}
            durationByShot={durationByShot}
            totalDuration={totalDuration}
            onShotSelect={onShotSelect}
            onBackToMovie={onBackToMovie}
            onCollapse={() => onCollapsedChange(true)}
          />
        )}
      </AnimatePresence>
    </motion.aside>
  )
}

/* ── Collapsed ──────────────────────────── */

function CollapsedScenePanel({
  scene,
  onExpand,
  onShotSelect,
}: {
  scene: StoryboardScene
  onExpand: () => void
  onShotSelect: (shotId: string) => void
}) {
  return (
    <motion.div
      key="collapsed-scene-panel"
      className="flex flex-col h-full items-center"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <button
        onClick={onExpand}
        className="flex items-center justify-center transition-colors duration-150"
        style={{ width: "44px", height: "40px", color: "#696969" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#696969")}
        aria-label="Expand scene panel"
      >
        <ChevronRight size={16} />
      </button>

      <div style={{ width: "20px", height: "1px", background: "#232323", marginBottom: "8px" }} />

      <div className="flex flex-col items-center gap-2 overflow-y-auto flex-1 py-1">
        {scene.shots.map((shot) => (
          <button
            key={shot.id}
            onClick={() => onShotSelect(shot.id)}
            className="flex items-center justify-center rounded shrink-0 transition-all duration-150"
            style={{
              width: "30px",
              height: "26px",
              fontSize: "9px",
              fontWeight: 600,
              background: "transparent",
              color: "#696969",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#11111188"
              e.currentTarget.style.color = "#D9D9D9"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "#696969"
            }}
            aria-label={`Shot ${shot.number}: ${shot.title}`}
            title={`Shot ${shot.number}: ${shot.title}`}
          >
            {shot.number}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

/* ── Expanded ───────────────────────────── */

function ExpandedScenePanel({
  scene,
  simulationByShot,
  durationByShot,
  totalDuration,
  onShotSelect,
  onBackToMovie,
  onCollapse,
}: {
  scene: StoryboardScene
  simulationByShot: Record<string, ShotSimulationState>
  durationByShot: Record<string, number>
  totalDuration: number
  onShotSelect: (shotId: string) => void
  onBackToMovie: () => void
  onCollapse: () => void
}) {
  return (
    <motion.div
      key="expanded-scene-panel"
      className="flex flex-col h-full overflow-y-auto"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {/* Back + title */}
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid #232323" }}>
        <div className="flex items-center justify-between mb-2">
          <button
            aria-label="Back to all scenes"
            className="transition-colors duration-150"
            style={{ fontSize: "11px", color: "#696969" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#696969")}
            onClick={onBackToMovie}
          >
            ← All Scenes
          </button>
          <CollapseButton onCollapse={onCollapse} />
        </div>
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
          const sim = simulationByShot[shot.id] ?? { frames: "idle", video: "idle", approved: false, voice: "idle", lipsync: "idle" }
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
    </motion.div>
  )
}
