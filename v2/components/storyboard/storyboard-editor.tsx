"use client"

import { useState, useCallback, useRef, useTransition } from "react"
import { HeaderBar } from "./header-bar"
import { SceneList } from "./scene-list"
import { ShotDetail } from "./shot-detail"
import { FramePreview } from "./frame-preview"
import { ShotTimeline } from "./shot-timeline"
import { updateShotAction } from "@/app/storyboard/actions"
import type { StoryboardScene, StoryboardShotUpdateInput } from "@/lib/storyboard-types"

const MIN_LEFT_PCT = 30
const MAX_LEFT_PCT = 70

interface StoryboardEditorProps {
  initialScenes: StoryboardScene[]
}

export function StoryboardEditor({ initialScenes }: StoryboardEditorProps) {
  const [scenes, setScenes] = useState(initialScenes)
  const [isPending, startTransition] = useTransition()
  const [selectedScene, setSelectedScene] = useState<string | null>(() => {
    if (initialScenes.length === 0) return null
    return initialScenes[2]?.id ?? initialScenes[0].id
  })
  const [selectedShot, setSelectedShot] = useState<string | null>(() => {
    if (initialScenes.length === 0) return null
    const defaultScene = initialScenes[2] ?? initialScenes[0]
    return defaultScene.shots[0]?.id ?? null
  })
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  /* ── Resizable split ─── */
  const [leftPct, setLeftPct] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const activeScene = scenes.find((s) => s.id === selectedScene)
  const activeShot = activeScene?.shots.find((s) => s.id === selectedShot)

  const handleSelectScene = useCallback(
    (sceneId: string) => {
      setSelectedScene(sceneId)
      const scene = scenes.find((s) => s.id === sceneId)
      if (scene && scene.shots.length > 0) {
        setSelectedShot(scene.shots[0].id)
      } else {
        setSelectedShot(null)
      }
    },
    [scenes]
  )

  const handleSelectShot = useCallback((shotId: string) => {
    setSelectedShot(shotId)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedScene(null)
    setSelectedShot(null)
  }, [])

  const handleToggleCollapse = useCallback(() => {
    setPanelCollapsed((prev) => !prev)
  }, [])

  /* ── Drag to resize ─── */
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      const startX = e.clientX
      const startPct = leftPct
      const container = contentRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX
        const deltaPct = (delta / containerWidth) * 100
        const next = Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, startPct + deltaPct))
        setLeftPct(next)
      }

      const onUp = () => {
        setIsDragging(false)
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }

      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    },
    [leftPct]
  )

  const handleUpdateShot = useCallback(
    (field: keyof StoryboardShotUpdateInput, value: string | number) => {
      const currentShotId = selectedShot
      if (!currentShotId) return

      setScenes((prev) =>
        prev.map((scene) => ({
          ...scene,
          shots: scene.shots.map((shot) =>
            shot.id === currentShotId ? { ...shot, [field]: value } : shot
          ),
        }))
      )

      startTransition(async () => {
        try {
          await updateShotAction({
            shotId: currentShotId,
            [field]: value,
          })
        } catch (error) {
          console.error("Failed to persist shot update:", error)
        }
      })
    },
    [selectedShot, startTransition]
  )

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: "#0D0E14" }}>
      <HeaderBar />

      <div className="flex flex-1 min-h-0">
        {/* Scene list sidebar */}
        <SceneList
          scenes={scenes}
          selectedScene={selectedScene}
          selectedShot={selectedShot}
          collapsed={panelCollapsed}
          onSelectScene={handleSelectScene}
          onSelectShot={handleSelectShot}
          onBack={handleBack}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top section: Shot Detail + Resize Handle + Frame Preview */}
          <div ref={contentRef} className="flex flex-1 min-h-0 relative">
            {/* Prevent text selection while dragging */}
            {isDragging && (
              <div className="fixed inset-0 z-50" style={{ cursor: "col-resize" }} />
            )}

            {activeShot && activeScene ? (
              <>
                <ShotDetail
                  shot={activeShot}
                  sceneNumber={activeScene.number}
                  onUpdate={handleUpdateShot}
                  widthPct={leftPct}
                />

                {/* ── Drag Handle ───────────────────── */}
                <div
                  onMouseDown={handleResizeStart}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize panels"
                  aria-valuenow={Math.round(leftPct)}
                  aria-valuemin={MIN_LEFT_PCT}
                  aria-valuemax={MAX_LEFT_PCT}
                  tabIndex={0}
                  className="resize-handle relative shrink-0"
                  style={{
                    width: "7px",
                    cursor: "col-resize",
                    zIndex: 10,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") {
                      setLeftPct((p) => Math.max(MIN_LEFT_PCT, p - 1))
                    } else if (e.key === "ArrowRight") {
                      setLeftPct((p) => Math.min(MAX_LEFT_PCT, p + 1))
                    }
                  }}
                >
                  {/* Visible rail */}
                  <div
                    className="resize-rail absolute inset-y-0 left-1/2 -translate-x-1/2 transition-all duration-150"
                    style={{
                      width: isDragging ? "3px" : "1px",
                      background: isDragging ? "#555B6E" : "#252933",
                    }}
                  />
                  {/* Hover / active indicator pill */}
                  <div
                    className="resize-pill absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150"
                    style={{
                      opacity: isDragging ? 1 : 0,
                    }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: "5px",
                        height: "32px",
                        background: "#555B6E",
                      }}
                    />
                  </div>
                  {/* Wider invisible hit area */}
                  <div className="absolute inset-y-0 -left-2 -right-2" />
                  <style>{`
                    .resize-handle:hover .resize-rail {
                      width: 2px !important;
                      background: #404556 !important;
                    }
                    .resize-handle:hover .resize-pill {
                      opacity: 0.6 !important;
                    }
                  `}</style>
                </div>

                <FramePreview
                  sceneNumber={activeScene.number}
                  shotNumber={activeShot.number}
                  totalShots={activeScene.shots.length}
                  duration={activeShot.duration}
                  startFramePrompt={activeShot.startFramePrompt}
                  shotTitle={activeShot.title}
                  videoUrl={activeShot.videoUrl}
                  isSaving={isPending}
                />
              </>
            ) : (
              <div
                className="flex flex-1 items-center justify-center"
                style={{ color: "#777076", fontSize: "13px" }}
              >
                Select a scene and shot to begin editing
              </div>
            )}
          </div>

          {/* Bottom: Shot Timeline */}
          {activeScene && (
            <ShotTimeline
              shots={activeScene.shots}
              selectedShot={selectedShot}
              sceneNumber={activeScene.number}
              onSelectShot={handleSelectShot}
            />
          )}
        </div>
      </div>
    </div>
  )
}
