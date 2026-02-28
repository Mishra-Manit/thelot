"use client"

import { useState, useCallback, useRef, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { updateShotAction } from "@/app/storyboard/actions"
import { findNextShot } from "@/lib/storyboard-utils"
import type {
  StoryboardScene,
  StoryboardShotUpdateInput,
  ShotSimulationState,
  WorkflowStep,
} from "@/lib/storyboard-types"

const FRAMES_GENERATION_MS = 20_000
const VIDEO_GENERATION_MS = 22_500

type SimulationTimerKey = "frames" | "video" | "voice" | "lipsync"

const DEFAULT_SIMULATION_STATE: ShotSimulationState = {
  frames: "idle",
  video: "idle",
  approved: false,
  voice: "idle",
  lipsync: "idle",
}

/** Build initial simulation state from persisted shot data */
function buildSimulationFromShots(scenes: StoryboardScene[]): Record<string, ShotSimulationState> {
  return Object.fromEntries(
    scenes.flatMap((s) => s.shots).map((shot) => [
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

/** Metadata tracked per render job (for render queue pills) */
export type RenderJobMetadata = { startedAt: number; originStep: WorkflowStep }

/** Toast data for the "generating, work on next shot" notification */
export interface GeneratingToastData {
  id: string
  number: number
  message: string
}

interface UseSimulationTimersOptions {
  scenes: StoryboardScene[]
  selectedShot: string | null
  activeStepByShot: Record<string, WorkflowStep>
}

interface UseSimulationTimersReturn {
  simulationByShot: Record<string, ShotSimulationState>
  applySimulationSeed: (seed: Record<string, ShotSimulationState>) => void
  renderStartTimes: Record<string, { frames?: RenderJobMetadata; video?: RenderJobMetadata }>
  frameVersionByShot: Record<string, number>
  generatingToastShot: GeneratingToastData | null
  dismissGeneratingToast: () => void
  handleGenerateFrames: (shotId?: string, originStep?: WorkflowStep) => void
  handleGenerateVideo: (
    shotId?: string,
    originStep?: WorkflowStep,
    /** Called after starting generation so the editor can reset playback */
    onVideoStarted?: () => void
  ) => void
  handleApproveShot: () => void
  handleRegenerateVideo: () => void
  handleGenerateVoice: () => void
  handleApplyLipsync: () => void
}

/**
 * Manages simulation state for all shots and the client-side timers
 * that simulate asset generation (frames, video, voice, lipsync).
 *
 * Each "generate" handler:
 * 1. Sets the target phase to "loading"
 * 2. Starts a timeout that transitions to "ready"
 * 3. Persists the state change via server action
 * 4. Shows a toast suggesting the user work on the next shot
 */
export function useSimulationTimers({
  scenes,
  selectedShot,
  activeStepByShot,
}: UseSimulationTimersOptions): UseSimulationTimersReturn {
  const [, startTransition] = useTransition()
  const [simulationByShot, setSimulationByShot] = useState<Record<string, ShotSimulationState>>(
    () => buildSimulationFromShots(scenes)
  )
  const [frameVersionByShot, setFrameVersionByShot] = useState<Record<string, number>>({})
  const [renderStartTimes, setRenderStartTimes] = useState<
    Record<string, { frames?: RenderJobMetadata; video?: RenderJobMetadata }>
  >({})
  const [generatingToastShot, setGeneratingToastShot] = useState<GeneratingToastData | null>(null)

  const timersRef = useRef<Record<string, Partial<Record<SimulationTimerKey, number>>>>({})

  // -- Timer helpers --

  const clearTimer = useCallback((shotId: string, key: SimulationTimerKey) => {
    const shotTimers = timersRef.current[shotId]
    const timerId = shotTimers?.[key]
    if (timerId === undefined) return
    window.clearTimeout(timerId)
    delete shotTimers[key]
    const hasRemaining = (["frames", "video", "voice", "lipsync"] as SimulationTimerKey[]).some(
      (k) => shotTimers[k] !== undefined
    )
    if (!hasRemaining) delete timersRef.current[shotId]
  }, [])

  const startTimer = useCallback(
    (shotId: string, key: SimulationTimerKey, durationMs: number, onComplete: () => void) => {
      const timerId = window.setTimeout(() => {
        onComplete()
        delete timersRef.current[shotId]?.[key]
      }, durationMs)
      timersRef.current[shotId] = { ...(timersRef.current[shotId] ?? {}), [key]: timerId }
    },
    []
  )

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((shotTimers) => {
        if (shotTimers.frames !== undefined) window.clearTimeout(shotTimers.frames)
        if (shotTimers.video !== undefined) window.clearTimeout(shotTimers.video)
        if (shotTimers.voice !== undefined) window.clearTimeout(shotTimers.voice)
        if (shotTimers.lipsync !== undefined) window.clearTimeout(shotTimers.lipsync)
      })
      timersRef.current = {}
    }
  }, [])

  // -- Persist simulation changes to the server --

  const updateSimulation = useCallback(
    (shotId: string, patch: Partial<ShotSimulationState>) => {
      setSimulationByShot((prev) => ({
        ...prev,
        [shotId]: { ...(prev[shotId] ?? DEFAULT_SIMULATION_STATE), ...patch },
      }))

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

  /** Show a "work on next shot" toast, or a generic fallback for the last shot */
  const showNextShotToast = useCallback(
    (currentShotId: string, message: string) => {
      const nextShot = findNextShot(scenes, currentShotId)
      if (nextShot) {
        setGeneratingToastShot({ id: nextShot.id, number: nextShot.number, message })
      } else {
        toast(message.replace("estimated", "~"))
      }
    },
    [scenes]
  )

  // -- Generation handlers --

  const handleGenerateFrames = useCallback(
    (shotId?: string, originStep?: WorkflowStep) => {
      const targetId = shotId ?? selectedShot
      if (!targetId) return

      showNextShotToast(targetId, "Your start frame is generating, estimated 20 seconds.")

      const now = Date.now()
      const step = originStep ?? activeStepByShot[targetId] ?? "script"
      setRenderStartTimes((prev) => ({
        ...prev,
        [targetId]: { ...prev[targetId], frames: { startedAt: now, originStep: step } },
      }))

      setFrameVersionByShot((prev) => ({ ...prev, [targetId]: now }))
      clearTimer(targetId, "frames")
      clearTimer(targetId, "video")
      updateSimulation(targetId, { frames: "loading", video: "idle" })

      startTimer(targetId, "frames", FRAMES_GENERATION_MS, () => {
        setFrameVersionByShot((prev) => ({ ...prev, [targetId]: Date.now() }))
        updateSimulation(targetId, { frames: "ready", video: "idle" })
      })
    },
    [activeStepByShot, clearTimer, selectedShot, showNextShotToast, startTimer, updateSimulation]
  )

  const handleGenerateVideo = useCallback(
    (shotId?: string, originStep?: WorkflowStep, onVideoStarted?: () => void) => {
      const targetId = shotId ?? selectedShot
      if (!targetId) return
      const sim = simulationByShot[targetId] ?? DEFAULT_SIMULATION_STATE
      if (sim.frames !== "ready") return

      showNextShotToast(targetId, "Your video is generating, estimated 22 seconds.")

      const now = Date.now()
      const step = originStep ?? activeStepByShot[targetId] ?? "video"
      setRenderStartTimes((prev) => ({
        ...prev,
        [targetId]: { ...prev[targetId], video: { startedAt: now, originStep: step } },
      }))

      clearTimer(targetId, "video")
      updateSimulation(targetId, { video: "loading" })
      onVideoStarted?.()

      startTimer(targetId, "video", VIDEO_GENERATION_MS, () => {
        updateSimulation(targetId, { video: "ready" })
      })
    },
    [activeStepByShot, clearTimer, selectedShot, showNextShotToast, simulationByShot, startTimer, updateSimulation]
  )

  const handleApproveShot = useCallback(() => {
    if (!selectedShot) return
    updateSimulation(selectedShot, { approved: true })
  }, [selectedShot, updateSimulation])

  const handleRegenerateVideo = useCallback(() => {
    if (!selectedShot) return
    clearTimer(selectedShot, "video")
    updateSimulation(selectedShot, { video: "idle", approved: false })
  }, [selectedShot, clearTimer, updateSimulation])

  const handleGenerateVoice = useCallback(() => {
    if (!selectedShot) return
    const sim = simulationByShot[selectedShot] ?? DEFAULT_SIMULATION_STATE
    if (sim.voice === "loading" || sim.voice === "ready") return

    clearTimer(selectedShot, "voice")
    updateSimulation(selectedShot, { voice: "loading" })

    const targetId = selectedShot
    startTimer(targetId, "voice", 3000, () => {
      updateSimulation(targetId, { voice: "ready" })
    })
  }, [selectedShot, simulationByShot, clearTimer, startTimer, updateSimulation])

  const handleApplyLipsync = useCallback(() => {
    if (!selectedShot) return
    const sim = simulationByShot[selectedShot] ?? DEFAULT_SIMULATION_STATE
    if (sim.voice !== "ready" || sim.lipsync === "loading" || sim.lipsync === "ready") return

    clearTimer(selectedShot, "lipsync")
    updateSimulation(selectedShot, { lipsync: "loading" })

    const targetId = selectedShot
    startTimer(targetId, "lipsync", 3000, () => {
      updateSimulation(targetId, { lipsync: "ready" })
    })
  }, [selectedShot, simulationByShot, clearTimer, startTimer, updateSimulation])

  const applySimulationSeed = useCallback((seed: Record<string, ShotSimulationState>) => {
    setSimulationByShot(seed)
  }, [])

  const dismissGeneratingToast = useCallback(() => {
    setGeneratingToastShot(null)
  }, [])

  return {
    simulationByShot,
    applySimulationSeed,
    renderStartTimes,
    frameVersionByShot,
    generatingToastShot,
    dismissGeneratingToast,
    handleGenerateFrames,
    handleGenerateVideo,
    handleApproveShot,
    handleRegenerateVideo,
    handleGenerateVoice,
    handleApplyLipsync,
  }
}
