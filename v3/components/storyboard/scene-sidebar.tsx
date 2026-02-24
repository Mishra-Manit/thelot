"use client"

import { ChevronLeft, ChevronRight, Layers, Clapperboard } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import type { StoryboardScene, EditingLevel, ShotSimulationState } from "@/lib/storyboard-types"
import { deriveShotStatus, deriveSceneStatus } from "@/lib/storyboard-utils"
import { ShotStatusDot } from "./shot-status-dot"

interface SceneSidebarProps {
  scenes: StoryboardScene[]
  editingLevel: EditingLevel
  selectedSceneId: string | null
  selectedShotId: string | null
  simulationByShot: Record<string, ShotSimulationState>
  isCollapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  onSceneSelect: (sceneId: string) => void
  onShotSelect: (shotId: string) => void
  onBackToMovie: () => void
  onBackToScene: () => void
}

export function SceneSidebar({
  scenes,
  editingLevel,
  selectedSceneId,
  selectedShotId,
  simulationByShot,
  isCollapsed,
  onCollapsedChange,
  onSceneSelect,
  onShotSelect,
  onBackToMovie,
  onBackToScene,
}: SceneSidebarProps) {
  const activeScene = scenes.find((s) => s.id === selectedSceneId)

  return (
    <motion.aside
      className="flex flex-col shrink-0 overflow-hidden font-sans"
      style={{ background: "#000000", borderRight: "1px solid #232323" }}
      initial={false}
      animate={{ width: isCollapsed ? 44 : 280 }}
      transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.7 }}
      role="navigation"
      aria-label={isCollapsed ? "Scene panel (collapsed)" : "Scene panel"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isCollapsed ? (
          <CollapsedPanel
            scenes={scenes}
            editingLevel={editingLevel}
            activeScene={activeScene}
            selectedShotId={selectedShotId}
            simulationByShot={simulationByShot}
            onExpand={() => onCollapsedChange(false)}
            onSceneSelect={onSceneSelect}
            onShotSelect={onShotSelect}
            onBackToMovie={onBackToMovie}
          />
        ) : (
          <ExpandedPanel
            scenes={scenes}
            editingLevel={editingLevel}
            activeScene={activeScene}
            selectedShotId={selectedShotId}
            simulationByShot={simulationByShot}
            onCollapse={() => onCollapsedChange(true)}
            onSceneSelect={onSceneSelect}
            onShotSelect={onShotSelect}
            onBackToMovie={onBackToMovie}
            onBackToScene={onBackToScene}
          />
        )}
      </AnimatePresence>
    </motion.aside>
  )
}

/* ── Collapsed ──────────────────────────── */

function CollapsedPanel({
  scenes,
  editingLevel,
  activeScene,
  selectedShotId,
  simulationByShot,
  onExpand,
  onSceneSelect,
  onShotSelect,
  onBackToMovie,
}: {
  scenes: StoryboardScene[]
  editingLevel: EditingLevel
  activeScene: StoryboardScene | undefined
  selectedShotId: string | null
  simulationByShot: Record<string, ShotSimulationState>
  onExpand: () => void
  onSceneSelect: (id: string) => void
  onShotSelect: (id: string) => void
  onBackToMovie: () => void
}) {
  return (
    <motion.div
      key="collapsed-panel"
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

      {editingLevel === "movie" ? (
        // Movie level: show scene number buttons
        <div className="flex flex-col items-center gap-2.5 overflow-y-auto flex-1 py-1">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => onSceneSelect(scene.id)}
              className="flex items-center justify-center rounded-md shrink-0 transition-colors duration-150"
              style={{
                width: "30px",
                height: "30px",
                fontSize: "10px",
                fontWeight: 600,
                background: "#111111",
                color: "#D9D9D9",
                border: "1px solid #232323",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#232323"
                e.currentTarget.style.color = "#ffffff"
                e.currentTarget.style.borderColor = "#7A7A7A"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#111111"
                e.currentTarget.style.color = "#D9D9D9"
                e.currentTarget.style.borderColor = "#232323"
              }}
              aria-label={`Scene ${scene.number}: ${scene.title}`}
              title={`Scene ${scene.number}: ${scene.title}`}
            >
              {scene.number}
            </button>
          ))}
        </div>
      ) : (
        // Scene or shot level: back arrow + shot list
        <div className="flex flex-col items-center gap-2 overflow-y-auto flex-1 py-1">
          <button
            onClick={onBackToMovie}
            className="flex items-center justify-center rounded shrink-0 transition-colors duration-150"
            style={{ width: "30px", height: "22px", color: "#696969" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#696969")}
            aria-label="Back to all scenes"
            title="All Scenes"
          >
            <Layers size={13} />
          </button>

          <div style={{ width: "20px", height: "1px", background: "#111111", margin: "2px 0" }} />

          {activeScene?.shots.map((shot) => {
            const isSelected = selectedShotId === shot.id
            return (
              <button
                key={shot.id}
                onClick={() => onShotSelect(shot.id)}
                className="flex items-center justify-center rounded shrink-0 transition-all duration-150"
                style={{
                  width: "30px",
                  height: "26px",
                  fontSize: "9px",
                  fontWeight: 600,
                  background: isSelected ? "#111111" : "transparent",
                  color: isSelected ? "#FFFFFF" : "#696969",
                  border: isSelected ? "1px solid #69696955" : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "#11111188"
                    e.currentTarget.style.color = "#D9D9D9"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = "#696969"
                  }
                }}
                aria-label={`Shot ${shot.number}: ${shot.title}`}
                title={`Shot ${shot.number}: ${shot.title}`}
              >
                {shot.number}
              </button>
            )
          })}
        </div>
      )}

      <div
        className="flex items-center justify-center"
        style={{ width: "44px", height: "36px", borderTop: "1px solid #111111" }}
      >
        <Clapperboard size={13} style={{ color: "#232323" }} />
      </div>
    </motion.div>
  )
}

/* ── Expanded ───────────────────────────── */

function ExpandedPanel({
  scenes,
  editingLevel,
  activeScene,
  selectedShotId,
  simulationByShot,
  onCollapse,
  onSceneSelect,
  onShotSelect,
  onBackToMovie,
  onBackToScene,
}: {
  scenes: StoryboardScene[]
  editingLevel: EditingLevel
  activeScene: StoryboardScene | undefined
  selectedShotId: string | null
  simulationByShot: Record<string, ShotSimulationState>
  onCollapse: () => void
  onSceneSelect: (id: string) => void
  onShotSelect: (id: string) => void
  onBackToMovie: () => void
  onBackToScene: () => void
}) {
  return (
    <motion.div
      key="expanded-panel"
      className="flex flex-col h-full"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {editingLevel === "movie" ? (
        <MovieSceneList
          scenes={scenes}
          simulationByShot={simulationByShot}
          onCollapse={onCollapse}
          onSceneSelect={onSceneSelect}
        />
      ) : editingLevel === "scene" && activeScene ? (
        <ShotList
          scene={activeScene}
          selectedShotId={selectedShotId}
          simulationByShot={simulationByShot}
          onCollapse={onCollapse}
          onShotSelect={onShotSelect}
          onBackToMovie={onBackToMovie}
        />
      ) : activeScene ? (
        // Shot level: same as scene but with back to scene button
        <ShotList
          scene={activeScene}
          selectedShotId={selectedShotId}
          simulationByShot={simulationByShot}
          onCollapse={onCollapse}
          onShotSelect={onShotSelect}
          onBackToMovie={onBackToScene}
          backLabel="← Scene"
        />
      ) : null}
    </motion.div>
  )
}

/* ── Movie-level scene list ──────────────── */

function MovieSceneList({
  scenes,
  simulationByShot,
  onCollapse,
  onSceneSelect,
}: {
  scenes: StoryboardScene[]
  simulationByShot: Record<string, ShotSimulationState>
  onCollapse: () => void
  onSceneSelect: (id: string) => void
}) {
  return (
    <>
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "#696969",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Scenes
        </span>
        <CollapseButton onCollapse={onCollapse} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-2 pb-3">
        {scenes.map((scene) => {
          const status = deriveSceneStatus(scene.shots, simulationByShot)
          return (
            <button
              key={scene.id}
              className="flex items-center gap-2 rounded-lg transition-colors duration-150 text-left px-3 py-2"
              style={{ background: "#111111" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#232323")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#111111")}
              onClick={() => onSceneSelect(scene.id)}
            >
              <ShotStatusDot status={status} size="sm" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span style={{ fontSize: "11px", color: "#D9D9D9" }} className="truncate">
                  {scene.number}. {scene.title}
                </span>
                <span style={{ fontSize: "11px", color: "#696969", flexShrink: 0 }}>
                  · {scene.shots.length} shots
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

/* ── Shot list (scene + shot levels) ───────── */

function ShotList({
  scene,
  selectedShotId,
  simulationByShot,
  onCollapse,
  onShotSelect,
  onBackToMovie,
  backLabel = "← All Scenes",
}: {
  scene: StoryboardScene
  selectedShotId: string | null
  simulationByShot: Record<string, ShotSimulationState>
  onCollapse: () => void
  onShotSelect: (id: string) => void
  onBackToMovie: () => void
  backLabel?: string
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <button
            className="transition-colors duration-150"
            style={{ fontSize: "11px", color: "#696969" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#696969")}
            onClick={onBackToMovie}
          >
            {backLabel}
          </button>
          <CollapseButton onCollapse={onCollapse} />
        </div>
        <span style={{ color: "#ffffff", fontSize: "12px" }}>
          {scene.number}. {scene.title}
        </span>
        <div style={{ borderTop: "1px solid #111111", marginTop: "4px" }} />
      </div>

      {/* Status legend */}
      <div
        className="px-2 py-3 flex items-center justify-center gap-2.5"
        style={{ borderBottom: "1px solid #111111" }}
      >
        <LegendItem status="draft" label="No frames" size="sm" />
        <LegendItem status="frames_ready" label="Frames ready" size="sm" />
        <LegendItem status="video_ready" label="Video complete" size="sm" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-1.5 py-3">
        {scene.shots.map((shot) => {
          const isSelected = selectedShotId === shot.id
          const sim = simulationByShot[shot.id] ?? { frames: "idle", video: "idle", approved: false, voice: "idle", lipsync: "idle" }
          const status = deriveShotStatus(sim)
          return (
            <button
              key={shot.id}
              className="flex items-center gap-2 rounded-md transition-colors duration-150 text-left px-2 py-2"
              style={{
                background: isSelected ? "#111111" : "transparent",
                border: isSelected ? "1px solid #232323" : "1px solid transparent",
                borderLeft: isSelected ? "3px solid #696969" : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = "#11111188"
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = "transparent"
              }}
              onClick={() => onShotSelect(shot.id)}
            >
              <ShotStatusDot status={status} size="sm" />
              <span
                style={{
                  fontSize: "11px",
                  color: isSelected ? "#ffffff" : "#D9D9D9",
                }}
              >
                <span style={{ color: isSelected ? "#FFFFFF" : "#696969", marginRight: "4px" }}>
                  {shot.number}.
                </span>
                {shot.title}
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
    <div className="flex items-center justify-center gap-1.5 text-center whitespace-nowrap">
      <ShotStatusDot status={status} size={size} />
      <span style={{ fontSize: "10px", color: "#D9D9D9", fontWeight: 500 }}>{label}</span>
    </div>
  )
}

/* ── Shared collapse button ─────────────── */

function CollapseButton({ onCollapse }: { onCollapse: () => void }) {
  return (
    <button
      onClick={onCollapse}
      className="flex items-center justify-center rounded transition-colors duration-150"
      style={{ width: "22px", height: "22px", color: "#696969" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#ffffff"
        e.currentTarget.style.background = "#232323"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#696969"
        e.currentTarget.style.background = "transparent"
      }}
      aria-label="Collapse scene panel"
    >
      <ChevronLeft size={14} />
    </button>
  )
}
