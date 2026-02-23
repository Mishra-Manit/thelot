"use client"

import { useState, useCallback, useRef, useTransition, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { HeaderBar } from "./header-bar"
import { SceneList } from "./scene-list"
import { ShotDetail } from "./shot-detail"
import { FramePreview, type FramePreviewHandle } from "./frame-preview"
import { ShotTimeline } from "./shot-timeline"
import { updateShotAction } from "@/app/storyboard/actions"
import type { StoryboardScene, StoryboardShotUpdateInput } from "@/lib/storyboard-types"

const MIN_LEFT_PCT = 30
const MAX_LEFT_PCT = 70
const MIN_TIMELINE_PCT = 16
const MAX_TIMELINE_PCT = 42
const SIMULATION_DELAY_MS = 3000

type SimulationPhase = "idle" | "loading" | "ready"

interface ShotSimulationState {
  frames: SimulationPhase
  video: SimulationPhase
}

type SimulationTimerKey = "frames" | "video"

const DEFAULT_SIMULATION_STATE: ShotSimulationState = {
  frames: "idle",
  video: "idle",
}

function createShotImagePath(sceneNumber: number, shotNumber: number, kind: "start" | "end") {
  return `/storyboard/shots/scene-${String(sceneNumber).padStart(2, "0")}-shot-${String(
    shotNumber
  ).padStart(2, "0")}-${kind}.png`
}

interface StoryboardEditorProps {
  initialScenes: StoryboardScene[]
}

export function StoryboardEditor({ initialScenes }: StoryboardEditorProps) {
  const [scenes, setScenes] = useState(initialScenes)
  const [, startTransition] = useTransition()
  const [simulationByShot, setSimulationByShot] = useState<Record<string, ShotSimulationState>>({})
  const [frameVersionByShot, setFrameVersionByShot] = useState<Record<string, number>>({})
  const [selectedScene, setSelectedScene] = useState<string | null>(() => {
    if (initialScenes.length === 0) return null
    return initialScenes[2]?.id ?? initialScenes[0].id
  })
  const [selectedShot, setSelectedShot] = useState<string | null>(null)
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  /* ── Resizable split ─── */
  const [leftPct, setLeftPct] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizeHandleHovered, setIsResizeHandleHovered] = useState(false)
  const [timelinePct, setTimelinePct] = useState(20)
  const [isTimelineDragging, setIsTimelineDragging] = useState(false)
  const [isTimelineHandleHovered, setIsTimelineHandleHovered] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const framePreviewRef = useRef<FramePreviewHandle>(null)

  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [videoTotalDuration, setVideoTotalDuration] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const simulationTimersRef = useRef<Record<string, Partial<Record<SimulationTimerKey, number>>>>(
    {}
  )

  const activeScene = scenes.find((s) => s.id === selectedScene)
  const activeShot = activeScene?.shots.find((s) => s.id === selectedShot)
  const activeSimulation = selectedShot
    ? simulationByShot[selectedShot] ?? DEFAULT_SIMULATION_STATE
    : DEFAULT_SIMULATION_STATE
  const activeFrameVersion = activeShot ? frameVersionByShot[activeShot.id] : undefined
  const startFrameImageUrl =
    activeScene && activeShot
      ? `${createShotImagePath(activeScene.number, activeShot.number, "start")}${activeFrameVersion ? `?v=${activeFrameVersion}` : ""}`
      : ""
  const endFrameImageUrl =
    activeScene && activeShot
      ? `${createShotImagePath(activeScene.number, activeShot.number, "end")}${activeFrameVersion ? `?v=${activeFrameVersion}` : ""}`
      : ""

  const handleSelectScene = useCallback((sceneId: string) => {
    setSelectedScene(sceneId)
    setSelectedShot(null)
    setPanelCollapsed(false)
  }, [])

  const handleSelectShot = useCallback((shotId: string) => {
    setSelectedShot(shotId)
    setPanelCollapsed(true)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedScene(null)
    setSelectedShot(null)
    setPanelCollapsed(false)
  }, [])

  const handleToggleCollapse = useCallback(() => {
    setPanelCollapsed((prev) => !prev)
  }, [])

  const clearSimulationTimer = useCallback((shotId: string, key: SimulationTimerKey) => {
    const shotTimers = simulationTimersRef.current[shotId]
    const timerId = shotTimers?.[key]
    if (timerId === undefined) return
    window.clearTimeout(timerId)
    delete shotTimers[key]
    if (shotTimers.frames === undefined && shotTimers.video === undefined) {
      delete simulationTimersRef.current[shotId]
    }
  }, [])

  const clearAllSimulationTimers = useCallback(() => {
    Object.entries(simulationTimersRef.current).forEach(([shotId, timers]) => {
      if (timers.frames !== undefined) {
        window.clearTimeout(timers.frames)
      }
      if (timers.video !== undefined) {
        window.clearTimeout(timers.video)
      }
      delete simulationTimersRef.current[shotId]
    })
  }, [])

  useEffect(() => {
    return () => clearAllSimulationTimers()
  }, [clearAllSimulationTimers])

  const updateSimulationState = useCallback(
    (shotId: string, patch: Partial<ShotSimulationState>) => {
      setSimulationByShot((prev) => ({
        ...prev,
        [shotId]: {
          ...(prev[shotId] ?? DEFAULT_SIMULATION_STATE),
          ...patch,
        },
      }))
    },
    []
  )

  const handleGenerateFrames = useCallback(
    (shotId?: string) => {
      const targetShotId = shotId ?? selectedShot
      if (!targetShotId) return

      setFrameVersionByShot((prev) => ({ ...prev, [targetShotId]: Date.now() }))
      clearSimulationTimer(targetShotId, "frames")
      clearSimulationTimer(targetShotId, "video")
      updateSimulationState(targetShotId, { frames: "loading", video: "idle" })

      const timerId = window.setTimeout(() => {
        setFrameVersionByShot((prev) => ({ ...prev, [targetShotId]: Date.now() }))
        setSimulationByShot((prev) => ({
          ...prev,
          [targetShotId]: {
            ...(prev[targetShotId] ?? DEFAULT_SIMULATION_STATE),
            frames: "ready",
            video: "idle",
          },
        }))
        delete simulationTimersRef.current[targetShotId]?.frames
      }, SIMULATION_DELAY_MS)

      simulationTimersRef.current[targetShotId] = {
        ...(simulationTimersRef.current[targetShotId] ?? {}),
        frames: timerId,
      }
    },
    [clearSimulationTimer, selectedShot, updateSimulationState]
  )

  const handleGenerateVideo = useCallback(
    (shotId?: string) => {
      const targetShotId = shotId ?? selectedShot
      if (!targetShotId) return
      const shotSimulation = simulationByShot[targetShotId] ?? DEFAULT_SIMULATION_STATE
      if (shotSimulation.frames !== "ready") return

      clearSimulationTimer(targetShotId, "video")
      updateSimulationState(targetShotId, { video: "loading" })

      const timerId = window.setTimeout(() => {
        setSimulationByShot((prev) => ({
          ...prev,
          [targetShotId]: {
            ...(prev[targetShotId] ?? DEFAULT_SIMULATION_STATE),
            video: "ready",
          },
        }))
        delete simulationTimersRef.current[targetShotId]?.video
      }, SIMULATION_DELAY_MS)

      simulationTimersRef.current[targetShotId] = {
        ...(simulationTimersRef.current[targetShotId] ?? {}),
        video: timerId,
      }
    },
    [clearSimulationTimer, selectedShot, simulationByShot, updateSimulationState]
  )

  const handleResetSimulation = useCallback(
    (shotId?: string) => {
      const targetShotId = shotId ?? selectedShot
      if (!targetShotId) return
      clearSimulationTimer(targetShotId, "frames")
      clearSimulationTimer(targetShotId, "video")
      setSimulationByShot((prev) => ({
        ...prev,
        [targetShotId]: DEFAULT_SIMULATION_STATE,
      }))
    },
    [clearSimulationTimer, selectedShot]
  )

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

  const handleTimelineResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsTimelineDragging(true)
      const startY = e.clientY
      const startPct = timelinePct
      const container = bodyRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerHeight = containerRect.height

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientY - startY
        const deltaPct = (delta / containerHeight) * 100
        const next = Math.min(MAX_TIMELINE_PCT, Math.max(MIN_TIMELINE_PCT, startPct - deltaPct))
        setTimelinePct(next)
      }

      const onUp = () => {
        setIsTimelineDragging(false)
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }

      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    },
    [timelinePct]
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

  const handleTimelinePlayPause = useCallback(() => {
    if (isVideoPlaying) {
      framePreviewRef.current?.pause()
    } else {
      framePreviewRef.current?.play()
    }
  }, [isVideoPlaying])

  const handleTimelineSeek = useCallback((seconds: number) => {
    framePreviewRef.current?.seek(seconds)
    setVideoCurrentTime(seconds)
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: "#000000" }}>
      <HeaderBar
        onRewindSimulation={() => handleResetSimulation(activeShot?.id)}
        canRewindSimulation={Boolean(activeShot)}
      />

      {/* Body: panels row above, full-width timeline below */}
      <div ref={bodyRef} className="flex flex-col flex-1 min-h-0">
        <AnimatePresence>
          {isTimelineDragging && (
            <motion.div
              className="fixed inset-0 z-50"
              style={{ cursor: "row-resize" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        <div
          className="flex min-h-0"
          style={{ flex: `0 0 ${activeScene ? 100 - timelinePct : 100}%` }}
        >
          {/* Scene list sidebar */}
          <SceneList
            scenes={scenes}
            selectedScene={selectedScene}
            selectedShot={selectedShot}
            frameVersionByShot={frameVersionByShot}
            collapsed={panelCollapsed}
            onSelectScene={handleSelectScene}
            onSelectShot={handleSelectShot}
            onBack={handleBack}
            onToggleCollapse={handleToggleCollapse}
          />

          {/* Shot Detail + Resize Handle + Frame Preview */}
          <div ref={contentRef} className="flex flex-1 min-w-0 relative">
            {/* Prevent text selection while dragging */}
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  className="fixed inset-0 z-50"
                  style={{ cursor: "col-resize" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>

            {activeShot && activeScene ? (
              <>
                <ShotDetail
                  shot={activeShot}
                  sceneNumber={activeScene.number}
                  shotIndex={activeShot.number}
                  startFrameImageUrl={startFrameImageUrl}
                  onUpdate={handleUpdateShot}
                  widthPct={leftPct}
                  onGenerateVideo={() => handleGenerateVideo(activeShot.id)}
                  canGenerateVideo={activeSimulation.frames === "ready"}
                  isVideoLoading={activeSimulation.video === "loading"}
                  isVideoReady={activeSimulation.video === "ready"}
                  onGenerateFrames={() => handleGenerateFrames(activeShot.id)}
                  canGenerateFrames={true} // Modify as needed based on your logic
                  isFramesLoading={activeSimulation.frames === "loading"}
                  areFramesReady={activeSimulation.frames === "ready"}
                />

                {/* ── Drag Handle ───────────────────── */}
                <motion.div
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
                  onHoverStart={() => setIsResizeHandleHovered(true)}
                  onHoverEnd={() => setIsResizeHandleHovered(false)}
                  animate={{
                    scale: isDragging ? 1.03 : 1,
                  }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") {
                      setLeftPct((p) => Math.max(MIN_LEFT_PCT, p - 1))
                    } else if (e.key === "ArrowRight") {
                      setLeftPct((p) => Math.min(MAX_LEFT_PCT, p + 1))
                    }
                  }}
                >
                  {/* Visible rail */}
                  <motion.div
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2"
                    animate={{
                      width: isDragging ? 3 : isResizeHandleHovered ? 2 : 1,
                      backgroundColor: isDragging
                        ? "#7A7A7A"
                        : isResizeHandleHovered
                          ? "#696969"
                          : "#232323",
                    }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                  />
                  {/* Hover / active indicator pill */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    animate={{
                      opacity: isDragging ? 1 : isResizeHandleHovered ? 0.6 : 0,
                      scaleY: isDragging ? 1 : 0.92,
                    }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: "5px",
                        height: "32px",
                        background: "#7A7A7A",
                      }}
                    />
                  </motion.div>
                  {/* Wider invisible hit area */}
                  <div className="absolute inset-y-0 -left-2 -right-2" />
                </motion.div>

                <FramePreview
                  ref={framePreviewRef}
                  sceneNumber={activeScene.number}
                  shotNumber={activeShot.number}
                  totalShots={activeScene.shots.length}
                  duration={activeShot.duration}
                  startFramePrompt={activeShot.startFramePrompt}
                  shotTitle={activeShot.title}
                  shots={
                    activeSimulation.video === "ready"
                      ? activeScene.shots
                      : activeScene.shots.map((shot) => ({ ...shot, videoUrl: "" }))
                  }
                  startFrameImageUrl={startFrameImageUrl}
                  endFrameImageUrl={endFrameImageUrl}
                  endFrameFallbackImageUrl={startFrameImageUrl}
                  isFramesLoading={activeSimulation.frames === "loading"}
                  areFramesReady={activeSimulation.frames === "ready"}
                  isVideoLoading={activeSimulation.video === "loading"}
                  onGenerateFrames={() => handleGenerateFrames(activeShot.id)}
                  onVideoTimeUpdate={(time, dur) => {
                    setVideoCurrentTime(time)
                    setVideoTotalDuration(dur)
                  }}
                  onVideoPlayStateChange={setIsVideoPlaying}
                />
              </>
            ) : (
              <div
                className="flex flex-1 items-center justify-center"
                style={{ color: "#D9D9D9", fontSize: "13px" }}
              >
                Select a scene and shot to begin editing
              </div>
            )}
          </div>
        </div>

        {activeScene && (
          <motion.div
            onMouseDown={handleTimelineResizeStart}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize timeline"
            aria-valuenow={Math.round(timelinePct)}
            aria-valuemin={MIN_TIMELINE_PCT}
            aria-valuemax={MAX_TIMELINE_PCT}
            tabIndex={0}
            className="relative shrink-0"
            style={{ height: "24px", cursor: "row-resize", zIndex: 10 }}
            onHoverStart={() => setIsTimelineHandleHovered(true)}
            onHoverEnd={() => setIsTimelineHandleHovered(false)}
            animate={{ scale: isTimelineDragging ? 1.02 : 1 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                setTimelinePct((p) => Math.min(MAX_TIMELINE_PCT, p + 1))
              } else if (e.key === "ArrowDown") {
                setTimelinePct((p) => Math.max(MIN_TIMELINE_PCT, p - 1))
              }
            }}
          >
            <motion.div
              className="absolute inset-x-3 top-1/2 -translate-y-1/2"
              animate={{
                height: isTimelineDragging ? 3 : isTimelineHandleHovered ? 2 : 1,
                backgroundColor: isTimelineDragging
                  ? "#7A7A7A"
                  : isTimelineHandleHovered
                    ? "#696969"
                    : "#232323",
              }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{
                opacity: isTimelineDragging ? 1 : isTimelineHandleHovered ? 0.6 : 0,
                scaleX: isTimelineDragging ? 1 : 0.92,
              }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            >
              <div
                className="rounded-full"
                style={{
                  width: "32px",
                  height: "5px",
                  background: "#7A7A7A",
                }}
              />
            </motion.div>
            <div className="absolute inset-x-0 -top-2 -bottom-2" />
          </motion.div>
        )}

        {/* Full-width timeline spanning entire bottom */}
        {activeScene && (
          <div
            className="min-h-0"
            style={{
              flex: `0 0 ${timelinePct}%`,
              padding: "0",
            }}
          >
            <ShotTimeline
              shots={activeScene.shots}
              selectedShot={selectedShot}
              sceneNumber={activeScene.number}
              onSelectShot={handleSelectShot}
              currentTime={videoCurrentTime}
              totalDuration={videoTotalDuration}
              isPlaying={isVideoPlaying}
              onPlayPause={handleTimelinePlayPause}
              onSeek={handleTimelineSeek}
            />
          </div>
        )}
      </div>
    </div>
  )
}
