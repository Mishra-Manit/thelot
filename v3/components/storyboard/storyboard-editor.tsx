"use client"

import { useState, useCallback, useRef, useTransition, useEffect, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { HeaderBar } from "./header-bar"
import { SceneSidebar } from "./scene-sidebar"
import { ScriptPanel } from "./script-panel"
import { ProductionPanel } from "./production-panel"
import { ResizeHandle } from "./resize-handle"
import type { FramePreviewHandle } from "./frame-preview"
import type { WorkflowStep } from "@/lib/storyboard-types"
import { ShotTimeline } from "./shot-timeline"
import { MovieOverview } from "./movie-overview"
import { MovieRightPanel } from "./movie-right-panel"
import { SceneOverview } from "./scene-overview"
import { SceneRightPanel } from "./scene-right-panel"
import { updateShotAction } from "@/app/storyboard/actions"
import { GeneratingToast } from "./generating-toast"
import { useResizablePanel } from "./hooks/use-resizable-panel"
import { useSimulationTimers } from "./hooks/use-simulation-timers"
import { useRenderQueue } from "./hooks/use-render-queue"
import type {
  StoryboardScene,
  StoryboardShotUpdateInput,
  ShotSimulationState,
  EditingLevel,
  ShotInput,
  RenderingShot,
  ShotWithContext,
} from "@/lib/storyboard-types"

const MIN_DURATION_SECONDS = 1
const MAX_DURATION_SECONDS = 30
const TIMELINE_UI_UPDATE_INTERVAL_MS = 1000 / 24

function createStartFrameImagePath(sceneNumber: number, shotNumber: number) {
  return `/storyboard/shots/scene-${String(sceneNumber).padStart(2, "0")}-shot-${String(
    shotNumber
  ).padStart(2, "0")}-start.png`
}

const DEFAULT_SIMULATION_STATE: ShotSimulationState = {
  frames: "idle",
  video: "idle",
  approved: false,
  voice: "idle",
  lipsync: "idle",
}

interface StoryboardEditorProps {
  initialScenes: StoryboardScene[]
}

export function StoryboardEditor({ initialScenes }: StoryboardEditorProps) {
  const [scenes, setScenes] = useState(initialScenes)
  const [durationDisplayByShot, setDurationDisplayByShot] = useState<Record<string, number>>({})
  const [, startTransition] = useTransition()

  // Navigation state
  const [editingLevel, setEditingLevel] = useState<EditingLevel>("movie")
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [selectedShot, setSelectedShot] = useState<string | null>(null)
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [scenePanelCollapsed, setScenePanelCollapsed] = useState(false)
  const [activeStepByShot, setActiveStepByShot] = useState<Record<string, WorkflowStep>>({})

  // Playback state
  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const lastTimelineUiUpdateMsRef = useRef(0)

  // Refs
  const bodyRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const framePreviewRef = useRef<FramePreviewHandle>(null)

  // -- Resizable panels --
  const shotSplit = useResizablePanel({
    initialPct: 50, minPct: 30, maxPct: 70,
    containerRef: contentRef, orientation: "horizontal",
  })
  const movieSplit = useResizablePanel({
    initialPct: 28, minPct: 20, maxPct: 50,
    containerRef: contentRef, orientation: "horizontal",
  })
  const timelineSplit = useResizablePanel({
    initialPct: 20, minPct: 16, maxPct: 42,
    containerRef: bodyRef, orientation: "vertical",
  })

  // -- Simulation timers --
  const simulation = useSimulationTimers({
    scenes,
    selectedShot,
    activeStepByShot,
  })

  // -- Derived data --
  const activeScene = scenes.find((s) => s.id === selectedScene)
  const activeShot = activeScene?.shots.find((s) => s.id === selectedShot)
  const activeDurationDisplay = activeShot
    ? durationDisplayByShot[activeShot.id] ?? activeShot.duration
    : MIN_DURATION_SECONDS
  const activeSimulation = selectedShot
    ? simulation.simulationByShot[selectedShot] ?? DEFAULT_SIMULATION_STATE
    : DEFAULT_SIMULATION_STATE
  const activeStep: WorkflowStep = (selectedShot ? activeStepByShot[selectedShot] : undefined) ?? "script"
  const activeFrameVersion = activeShot ? simulation.frameVersionByShot[activeShot.id] : undefined

  const allShots = useMemo(() => scenes.flatMap((scene) => scene.shots), [scenes])

  const shotById = useMemo(() => {
    const map = new Map<string, (typeof allShots)[number]>()
    allShots.forEach((shot) => map.set(shot.id, shot))
    return map
  }, [allShots])

  const shotTimelineById = useMemo(() => {
    const map = new Map<string, { startSec: number; duration: number }>()
    let sceneStart = 0
    scenes.forEach((scene) => {
      let shotStart = sceneStart
      scene.shots.forEach((shot) => {
        map.set(shot.id, { startSec: shotStart, duration: shot.duration })
        shotStart += shot.duration
      })
      sceneStart = shotStart
    })
    return map
  }, [scenes])

  // All shots tagged with their scene — always includes full movie
  const shotsWithContext = useMemo<ShotWithContext[]>(
    () => scenes.flatMap((s) => s.shots.map((shot) => ({ ...shot, sceneId: s.id }))),
    [scenes]
  )

  // Absolute start second of each scene within the full movie
  const sceneStartSecById = useMemo(() => {
    const map = new Map<string, number>()
    let cursor = 0
    scenes.forEach((scene) => {
      map.set(scene.id, cursor)
      cursor += scene.shots.reduce((sum, s) => sum + s.duration, 0)
    })
    return map
  }, [scenes])

  // Full movie duration (always, not filtered by level)
  const movieDuration = useMemo(
    () => allShots.reduce((sum, s) => sum + s.duration, 0),
    [allShots]
  )

  // -- Render queue (header bar pills) --
  const { renderingShots } = useRenderQueue({
    simulationByShot: simulation.simulationByShot,
    renderStartTimes: simulation.renderStartTimes,
    shotById,
  })

  const startFrameImageUrl =
    activeScene && activeShot
      ? `${createStartFrameImagePath(activeScene.number, activeShot.number)}${activeFrameVersion ? `?v=${activeFrameVersion}` : ""}`
      : ""

  // -- Navigation handlers --

  const handleSceneSelect = useCallback((sceneId: string) => {
    setSelectedScene(sceneId)
    setSelectedShot(null)
    setEditingLevel("scene")
    setPanelCollapsed(false)
    setScenePanelCollapsed(false)
  }, [])

  const handleShotSelect = useCallback(
    (shotId: string, autoCollapse: boolean = true) => {
      const owningScene = scenes.find((s) => s.shots.some((sh) => sh.id === shotId))
      if (owningScene) {
        setSelectedScene(owningScene.id)
        const shotIndex = owningScene.shots.findIndex((sh) => sh.id === shotId)
        const sceneRelativeStart = owningScene.shots
          .slice(0, shotIndex)
          .reduce((sum, sh) => sum + sh.duration, 0)
        const absoluteStart = (sceneStartSecById.get(owningScene.id) ?? 0) + sceneRelativeStart
        framePreviewRef.current?.pause()
        if (editingLevel !== "shot") {
          framePreviewRef.current?.seek(sceneRelativeStart) // video player needs scene-relative
        }
        setIsVideoPlaying(false)
        setVideoCurrentTime(absoluteStart) // timeline needs absolute
      }
      setSelectedShot(shotId)
      setEditingLevel("shot")
      setPanelCollapsed(autoCollapse)
    },
    [editingLevel, scenes, sceneStartSecById]
  )

  const handleBackToMovie = useCallback(() => {
    setSelectedScene(null)
    setSelectedShot(null)
    setEditingLevel("movie")
    setPanelCollapsed(false)
    setScenePanelCollapsed(false)
  }, [])

  const handleBackToScene = useCallback(() => {
    setSelectedShot(null)
    setEditingLevel("scene")
    setPanelCollapsed(false)
    setScenePanelCollapsed(false)
  }, [])

  const handleTimelineSceneSelect = useCallback(
    (sceneId: string) => {
      setSelectedScene(sceneId)
      if (editingLevel === "shot") setEditingLevel("scene")
    },
    [editingLevel]
  )

  const handleStepChange = useCallback((step: WorkflowStep) => {
    if (!selectedShot) return
    setActiveStepByShot((prev) => ({ ...prev, [selectedShot]: step }))
  }, [selectedShot])

  // -- Simulation action wrappers (add editor-level side effects) --

  const handleApproveShot = useCallback(() => {
    if (!selectedShot) return
    simulation.handleApproveShot()
    setActiveStepByShot((prev) => ({ ...prev, [selectedShot]: "polish" }))
  }, [selectedShot, simulation])

  const handleRegenerateVideo = useCallback(() => {
    if (!selectedShot) return
    simulation.handleRegenerateVideo()
    setActiveStepByShot((prev) => ({ ...prev, [selectedShot]: "video" }))
  }, [selectedShot, simulation])

  const handleGenerateVideo = useCallback(
    (shotId?: string, originStep?: WorkflowStep) => {
      const targetId = shotId ?? selectedShot
      if (!targetId) return

      // Reset playback position when generating for the currently selected shot
      const onVideoStarted = () => {
        const timelinePosition = shotTimelineById.get(targetId)
        if (targetId === selectedShot && timelinePosition) {
          framePreviewRef.current?.seek(0)
          setIsVideoPlaying(false)
          setVideoCurrentTime(timelinePosition.startSec)
        }
      }

      simulation.handleGenerateVideo(shotId, originStep, onVideoStarted)
    },
    [selectedShot, shotTimelineById, simulation]
  )

  const handleRenderingShotNavigate = useCallback(
    (renderingShot: RenderingShot) => {
      handleShotSelect(renderingShot.shotId, false)
      setActiveStepByShot((prev) => ({
        ...prev,
        [renderingShot.shotId]: renderingShot.originStep,
      }))
    },
    [handleShotSelect]
  )

  const handleGeneratingToastNavigate = useCallback(() => {
    const toastData = simulation.generatingToastShot
    if (!toastData) return
    handleShotSelect(toastData.id, false)
    setActiveStepByShot((prev) => ({ ...prev, [toastData.id]: "script" }))
    simulation.dismissGeneratingToast()
  }, [simulation, handleShotSelect])

  // -- Shot data updates --

  const handleUpdateShot = useCallback(
    (field: keyof StoryboardShotUpdateInput, value: string | number) => {
      const currentShotId = selectedShot
      if (!currentShotId) return

      setScenes((prev) =>
        prev.map((scene) => ({
          ...scene,
          shots: scene.shots.map((shot) => {
            if (shot.id !== currentShotId) return shot
            if (field === "duration") {
              const nextDuration = Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, Math.round(Number(value))))
              return { ...shot, duration: nextDuration }
            }
            return { ...shot, [field]: value }
          }),
        }))
      )

      startTransition(async () => {
        try {
          if (field === "duration") {
            const nextDuration = Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, Math.round(Number(value))))
            await updateShotAction({ shotId: currentShotId, duration: nextDuration })
            return
          }
          await updateShotAction({ shotId: currentShotId, [field]: value })
        } catch (error) {
          console.error("Failed to persist shot update:", error)
        }
      })
    },
    [selectedShot, startTransition]
  )

  const handleDurationDisplayChange = useCallback(
    (nextValue: number) => {
      const currentShotId = selectedShot
      if (!currentShotId) return
      const safeValue = Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, Math.round(nextValue)))
      setDurationDisplayByShot((prev) => ({ ...prev, [currentShotId]: safeValue }))
    },
    [selectedShot]
  )

  // -- Playback controls --

  const handleTimelinePlayPause = useCallback(() => {
    if (isVideoPlaying) {
      framePreviewRef.current?.pause()
    } else {
      framePreviewRef.current?.play()
    }
  }, [isVideoPlaying])

  const handleTimelineSeek = useCallback(
    (seconds: number) => {
      const normalizedSeconds = Math.max(0, seconds)

      // At shot-level video step, clamp seek to the active shot's range
      if (editingLevel === "shot" && activeStep === "video" && selectedShot) {
        const timelinePosition = shotTimelineById.get(selectedShot)
        if (timelinePosition) {
          const shotStart = timelinePosition.startSec
          const shotEnd = shotStart + timelinePosition.duration
          const clampedTimelineTime = Math.max(shotStart, Math.min(normalizedSeconds, shotEnd))
          framePreviewRef.current?.seek(clampedTimelineTime - shotStart)
          setVideoCurrentTime(clampedTimelineTime)
          return
        }
      }

      // At scene level, clamp seek to active scene's range and convert to scene-relative
      if (editingLevel === "scene" && selectedScene && activeScene) {
        const sceneStart = sceneStartSecById.get(selectedScene) ?? 0
        const sceneDuration = activeScene.shots.reduce((sum, s) => sum + s.duration, 0)
        const clamped = Math.max(sceneStart, Math.min(normalizedSeconds, sceneStart + sceneDuration))
        framePreviewRef.current?.seek(clamped - sceneStart)
        setVideoCurrentTime(clamped)
        return
      }

      framePreviewRef.current?.seek(normalizedSeconds)
      setVideoCurrentTime(normalizedSeconds)
    },
    [activeStep, editingLevel, selectedShot, selectedScene, activeScene, shotTimelineById, sceneStartSecById]
  )

  const handlePlayerTimeUpdate = useCallback(
    (time: number, _duration: number) => {
      // Throttle UI updates to ~24fps
      const now = performance.now()
      if (now - lastTimelineUiUpdateMsRef.current < TIMELINE_UI_UPDATE_INTERVAL_MS) return
      lastTimelineUiUpdateMsRef.current = now

      let timelineTime = Math.max(0, time)

      // At shot-level video step, offset time by the shot's absolute position in the movie
      if (editingLevel === "shot" && activeStep === "video" && selectedShot) {
        const timelinePosition = shotTimelineById.get(selectedShot)
        if (timelinePosition) {
          const clampedShotTime = Math.max(0, Math.min(time, timelinePosition.duration))
          timelineTime = timelinePosition.startSec + clampedShotTime
        }
      } else if (editingLevel === "scene" && selectedScene) {
        const sceneStart = sceneStartSecById.get(selectedScene) ?? 0
        timelineTime = sceneStart + time
      }

      setVideoCurrentTime((prev) => (Math.abs(prev - timelineTime) >= 0.04 ? timelineTime : prev))
    },
    [activeStep, editingLevel, selectedShot, selectedScene, shotTimelineById, sceneStartSecById]
  )

  // Scene boundaries — always computed for full movie (shown at all levels)
  const sceneBoundaries = useMemo(() => {
    let cursor = 0
    return scenes.map((scene) => {
      const startSec = cursor
      const duration = scene.shots.reduce((sum, s) => sum + s.duration, 0)
      cursor += duration
      return { sceneId: scene.id, label: `Sc ${scene.number}`, startSec, duration }
    })
  }, [scenes])

  const allShotInputs = useMemo(
    (): ShotInput[] => allShots.map((s) => ({ id: s.id, videoUrl: s.videoUrl, duration: s.duration })),
    [allShots]
  )

  const sceneShotInputs = useMemo(
    (): ShotInput[] => (activeScene?.shots ?? []).map((s) => ({ id: s.id, videoUrl: s.videoUrl, duration: s.duration })),
    [activeScene]
  )

  // -- Auto-load actual video durations from metadata --

  const setFixedDuration = useCallback((shotId: string, duration: number | null) => {
    if (duration === null || !Number.isFinite(duration)) return
    setScenes((prev) =>
      prev.map((scene) => ({
        ...scene,
        shots: scene.shots.map((shot) =>
          shot.id === shotId ? { ...shot, duration } : shot
        ),
      }))
    )
    startTransition(async () => {
      try {
        await updateShotAction({ shotId, duration })
      } catch (error) {
        console.error("Failed to persist duration update:", error)
      }
    })
  }, [startTransition])

  useEffect(() => {
    let cancelled = false
    const cleanups: Array<() => void> = []

    allShots.forEach((shot) => {
      if (!shot.videoUrl) return

      const video = document.createElement("video")
      video.preload = "metadata"
      video.src = shot.videoUrl

      const cleanup = () => {
        video.removeEventListener("loadedmetadata", handleLoaded)
        video.removeEventListener("error", cleanup)
        video.src = ""
      }

      const handleLoaded = () => {
        if (cancelled) { cleanup(); return }
        const duration = Number.isFinite(video.duration)
          ? Math.min(MAX_DURATION_SECONDS, Math.max(1, Math.round(video.duration)))
          : null
        if (duration !== null && duration !== shot.duration) {
          setFixedDuration(shot.id, duration)
        }
        cleanup()
      }

      video.addEventListener("loadedmetadata", handleLoaded)
      video.addEventListener("error", cleanup)
      cleanups.push(cleanup)
    })

    return () => {
      cancelled = true
      cleanups.forEach((fn) => fn())
    }
  }, [allShots, setFixedDuration])

  // -- Render --

  const showTimeline = allShots.length > 0
  const isAnyHorizontalDrag = shotSplit.isDragging || movieSplit.isDragging

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: "#000000" }}>
      <GeneratingToast
        nextShotNumber={simulation.generatingToastShot?.number ?? null}
        message={simulation.generatingToastShot?.message ?? ""}
        onNavigate={handleGeneratingToastNavigate}
        onDismiss={simulation.dismissGeneratingToast}
      />
      <HeaderBar
        editingLevel={editingLevel}
        activeScene={activeScene}
        activeShot={activeShot}
        renderingShots={renderingShots}
        onRenderingShotClick={handleRenderingShotNavigate}
        onBackToMovie={handleBackToMovie}
        onBackToScene={handleBackToScene}
      />

      {/* Body: panels row above, full-width timeline below */}
      <div ref={bodyRef} className="flex flex-col flex-1 min-h-0">
        {/* Overlay to prevent text selection during timeline drag */}
        <AnimatePresence>
          {timelineSplit.isDragging && (
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
          style={{ flex: `0 0 ${showTimeline ? 100 - timelineSplit.pct : 100}%` }}
        >
          {/* Scene sidebar -- only visible at shot level */}
          {editingLevel === "shot" && (
            <SceneSidebar
              scenes={scenes}
              editingLevel={editingLevel}
              selectedSceneId={selectedScene}
              selectedShotId={selectedShot}
              simulationByShot={simulation.simulationByShot}
              isCollapsed={panelCollapsed}
              onCollapsedChange={setPanelCollapsed}
              onSceneSelect={handleSceneSelect}
              onShotSelect={handleShotSelect}
              onBackToMovie={handleBackToMovie}
              onBackToScene={handleBackToScene}
            />
          )}

          {/* Main content area */}
          <div ref={contentRef} className="flex flex-1 min-w-0 relative">
            {/* Overlay to prevent text selection during horizontal drag */}
            <AnimatePresence>
              {isAnyHorizontalDrag && (
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

            {/* Movie overview (State 1) */}
            {editingLevel === "movie" && (
              <>
                <MovieOverview
                  scenes={scenes}
                  simulationByShot={simulation.simulationByShot}
                  onSceneSelect={handleSceneSelect}
                  widthPct={movieSplit.pct}
                />
                <ResizeHandle
                  orientation="vertical"
                  isDragging={movieSplit.isDragging}
                  isHovered={movieSplit.isHovered}
                  onMouseDown={movieSplit.onMouseDown}
                  onHoverStart={() => movieSplit.setIsHovered(true)}
                  onHoverEnd={() => movieSplit.setIsHovered(false)}
                  onStep={(d) => movieSplit.setPct((p) => Math.min(50, Math.max(20, p + d)))}
                  label="Resize movie panels"
                  valueNow={movieSplit.pct}
                  valueMin={20}
                  valueMax={50}
                />
                <MovieRightPanel
                  shots={allShotInputs}
                  videoPlayerRef={framePreviewRef}
                  onTimeUpdate={handlePlayerTimeUpdate}
                  onPlayStateChange={setIsVideoPlaying}
                />
              </>
            )}

            {/* Scene overview (State 2) */}
            {editingLevel === "scene" && activeScene && (
              <>
                <SceneOverview
                  scene={activeScene}
                  simulationByShot={simulation.simulationByShot}
                  durationByShot={Object.fromEntries(activeScene.shots.map((shot) => [shot.id, shot.duration]))}
                  onShotSelect={handleShotSelect}
                  onBackToMovie={handleBackToMovie}
                  isCollapsed={scenePanelCollapsed}
                  onCollapsedChange={setScenePanelCollapsed}
                />
                <SceneRightPanel
                  shots={sceneShotInputs}
                  videoPlayerRef={framePreviewRef}
                  onTimeUpdate={handlePlayerTimeUpdate}
                  onPlayStateChange={setIsVideoPlaying}
                />
              </>
            )}

            {/* Shot editing (States 3-6) */}
            {editingLevel === "shot" && activeShot && activeScene && (
              <>
                <ScriptPanel
                  shot={activeShot}
                  sceneNumber={activeScene.number}
                  shotIndex={activeShot.number}
                  durationDisplay={activeDurationDisplay}
                  widthPct={shotSplit.pct}
                  onUpdate={handleUpdateShot}
                  onDurationDisplayChange={handleDurationDisplayChange}
                />
                <ResizeHandle
                  orientation="vertical"
                  isDragging={shotSplit.isDragging}
                  isHovered={shotSplit.isHovered}
                  onMouseDown={shotSplit.onMouseDown}
                  onHoverStart={() => shotSplit.setIsHovered(true)}
                  onHoverEnd={() => shotSplit.setIsHovered(false)}
                  onStep={(d) => shotSplit.setPct((p) => Math.min(70, Math.max(30, p + d)))}
                  label="Resize panels"
                  valueNow={shotSplit.pct}
                  valueMin={30}
                  valueMax={70}
                />
                <ProductionPanel
                  shot={activeShot}
                  simulation={activeSimulation}
                  currentStep={activeStep}
                  startFrameImageUrl={startFrameImageUrl}
                  widthPct={100 - shotSplit.pct}
                  videoPlayerRef={framePreviewRef}
                  onTimeUpdate={handlePlayerTimeUpdate}
                  onPlayStateChange={setIsVideoPlaying}
                  onStepChange={handleStepChange}
                  onUpdate={handleUpdateShot}
                  onGenerateFrames={(originStep) => simulation.handleGenerateFrames(activeShot.id, originStep)}
                  onGenerateVideo={(originStep) => handleGenerateVideo(activeShot.id, originStep)}
                  onApproveShot={handleApproveShot}
                  onRegenerateVideo={handleRegenerateVideo}
                  onGenerateVoice={simulation.handleGenerateVoice}
                  onApplyLipsync={simulation.handleApplyLipsync}
                />
              </>
            )}

            {/* Fallback: no scene selected */}
            {editingLevel === "scene" && !activeScene && (
              <div
                className="flex flex-1 items-center justify-center"
                style={{ color: "#D9D9D9", fontSize: "13px" }}
              >
                Select a scene to begin editing
              </div>
            )}
          </div>
        </div>

        {/* Timeline resize handle */}
        {showTimeline && (
          <ResizeHandle
            orientation="horizontal"
            isDragging={timelineSplit.isDragging}
            isHovered={timelineSplit.isHovered}
            onMouseDown={timelineSplit.onMouseDown}
            onHoverStart={() => timelineSplit.setIsHovered(true)}
            onHoverEnd={() => timelineSplit.setIsHovered(false)}
            onStep={(d) => timelineSplit.setPct((p) => Math.min(42, Math.max(16, p + d)))}
            label="Resize timeline"
            valueNow={timelineSplit.pct}
            valueMin={16}
            valueMax={42}
          />
        )}

        {/* Full-width timeline */}
        {showTimeline && (
          <div
            className="min-h-0"
            style={{ flex: `0 0 ${timelineSplit.pct}%`, padding: "0" }}
          >
            <ShotTimeline
              shots={shotsWithContext}
              selectedShot={selectedShot}
              selectedSceneId={selectedScene}
              durationByShot={Object.fromEntries(allShots.map((s) => [s.id, s.duration]))}
              sceneBoundaries={sceneBoundaries}
              onSelectShot={handleShotSelect}
              onSceneSelect={handleTimelineSceneSelect}
              currentTime={videoCurrentTime}
              totalDuration={movieDuration}
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
