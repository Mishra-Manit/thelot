"use client"

import { useState, useCallback, useRef, useTransition, useEffect, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { HeaderBar } from "./header-bar"
import { SceneSidebar } from "./scene-sidebar"
import { ScriptPanel } from "./script-panel"
import { ProductionPanel } from "./production-panel"
import type { FramePreviewHandle } from "./frame-preview"
import type { WorkflowStep } from "@/lib/storyboard-types"
import { ShotTimeline } from "./shot-timeline"
import { MovieOverview } from "./movie-overview"
import { MovieRightPanel } from "./movie-right-panel"
import { SceneOverview } from "./scene-overview"
import { SceneRightPanel } from "./scene-right-panel"
import { updateShotAction } from "@/app/storyboard/actions"
import { toast } from "sonner"
import type {
  StoryboardScene,
  StoryboardShotUpdateInput,
  ShotSimulationState,
  EditingLevel,
  ShotInput,
  RenderingShot,
} from "@/lib/storyboard-types"
import { findNextShot } from "@/lib/storyboard-utils"

const MIN_DURATION_SECONDS = 1
const MAX_DURATION_SECONDS = 30
const MIN_LEFT_PCT = 30
const MAX_LEFT_PCT = 70
const MIN_MOVIE_LEFT_PCT = 20
const MAX_MOVIE_LEFT_PCT = 50
const MIN_TIMELINE_PCT = 16
const MAX_TIMELINE_PCT = 42
const FRAMES_GENERATION_MS = 20_000
const VIDEO_GENERATION_MS = 180_000
const TIMELINE_UI_UPDATE_INTERVAL_MS = 1000 / 24
const SIMULATION_SEED_PCT = 0.37

type SimulationTimerKey = "frames" | "video" | "voice" | "lipsync"

const DEFAULT_SIMULATION_STATE: ShotSimulationState = {
  frames: "idle",
  video: "idle",
  approved: false,
  voice: "idle",
  lipsync: "idle",
}

// Marks the first targetPct of shots (in natural order) as video_ready.
// Used to seed the demo so the UI shows some clips already generated.
function buildSeedSimulation(
  scenes: StoryboardScene[],
  targetPct: number
): Record<string, ShotSimulationState> {
  const allShots = scenes.flatMap((s) => s.shots)
  const numReady = Math.floor(allShots.length * targetPct)
  return Object.fromEntries(
    allShots.map((shot, i) => [
      shot.id,
      i < numReady
        ? { frames: "ready" as const, video: "ready" as const, approved: false, voice: "idle" as const, lipsync: "idle" as const }
        : { ...DEFAULT_SIMULATION_STATE },
    ])
  )
}

function buildSimulationFromShots(scenes: StoryboardScene[]): Record<string, ShotSimulationState> {
  const allShots = scenes.flatMap((s) => s.shots)
  return Object.fromEntries(
    allShots.map((shot) => [
      shot.id,
      {
        frames: shot.framesStatus ?? "idle",
        video: shot.videoStatus ?? "idle",
        approved: shot.approved ?? false,
        voice: shot.voiceStatus ?? "idle",
        lipsync: shot.lipsyncStatus ?? "idle",
      },
    ])
  )
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
  const [durationDisplayByShot, setDurationDisplayByShot] = useState<Record<string, number>>({})
  const [, startTransition] = useTransition()
  const [simulationByShot, setSimulationByShot] = useState<Record<string, ShotSimulationState>>(
    () => buildSimulationFromShots(initialScenes)
  )
  const [frameVersionByShot, setFrameVersionByShot] = useState<Record<string, number>>({})
  const [activeStepByShot, setActiveStepByShot] = useState<Record<string, WorkflowStep>>({})
  const [renderStartTimes, setRenderStartTimes] = useState<
    Record<string, { frames?: number; video?: number }>
  >({})

  // Navigation state
  const [editingLevel, setEditingLevel] = useState<EditingLevel>("movie")
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [selectedShot, setSelectedShot] = useState<string | null>(null)
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  /* ── Resizable split ─── */
  const [leftPct, setLeftPct] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizeHandleHovered, setIsResizeHandleHovered] = useState(false)
  const [movieLeftPct, setMovieLeftPct] = useState(28)
  const [isMovieDragging, setIsMovieDragging] = useState(false)
  const [isMovieHandleHovered, setIsMovieHandleHovered] = useState(false)
  const [timelinePct, setTimelinePct] = useState(20)
  const [isTimelineDragging, setIsTimelineDragging] = useState(false)
  const [isTimelineHandleHovered, setIsTimelineHandleHovered] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const framePreviewRef = useRef<FramePreviewHandle>(null)

  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [videoTotalDuration, setVideoTotalDuration] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const lastTimelineUiUpdateMsRef = useRef(0)
  const simulationTimersRef = useRef<Record<string, Partial<Record<SimulationTimerKey, number>>>>(
    {}
  )

  const activeScene = scenes.find((s) => s.id === selectedScene)
  const activeShot = activeScene?.shots.find((s) => s.id === selectedShot)
  const activeDurationDisplay = activeShot
    ? durationDisplayByShot[activeShot.id] ?? activeShot.duration
    : MIN_DURATION_SECONDS
  const activeSimulation = selectedShot
    ? simulationByShot[selectedShot] ?? DEFAULT_SIMULATION_STATE
    : DEFAULT_SIMULATION_STATE
  const activeStep: WorkflowStep = (selectedShot ? activeStepByShot[selectedShot] : undefined) ?? "script"
  const activeFrameVersion = activeShot ? frameVersionByShot[activeShot.id] : undefined

  // Shots currently being generated, used to populate nav bar render queue pills
  const renderingShots = useMemo<RenderingShot[]>(() => {
    const result: RenderingShot[] = []
    for (const [shotId, sim] of Object.entries(simulationByShot)) {
      const shot = scenes.flatMap((s) => s.shots).find((s) => s.id === shotId)
      if (!shot) continue
      const times = renderStartTimes[shotId]
      if (sim.frames === "loading" && times?.frames !== undefined) {
        result.push({ shotId, shotNumber: shot.number, type: "frames", startedAt: times.frames, durationMs: FRAMES_GENERATION_MS })
      }
      if (sim.video === "loading" && times?.video !== undefined) {
        result.push({ shotId, shotNumber: shot.number, type: "video", startedAt: times.video, durationMs: VIDEO_GENERATION_MS })
      }
    }
    return result
  }, [simulationByShot, renderStartTimes, scenes])

  const startFrameImageUrl =
    activeScene && activeShot
      ? `${createShotImagePath(activeScene.number, activeShot.number, "start")}${activeFrameVersion ? `?v=${activeFrameVersion}` : ""}`
      : ""

  /* ── Navigation handlers ─── */

  const handleSceneSelect = useCallback((sceneId: string) => {
    setSelectedScene(sceneId)
    setSelectedShot(null)
    setEditingLevel("scene")
    setPanelCollapsed(false)
  }, [])

  const handleShotSelect = useCallback(
    (shotId: string) => {
      const owningScene = scenes.find((s) => s.shots.some((sh) => sh.id === shotId))
      if (owningScene) {
        setSelectedScene(owningScene.id)
        const shotIndex = owningScene.shots.findIndex((sh) => sh.id === shotId)
        const startSec = owningScene.shots.slice(0, shotIndex).reduce((sum, sh) => sum + sh.duration, 0)
        framePreviewRef.current?.seek(startSec)
        setVideoCurrentTime(startSec)
      }
      setSelectedShot(shotId)
      setEditingLevel("shot")
      setPanelCollapsed(true)
    },
    [scenes]
  )

  const handleBackToMovie = useCallback(() => {
    setSelectedScene(null)
    setSelectedShot(null)
    setEditingLevel("movie")
    setPanelCollapsed(false)
  }, [])

  const handleBackToScene = useCallback(() => {
    setSelectedShot(null)
    setEditingLevel("scene")
    setPanelCollapsed(false)
  }, [])

  const handleToggleCollapse = useCallback((collapsed: boolean) => {
    setPanelCollapsed(collapsed)
  }, [])

  const handleStepChange = useCallback((step: WorkflowStep) => {
    if (!selectedShot) return
    setActiveStepByShot((prev) => ({ ...prev, [selectedShot]: step }))
  }, [selectedShot])

  const clearSimulationTimer = useCallback((shotId: string, key: SimulationTimerKey) => {
    const shotTimers = simulationTimersRef.current[shotId]
    const timerId = shotTimers?.[key]
    if (timerId === undefined) return
    window.clearTimeout(timerId)
    delete shotTimers[key]
    const hasRemaining = (["frames", "video", "voice", "lipsync"] as SimulationTimerKey[]).some(
      (k) => shotTimers[k] !== undefined
    )
    if (!hasRemaining) {
      delete simulationTimersRef.current[shotId]
    }
  }, [])

  const clearAllSimulationTimers = useCallback(() => {
    Object.entries(simulationTimersRef.current).forEach(([, timers]) => {
      if (timers.frames !== undefined) window.clearTimeout(timers.frames)
      if (timers.video !== undefined) window.clearTimeout(timers.video)
      if (timers.voice !== undefined) window.clearTimeout(timers.voice)
      if (timers.lipsync !== undefined) window.clearTimeout(timers.lipsync)
    })
    simulationTimersRef.current = {}
  }, [])

  useEffect(() => {
    return () => clearAllSimulationTimers()
  }, [clearAllSimulationTimers])

  useEffect(() => {
    setSimulationByShot(buildSimulationFromShots(scenes))
  }, [scenes])

  const applySimulationSeed = useCallback((seed: Record<string, ShotSimulationState>) => {
    setSimulationByShot(seed)
    setScenes((prev) =>
      prev.map((scene) => ({
        ...scene,
        shots: scene.shots.map((shot) => {
          const sim = seed[shot.id]
          if (!sim) return shot
          return {
            ...shot,
            framesStatus: sim.frames,
            videoStatus: sim.video,
            voiceStatus: sim.voice,
            lipsyncStatus: sim.lipsync,
            approved: sim.approved,
          }
        }),
      }))
    )
  }, [])

  const updateSimulationState = useCallback(
    (shotId: string, patch: Partial<ShotSimulationState>) => {
      setSimulationByShot((prev) => ({
        ...prev,
        [shotId]: {
          ...(prev[shotId] ?? DEFAULT_SIMULATION_STATE),
          ...patch,
        },
      }))

      setScenes((prev) =>
        prev.map((scene) => ({
          ...scene,
          shots: scene.shots.map((shot) => {
            if (shot.id !== shotId) return shot
            return {
              ...shot,
              framesStatus: patch.frames ?? shot.framesStatus,
              videoStatus: patch.video ?? shot.videoStatus,
              voiceStatus: patch.voice ?? shot.voiceStatus,
              lipsyncStatus: patch.lipsync ?? shot.lipsyncStatus,
              approved: patch.approved ?? shot.approved,
            }
          }),
        }))
      )

      const dataPatch: StoryboardShotUpdateInput = {}
      if (patch.frames !== undefined) dataPatch.framesStatus = patch.frames
      if (patch.video !== undefined) dataPatch.videoStatus = patch.video
      if (patch.voice !== undefined) dataPatch.voiceStatus = patch.voice
      if (patch.lipsync !== undefined) dataPatch.lipsyncStatus = patch.lipsync
      if (patch.approved !== undefined) dataPatch.approved = patch.approved
      if (Object.keys(dataPatch).length === 0) return

      startTransition(async () => {
        try {
          await updateShotAction({ shotId, ...dataPatch })
        } catch (error) {
          console.error("Failed to persist simulation update:", error)
        }
      })
    },
    [startTransition]
  )

  const handleGenerateFrames = useCallback(
    (shotId?: string) => {
      const targetShotId = shotId ?? selectedShot
      if (!targetShotId) return

      const now = Date.now()
      setRenderStartTimes((prev) => ({
        ...prev,
        [targetShotId]: { ...prev[targetShotId], frames: now },
      }))

      setFrameVersionByShot((prev) => ({ ...prev, [targetShotId]: now }))
      clearSimulationTimer(targetShotId, "frames")
      clearSimulationTimer(targetShotId, "video")
      updateSimulationState(targetShotId, { frames: "loading", video: "idle" })

      const timerId = window.setTimeout(() => {
        setFrameVersionByShot((prev) => ({ ...prev, [targetShotId]: Date.now() }))
        updateSimulationState(targetShotId, { frames: "ready", video: "idle" })
        delete simulationTimersRef.current[targetShotId]?.frames
      }, FRAMES_GENERATION_MS)

      simulationTimersRef.current[targetShotId] = {
        ...(simulationTimersRef.current[targetShotId] ?? {}),
        frames: timerId,
      }

      // Auto-advance to next shot so the writer can script the next beat while this one renders
      const currentShot = scenes.flatMap((s) => s.shots).find((s) => s.id === targetShotId)
      const nextShot = findNextShot(scenes, targetShotId)
      if (nextShot) {
        // Open sidebar before transitioning
        setPanelCollapsed(false)
        
        // Slight delay to let sidebar open animation start before switching content
        setTimeout(() => {
          handleShotSelect(nextShot.id)
          // Ensure sidebar stays open after shot selection (which normally collapses it)
          setPanelCollapsed(false)
          setActiveStepByShot((prev) => ({ ...prev, [nextShot.id]: "script" }))
          toast(`Shot ${currentShot?.number ?? "?"} rendering — let's script Shot ${nextShot.number}`, { duration: 5000 })
        }, 150)
      } else {
        toast("Generating frames...")
      }
    },
    [clearSimulationTimer, selectedShot, updateSimulationState, scenes, handleShotSelect]
  )

  const handleGenerateVideo = useCallback(
    (shotId?: string) => {
      const targetShotId = shotId ?? selectedShot
      if (!targetShotId) return
      const shotSimulation = simulationByShot[targetShotId] ?? DEFAULT_SIMULATION_STATE
      if (shotSimulation.frames !== "ready") return

      const now = Date.now()
      setRenderStartTimes((prev) => ({
        ...prev,
        [targetShotId]: { ...prev[targetShotId], video: now },
      }))

      clearSimulationTimer(targetShotId, "video")
      updateSimulationState(targetShotId, { video: "loading" })

      const timerId = window.setTimeout(() => {
        updateSimulationState(targetShotId, { video: "ready" })
        delete simulationTimersRef.current[targetShotId]?.video
      }, VIDEO_GENERATION_MS)

      simulationTimersRef.current[targetShotId] = {
        ...(simulationTimersRef.current[targetShotId] ?? {}),
        video: timerId,
      }

      // Auto-advance to next shot so the writer can script the next beat while this one renders
      const currentShot = scenes.flatMap((s) => s.shots).find((s) => s.id === targetShotId)
      const nextShot = findNextShot(scenes, targetShotId)
      if (nextShot) {
        handleShotSelect(nextShot.id)
        setActiveStepByShot((prev) => ({ ...prev, [nextShot.id]: "script" }))
        toast(`Shot ${currentShot?.number ?? "?"} video rendering — let's script Shot ${nextShot.number}`, { duration: 5000 })
      } else {
        toast("Generating video...")
      }
    },
    [clearSimulationTimer, selectedShot, simulationByShot, updateSimulationState, scenes, handleShotSelect]
  )

  const handleApproveShot = useCallback(() => {
    if (!selectedShot) return
    updateSimulationState(selectedShot, { approved: true })
  }, [selectedShot, updateSimulationState])

  const handleRegenerateVideo = useCallback(() => {
    if (!selectedShot) return
    clearSimulationTimer(selectedShot, "video")
    updateSimulationState(selectedShot, { video: "idle", approved: false })
    setActiveStepByShot((prev) => ({ ...prev, [selectedShot]: "video" }))
  }, [selectedShot, clearSimulationTimer, updateSimulationState])

  const handleGenerateVoice = useCallback(() => {
    if (!selectedShot) return
    const sim = simulationByShot[selectedShot] ?? DEFAULT_SIMULATION_STATE
    if (sim.voice === "loading" || sim.voice === "ready") return

    clearSimulationTimer(selectedShot, "voice")
    updateSimulationState(selectedShot, { voice: "loading" })

    const targetShotId = selectedShot
    const timerId = window.setTimeout(() => {
      updateSimulationState(targetShotId, { voice: "ready" })
      delete simulationTimersRef.current[targetShotId]?.voice
    }, 3000)

    simulationTimersRef.current[targetShotId] = {
      ...(simulationTimersRef.current[targetShotId] ?? {}),
      voice: timerId,
    }
  }, [selectedShot, simulationByShot, clearSimulationTimer, updateSimulationState])

  const handleApplyLipsync = useCallback(() => {
    if (!selectedShot) return
    const sim = simulationByShot[selectedShot] ?? DEFAULT_SIMULATION_STATE
    if (sim.voice !== "ready" || sim.lipsync === "loading" || sim.lipsync === "ready") return

    clearSimulationTimer(selectedShot, "lipsync")
    updateSimulationState(selectedShot, { lipsync: "loading" })

    const targetShotId = selectedShot
    const timerId = window.setTimeout(() => {
      updateSimulationState(targetShotId, { lipsync: "ready" })
      delete simulationTimersRef.current[targetShotId]?.lipsync
    }, 3000)

    simulationTimersRef.current[targetShotId] = {
      ...(simulationTimersRef.current[targetShotId] ?? {}),
      lipsync: timerId,
    }
  }, [selectedShot, simulationByShot, clearSimulationTimer, updateSimulationState])

  // Rewinds the entire project simulation back to the 37% seed state.
  // This is the only way to reset overall progress.
  const handleRewindAll = useCallback(() => {
    clearAllSimulationTimers()
    const seed = buildSeedSimulation(scenes, SIMULATION_SEED_PCT)
    setActiveStepByShot({})
    setFrameVersionByShot({})
    applySimulationSeed(seed)

    startTransition(async () => {
      try {
        await Promise.all(
          Object.entries(seed).map(([shotId, sim]) =>
            updateShotAction({
              shotId,
              framesStatus: sim.frames,
              videoStatus: sim.video,
              voiceStatus: sim.voice,
              lipsyncStatus: sim.lipsync,
              approved: sim.approved,
            })
          )
        )
      } catch (error) {
        console.error("Failed to persist rewind:", error)
      }
    })
  }, [clearAllSimulationTimers, scenes, applySimulationSeed, startTransition])

  /* ── Drag to resize (horizontal split) ─── */
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

  /* ── Drag to resize (movie-level horizontal split) ─── */
  const handleMovieResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsMovieDragging(true)
      const startX = e.clientX
      const startPct = movieLeftPct
      const container = contentRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX
        const deltaPct = (delta / containerWidth) * 100
        const next = Math.min(MAX_MOVIE_LEFT_PCT, Math.max(MIN_MOVIE_LEFT_PCT, startPct + deltaPct))
        setMovieLeftPct(next)
      }

      const onUp = () => {
        setIsMovieDragging(false)
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }

      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    },
    [movieLeftPct]
  )

  /* ── Drag to resize (timeline height) ─── */
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
      setScenes((prev) =>
        prev.map((scene) => ({
          ...scene,
          shots: scene.shots.map((shot) =>
            shot.id === currentShotId ? { ...shot, duration: safeValue } : shot
          ),
        }))
      )
      startTransition(async () => {
        try {
          await updateShotAction({ shotId: currentShotId, duration: safeValue })
        } catch (error) {
          console.error("Failed to persist duration update:", error)
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

  const handlePlayerTimeUpdate = useCallback((time: number, duration: number) => {
    const now = performance.now()
    if (now - lastTimelineUiUpdateMsRef.current < TIMELINE_UI_UPDATE_INTERVAL_MS) return
    lastTimelineUiUpdateMsRef.current = now

    setVideoCurrentTime((prev) => (Math.abs(prev - time) >= 0.04 ? time : prev))
    setVideoTotalDuration((prev) => (prev !== duration ? duration : prev))
  }, [])

  const allShots = useMemo(() => scenes.flatMap((scene) => scene.shots), [scenes])

  const timelineShots = useMemo(() => {
    if (editingLevel === "movie") return allShots
    return scenes.find((s) => s.id === selectedScene)?.shots ?? []
  }, [editingLevel, selectedScene, allShots, scenes])

  const allShotInputs = useMemo(
    (): ShotInput[] =>
      allShots.map((s) => ({
        id: s.id,
        videoUrl: s.videoUrl,
        duration: s.duration,
      })),
    [allShots]
  )

  const sceneShotInputs = useMemo(
    (): ShotInput[] =>
      (activeScene?.shots ?? []).map((s) => ({
        id: s.id,
        videoUrl: s.videoUrl,
        duration: s.duration,
      })),
    [activeScene]
  )

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

  // Auto-load actual video durations from metadata
  useEffect(() => {
    let cancelled = false
    const cleanups: Array<() => void> = []

    allShots.forEach((shot) => {
      if (!shot.videoUrl) return

      const video = document.createElement("video")
      video.preload = "metadata"
      video.src = shot.videoUrl

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

      const handleError = () => cleanup()

      const cleanup = () => {
        video.removeEventListener("loadedmetadata", handleLoaded)
        video.removeEventListener("error", handleError)
        video.src = ""
      }

      video.addEventListener("loadedmetadata", handleLoaded)
      video.addEventListener("error", handleError)
      cleanups.push(cleanup)
    })

    return () => {
      cancelled = true
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [allShots, setFixedDuration])

  // Auto-advance workflow step when generation completes
  useEffect(() => {
    Object.entries(simulationByShot).forEach(([shotId, sim]) => {
      if (sim.frames === "ready") {
        setActiveStepByShot((prev) => {
          if (!prev[shotId] || prev[shotId] === "script") {
            return { ...prev, [shotId]: "video" }
          }
          return prev
        })
      }
      if (sim.video === "ready") {
        setActiveStepByShot((prev) => {
          if (!prev[shotId] || prev[shotId] === "video") {
            return { ...prev, [shotId]: "polish" }
          }
          return prev
        })
      }
      // approved, voice, and lipsync do not auto-advance
    })
  }, [simulationByShot])

  const showTimeline = timelineShots.length > 0

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: "#000000" }}>
      <HeaderBar
        onRewindSimulation={handleRewindAll}
        renderingShots={renderingShots}
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
          style={{ flex: `0 0 ${showTimeline ? 100 - timelinePct : 100}%` }}
        >
          {/* Scene sidebar - only show at shot level */}
          {editingLevel === "shot" && (
            <SceneSidebar
              scenes={scenes}
              editingLevel={editingLevel}
              selectedSceneId={selectedScene}
              selectedShotId={selectedShot}
              simulationByShot={simulationByShot}
              isCollapsed={panelCollapsed}
              onCollapsedChange={handleToggleCollapse}
              onSceneSelect={handleSceneSelect}
              onShotSelect={handleShotSelect}
              onBackToMovie={handleBackToMovie}
              onBackToScene={handleBackToScene}
            />
          )}

          {/* Main content area */}
          <div ref={contentRef} className="flex flex-1 min-w-0 relative">
            {/* Prevent text selection while dragging */}
            <AnimatePresence>
              {(isDragging || isMovieDragging) && (
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
                  simulationByShot={simulationByShot}
                  onSceneSelect={handleSceneSelect}
                  widthPct={movieLeftPct}
                />

                {/* ── Movie Drag Handle ─────────────── */}
                <motion.div
                  onMouseDown={handleMovieResizeStart}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize movie panels"
                  aria-valuenow={Math.round(movieLeftPct)}
                  aria-valuemin={MIN_MOVIE_LEFT_PCT}
                  aria-valuemax={MAX_MOVIE_LEFT_PCT}
                  tabIndex={0}
                  className="resize-handle relative shrink-0"
                  style={{ width: "7px", cursor: "col-resize", zIndex: 10 }}
                  onHoverStart={() => setIsMovieHandleHovered(true)}
                  onHoverEnd={() => setIsMovieHandleHovered(false)}
                  animate={{ scale: isMovieDragging ? 1.03 : 1 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft")
                      setMovieLeftPct((p) => Math.max(MIN_MOVIE_LEFT_PCT, p - 1))
                    else if (e.key === "ArrowRight")
                      setMovieLeftPct((p) => Math.min(MAX_MOVIE_LEFT_PCT, p + 1))
                  }}
                >
                  <motion.div
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2"
                    animate={{
                      width: isMovieDragging ? 3 : isMovieHandleHovered ? 2 : 1,
                      backgroundColor: isMovieDragging
                        ? "#7A7A7A"
                        : isMovieHandleHovered
                          ? "#696969"
                          : "#232323",
                    }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    animate={{
                      opacity: isMovieDragging ? 1 : isMovieHandleHovered ? 0.6 : 0,
                      scaleY: isMovieDragging ? 1 : 0.92,
                    }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                  >
                    <div
                      className="rounded-full"
                      style={{ width: "5px", height: "32px", background: "#7A7A7A" }}
                    />
                  </motion.div>
                  <div className="absolute inset-y-0 -left-2 -right-2" />
                </motion.div>

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
                  simulationByShot={simulationByShot}
                  durationByShot={Object.fromEntries((activeScene?.shots ?? []).map((shot) => [shot.id, shot.duration]))}
                  onShotSelect={handleShotSelect}
                  onBackToMovie={handleBackToMovie}
                />
                <SceneRightPanel
                  shots={sceneShotInputs}
                  videoPlayerRef={framePreviewRef}
                  onTimeUpdate={handlePlayerTimeUpdate}
                  onPlayStateChange={setIsVideoPlaying}
                />
              </>
            )}

            {/* Shot editing (States 3–6) */}
            {editingLevel === "shot" && activeShot && activeScene ? (
              <>
                <ScriptPanel
                  shot={activeShot}
                  sceneNumber={activeScene.number}
                  shotIndex={activeShot.number}
                  durationDisplay={activeDurationDisplay}
                  widthPct={leftPct}
                  onUpdate={handleUpdateShot}
                  onDurationDisplayChange={handleDurationDisplayChange}
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
                  style={{ width: "7px", cursor: "col-resize", zIndex: 10 }}
                  onHoverStart={() => setIsResizeHandleHovered(true)}
                  onHoverEnd={() => setIsResizeHandleHovered(false)}
                  animate={{ scale: isDragging ? 1.03 : 1 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") setLeftPct((p) => Math.max(MIN_LEFT_PCT, p - 1))
                    else if (e.key === "ArrowRight") setLeftPct((p) => Math.min(MAX_LEFT_PCT, p + 1))
                  }}
                >
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
                      style={{ width: "5px", height: "32px", background: "#7A7A7A" }}
                    />
                  </motion.div>
                  <div className="absolute inset-y-0 -left-2 -right-2" />
                </motion.div>

                <ProductionPanel
                  shot={activeShot}
                  sceneNumber={activeScene.number}
                  shotNumber={activeShot.number}
                  simulation={activeSimulation}
                  currentStep={activeStep}
                  startFrameImageUrl={startFrameImageUrl}
                  widthPct={100 - leftPct}
                  onStepChange={handleStepChange}
                  onUpdate={handleUpdateShot}
                  onGenerateFrames={() => handleGenerateFrames(activeShot.id)}
                  onGenerateVideo={() => handleGenerateVideo(activeShot.id)}
                  onApproveShot={handleApproveShot}
                  onRegenerateVideo={handleRegenerateVideo}
                  onGenerateVoice={handleGenerateVoice}
                  onApplyLipsync={handleApplyLipsync}
                />
              </>
            ) : null}

            {/* Fallback: no content for this level */}
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
              if (e.key === "ArrowUp") setTimelinePct((p) => Math.min(MAX_TIMELINE_PCT, p + 1))
              else if (e.key === "ArrowDown") setTimelinePct((p) => Math.max(MIN_TIMELINE_PCT, p - 1))
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
                style={{ width: "32px", height: "5px", background: "#7A7A7A" }}
              />
            </motion.div>
            <div className="absolute inset-x-0 -top-2 -bottom-2" />
          </motion.div>
        )}

        {/* Full-width timeline */}
        {showTimeline && (
          <div
            className="min-h-0"
            style={{ flex: `0 0 ${timelinePct}%`, padding: "0" }}
          >
              <ShotTimeline
                shots={timelineShots}
                selectedShot={selectedShot}
                sceneNumber={activeScene?.number ?? 0}
                durationByShot={Object.fromEntries(timelineShots.map((shot) => [shot.id, shot.duration]))}
                onSelectShot={handleShotSelect}
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
