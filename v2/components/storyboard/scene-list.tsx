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
import { AnimatePresence, motion } from "framer-motion"
import type { StoryboardScene } from "@/lib/storyboard-types"

interface SceneListProps {
  scenes: StoryboardScene[]
  selectedScene: string | null
  selectedShot: string | null
  frameVersionByShot: Record<string, number>
  collapsed: boolean
  onSelectScene: (sceneId: string) => void
  onSelectShot: (shotId: string) => void
  onBack: () => void
  onToggleCollapse: () => void
}

function getShotPreviewImage(sceneNumber: number, shotNumber: number, version?: number): string {
  const base = `/storyboard/shots/scene-${String(sceneNumber).padStart(2, "0")}-shot-${String(
    shotNumber
  ).padStart(2, "0")}-start.png`
  return version ? `${base}?v=${version}` : base
}

function getScenePreviewImage(
  sceneNumber: number,
  firstShotNumber: number,
  version?: number
): string {
  const base = `/storyboard/shots/scene-${String(sceneNumber).padStart(2, "0")}-shot-${String(
    firstShotNumber
  ).padStart(2, "0")}-start.png`
  return version ? `${base}?v=${version}` : base
}

export function SceneList({
  scenes,
  selectedScene,
  selectedShot,
  frameVersionByShot,
  collapsed,
  onSelectScene,
  onSelectShot,
  onBack,
  onToggleCollapse,
}: SceneListProps) {
  const activeScene = scenes.find((s) => s.id === selectedScene)
  return (
    <motion.aside
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        background: "#000000",
        borderRight: "1px solid #232323",
      }}
      initial={false}
      animate={{ width: collapsed ? 44 : 200 }}
      transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.7 }}
      role="navigation"
      aria-label={collapsed ? "Scene panel (collapsed)" : "Scene panel"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <motion.div
            key="collapsed-panel"
            className="flex flex-col h-full items-center"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center transition-colors duration-150"
              style={{
                width: "44px",
                height: "40px",
                color: "#696969",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#696969")}
              aria-label="Expand scene panel"
            >
              <ChevronRight size={16} />
            </button>

            <div
              style={{
                width: "20px",
                height: "1px",
                background: "#232323",
                marginBottom: "8px",
              }}
            />

            {!activeScene ? (
              <div className="flex flex-col items-center gap-2.5 overflow-y-auto flex-1 py-1">
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
              <div className="flex flex-col items-center gap-2 overflow-y-auto flex-1 py-1">
                <button
                  onClick={onBack}
                  className="flex items-center justify-center rounded shrink-0 transition-colors duration-150"
                  style={{
                    width: "30px",
                    height: "22px",
                    color: "#696969",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#696969")}
                  aria-label="Back to all scenes"
                  title="All Scenes"
                >
                  <Layers size={13} />
                </button>

                <div
                  style={{
                    width: "20px",
                    height: "1px",
                    background: "#111111",
                    margin: "2px 0",
                  }}
                />

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
                        background: isSelected ? "#111111" : "transparent",
                        color: isSelected ? "#FFFFFF" : "#696969",
                        border: isSelected
                          ? "1px solid #69696955"
                          : "1px solid transparent",
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
              style={{
                width: "44px",
                height: "36px",
                borderTop: "1px solid #111111",
              }}
            >
              <Clapperboard size={13} style={{ color: "#232323" }} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded-panel"
            className="flex flex-col h-full"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {!activeScene ? (
              <>
                <div className="flex items-center justify-between px-3 pt-3 pb-1">
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "#696969", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Scenes
                  </span>
                  <button
                    onClick={onToggleCollapse}
                    className="flex items-center justify-center rounded transition-colors duration-150"
                    style={{
                      width: "22px",
                      height: "22px",
                      color: "#696969",
                    }}
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
                </div>

                <div className="px-3 pb-2">
                  <button
                    className="flex items-center justify-center gap-1.5 w-full rounded-lg transition-colors duration-150"
                    style={{
                      background: "#232323",
                      color: "#D9D9D9",
                      fontSize: "13px",
                      padding: "8px 0",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#696969"
                      e.currentTarget.style.color = "#ffffff"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#232323"
                      e.currentTarget.style.color = "#D9D9D9"
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
                    const firstShot = scene.shots[0]
                    const firstShotNumber = firstShot?.number ?? 1
                    const firstShotVersion = firstShot ? frameVersionByShot[firstShot.id] : undefined
                    const previewImage = getScenePreviewImage(
                      scene.number,
                      firstShotNumber,
                      firstShotVersion
                    )
                    return (
                      <button
                        key={scene.id}
                        className="flex rounded-lg transition-colors duration-150 text-left"
                        style={{
                          background: "#111111",
                          minHeight: "90px",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#232323")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#111111")
                        }
                        onClick={() => onSelectScene(scene.id)}
                      >
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: "28px",
                            fontSize: "11px",
                            color: "#696969",
                          }}
                        >
                          {scene.number}
                        </div>
                        <div className="flex flex-col flex-1 py-2 pr-2 gap-1.5">
                          <div
                            className="w-full rounded-md relative overflow-hidden"
                            style={{
                              background: "#232323",
                              aspectRatio: "16/9",
                            }}
                          >
                            <img
                              src={previewImage}
                              alt={`Scene ${scene.number} preview`}
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "11px", color: "#D9D9D9" }}>
                            {scene.title}
                          </span>
                          <span style={{ fontSize: "10px", color: "#696969" }}>
                            {scene.shots.length} shots &middot; {totalDuration}s
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="px-3 pt-3 pb-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <button
                      className="flex items-center gap-0.5 transition-colors duration-150"
                      style={{ fontSize: "11px", color: "#D9D9D9" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#D9D9D9")}
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
                        color: "#696969",
                      }}
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
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center shrink-0 rounded"
                      style={{
                        width: "22px",
                        height: "22px",
                        background: "#69696922",
                        border: "1px solid #69696944",
                        color: "#696969",
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
                  <div className="flex items-center gap-1" style={{ color: "#696969", fontSize: "10px" }}>
                    <Film size={10} />
                    <span>
                      {activeScene.shots.length} shots &middot;{" "}
                      {activeScene.shots.reduce((s, sh) => s + sh.duration, 0)}s total
                    </span>
                  </div>
                  <div style={{ borderTop: "1px solid #111111" }} />
                </div>
                <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-1.5 pb-2">
                  {activeScene.shots.map((shot) => {
                    const isSelected = selectedShot === shot.id
                    const previewImage = getShotPreviewImage(
                      activeScene.number,
                      shot.number,
                      frameVersionByShot[shot.id]
                    )
                    return (
                      <button
                        key={shot.id}
                        className="flex items-center gap-2 rounded-md transition-colors duration-150 text-left relative"
                        style={{
                          padding: "6px",
                          background: isSelected ? "#111111" : "transparent",
                          border: isSelected ? "1px solid #232323" : "1px solid transparent",
                          borderLeft: isSelected ? "3px solid #696969" : "1px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = "#11111188"
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = "transparent"
                        }}
                        onClick={() => onSelectShot(shot.id)}
                      >
                        <div
                          className="rounded-md shrink-0 relative overflow-hidden"
                          style={{
                            width: "56px",
                            height: "36px",
                            background: "#232323",
                          }}
                        >
                          <img
                            src={previewImage}
                            alt={`Shot ${shot.number} preview`}
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span
                            style={{
                              fontSize: "11px",
                              color: isSelected ? "#ffffff" : "#D9D9D9",
                            }}
                          >
                            <span
                              style={{
                                color: isSelected ? "#FFFFFF" : "#696969",
                                marginRight: "4px",
                              }}
                            >
                              {shot.number}.
                            </span>
                            {shot.title}
                          </span>
                          <span
                            className="flex items-center gap-1"
                            style={{ fontSize: "10px", color: "#696969" }}
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
                      background: "#111111",
                      border: "1px dashed #69696966",
                      color: "#696969",
                      fontSize: "12px",
                      padding: "8px 0",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#343434")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#111111")}
                  >
                    <Plus size={14} />
                    <span>Add Shot</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
