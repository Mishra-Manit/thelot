"use client"

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Film,
  Clock,
  Layers,
  Clapperboard,
} from "lucide-react"
import type { StoryboardScene } from "@/lib/storyboard-types"

interface SceneListProps {
  scenes: StoryboardScene[]
  selectedScene: string | null
  selectedShot: string | null
  collapsed: boolean
  onSelectScene: (sceneId: string) => void
  onSelectShot: (shotId: string) => void
  onBack: () => void
  onToggleCollapse: () => void
}

export function SceneList({
  scenes,
  selectedScene,
  selectedShot,
  collapsed,
  onSelectScene,
  onSelectShot,
  onBack,
  onToggleCollapse,
}: SceneListProps) {
  const activeScene = scenes.find((s) => s.id === selectedScene)

  /* ── Collapsed rail ────────────────────── */
  if (collapsed) {
    return (
      <aside
        className="flex flex-col shrink-0 items-center"
        style={{
          width: "44px",
          background: "#0D0E14",
          borderRight: "1px solid #252933",
          transition: "width 250ms cubic-bezier(0.4,0,0.2,1)",
        }}
        role="navigation"
        aria-label="Scene panel (collapsed)"
      >
        {/* Expand toggle */}
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center transition-colors duration-150"
          style={{
            width: "44px",
            height: "40px",
            color: "#404556",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#404556")}
          aria-label="Expand scene panel"
        >
          <ChevronRight size={16} />
        </button>

        <div
          style={{
            width: "20px",
            height: "1px",
            background: "#252933",
            marginBottom: "8px",
          }}
        />

        {/* Scene/shot icons */}
        {!activeScene ? (
          <div className="flex flex-col items-center gap-1.5 overflow-y-auto flex-1 py-1">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => onSelectScene(scene.id)}
                className="flex items-center justify-center rounded-md shrink-0 transition-colors duration-150"
                style={{
                  width: "30px",
                  height: "30px",
                  fontSize: "10px",
                  fontWeight: 600,
                  background: "#1A1C25",
                  color: "#777076",
                  border: "1px solid #252933",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#22252F"
                  e.currentTarget.style.color = "#ffffff"
                  e.currentTarget.style.borderColor = "#555B6E"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1A1C25"
                  e.currentTarget.style.color = "#777076"
                  e.currentTarget.style.borderColor = "#252933"
                }}
                aria-label={`Scene ${scene.number}: ${scene.title}`}
                title={`Scene ${scene.number}: ${scene.title}`}
              >
                {scene.number}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 overflow-y-auto flex-1 py-1">
            {/* Back icon */}
            <button
              onClick={onBack}
              className="flex items-center justify-center rounded shrink-0 transition-colors duration-150"
              style={{
                width: "30px",
                height: "22px",
                color: "#404556",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#404556")}
              aria-label="Back to all scenes"
              title="All Scenes"
            >
              <Layers size={13} />
            </button>

            <div
              style={{
                width: "20px",
                height: "1px",
                background: "#1a1c25",
                margin: "2px 0",
              }}
            />

            {/* Shot indicators */}
            {activeScene.shots.map((shot) => {
              const isSelected = selectedShot === shot.id
              return (
                <button
                  key={shot.id}
                  onClick={() => onSelectShot(shot.id)}
                  className="flex items-center justify-center rounded shrink-0 transition-all duration-150"
                  style={{
                    width: "30px",
                    height: "26px",
                    fontSize: "9px",
                    fontWeight: 600,
                    background: isSelected ? "#1A1C25" : "transparent",
                    color: isSelected ? "#404556" : "#404556",
                    border: isSelected
                      ? "1px solid #40455655"
                      : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "#1A1C2588"
                      e.currentTarget.style.color = "#777076"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = "#404556"
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

        {/* Collapsed footer icon */}
        <div
          className="flex items-center justify-center"
          style={{
            width: "44px",
            height: "36px",
            borderTop: "1px solid #1a1c25",
          }}
        >
          <Clapperboard size={13} style={{ color: "#252933" }} />
        </div>
      </aside>
    )
  }

  /* ── Expanded panel ────────────────────── */
  return (
    <aside
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: "200px",
        background: "#0D0E14",
        borderRight: "1px solid #252933",
        transition: "width 250ms cubic-bezier(0.4,0,0.2,1)",
      }}
      role="navigation"
      aria-label="Scene panel"
    >
      {!activeScene ? (
        /* View A — Scene List */
        <>
          {/* Header with collapse toggle */}
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#404556", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Scenes
            </span>
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center rounded transition-colors duration-150"
              style={{
                width: "22px",
                height: "22px",
                color: "#404556",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff"
                e.currentTarget.style.background = "#252933"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#404556"
                e.currentTarget.style.background = "transparent"
              }}
              aria-label="Collapse scene panel"
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          <div className="px-3 pb-2">
            <button
              className="flex items-center justify-center gap-1.5 w-full rounded-lg transition-colors duration-150"
              style={{
                background: "#252933",
                color: "#777076",
                fontSize: "13px",
                padding: "8px 0",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#404556"
                e.currentTarget.style.color = "#ffffff"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#252933"
                e.currentTarget.style.color = "#777076"
              }}
            >
              <Plus size={14} />
              <span>Add Scene</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-2 pb-3">
            {scenes.map((scene) => {
              const totalDuration = scene.shots.reduce(
                (sum, s) => sum + s.duration,
                0
              )
              return (
                <button
                  key={scene.id}
                  className="flex rounded-lg transition-colors duration-150 text-left"
                  style={{
                    background: "#1A1C25",
                    minHeight: "90px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#22252F")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#1A1C25")
                  }
                  onClick={() => onSelectScene(scene.id)}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: "28px",
                      fontSize: "11px",
                      color: "#404556",
                    }}
                  >
                    {scene.number}
                  </div>
                  <div className="flex flex-col flex-1 py-2 pr-2 gap-1.5">
                    <div
                      className="w-full rounded-md"
                      style={{
                        background: "#252933",
                        aspectRatio: "16/9",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#777076" }}>
                      {scene.title}
                    </span>
                    <span style={{ fontSize: "10px", color: "#404556" }}>
                      {scene.shots.length} shots &middot; {totalDuration}s
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        /* View B — Shot List */
        <>
          <div className="px-3 pt-3 pb-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button
                className="flex items-center gap-0.5 transition-colors duration-150"
                style={{ fontSize: "11px", color: "#777076" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#777076")}
                onClick={onBack}
              >
                <ChevronLeft size={14} />
                <span>All Scenes</span>
              </button>
              <button
                onClick={onToggleCollapse}
                className="flex items-center justify-center rounded transition-colors duration-150"
                style={{
                  width: "22px",
                  height: "22px",
                  color: "#404556",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ffffff"
                  e.currentTarget.style.background = "#252933"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#404556"
                  e.currentTarget.style.background = "transparent"
                }}
                aria-label="Collapse scene panel"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center shrink-0 rounded"
                style={{
                  width: "22px",
                  height: "22px",
                  background: "#40455622",
                  border: "1px solid #40455644",
                  color: "#404556",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {activeScene.number}
              </div>
              <span style={{ color: "#ffffff", fontSize: "12px" }}>
                {activeScene.title}
              </span>
            </div>
            <div className="flex items-center gap-1" style={{ color: "#404556", fontSize: "10px" }}>
              <Film size={10} />
              <span>
                {activeScene.shots.length} shots &middot;{" "}
                {activeScene.shots.reduce((s, sh) => s + sh.duration, 0)}s total
              </span>
            </div>
            <div style={{ borderTop: "1px solid #1A1C25" }} />
          </div>
          <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-1.5 pb-2">
            {activeScene.shots.map((shot) => {
              const isSelected = selectedShot === shot.id
              return (
                <button
                  key={shot.id}
                  className="flex items-center gap-2 rounded-md transition-colors duration-150 text-left relative"
                  style={{
                    padding: "6px",
                    background: isSelected ? "#1A1C25" : "transparent",
                    border: isSelected ? "1px solid #252933" : "1px solid transparent",
                    borderLeft: isSelected ? "3px solid #404556" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "#1A1C2588"
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "transparent"
                  }}
                  onClick={() => onSelectShot(shot.id)}
                >
                  <div
                    className="rounded-md shrink-0"
                    style={{
                      width: "56px",
                      height: "36px",
                      background: "#252933",
                    }}
                  />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span
                      style={{
                        fontSize: "11px",
                        color: isSelected ? "#ffffff" : "#777076",
                      }}
                    >
                      <span
                        style={{
                          color: isSelected ? "#404556" : "#404556",
                          marginRight: "4px",
                        }}
                      >
                        {shot.number}.
                      </span>
                      {shot.title}
                    </span>
                    <span
                      className="flex items-center gap-1"
                      style={{ fontSize: "10px", color: "#404556" }}
                    >
                      <Clock size={10} />
                      {shot.duration}s
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="px-3 pb-3">
            <button
              className="flex items-center justify-center gap-1.5 w-full rounded-md transition-colors duration-150"
              style={{
                background: "#1A1C25",
                border: "1px dashed #40455666",
                color: "#404556",
                fontSize: "12px",
                padding: "8px 0",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2A2E3B")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1A1C25")}
            >
              <Plus size={14} />
              <span>Add Shot</span>
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
