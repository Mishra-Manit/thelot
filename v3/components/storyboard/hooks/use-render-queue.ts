"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import type { ShotSimulationState, WorkflowStep, RenderingShot } from "@/lib/storyboard-types"
import type { RenderJobMetadata } from "./use-simulation-timers"

const RENDER_PILL_COMPLETE_HOLD_MS = 450

interface UseRenderQueueOptions {
  simulationByShot: Record<string, ShotSimulationState>
  renderStartTimes: Record<string, { frames?: RenderJobMetadata; video?: RenderJobMetadata }>
  /** Map from shot ID to shot data (number, etc.) */
  shotById: Map<string, { id: string; number: number }>
}

interface UseRenderQueueReturn {
  /** Array of shots currently being rendered, used to populate header bar pills */
  renderingShots: RenderingShot[]
}

const FRAMES_GENERATION_MS = 20_000
const VIDEO_GENERATION_MS = 22_500

/**
 * Tracks which render jobs are in progress and holds completed pills
 * visible for a short duration so the user sees the "done" state
 * before the pill disappears.
 */
export function useRenderQueue({
  simulationByShot,
  renderStartTimes,
  shotById,
}: UseRenderQueueOptions): UseRenderQueueReturn {
  const [completedHoldUntil, setCompletedHoldUntil] = useState<Record<string, number>>({})
  const holdTimersRef = useRef<Record<string, number>>({})
  const previousSimRef = useRef(simulationByShot)

  /** Schedule a pill to remain visible for RENDER_PILL_COMPLETE_HOLD_MS after it completes */
  const markPillComplete = useCallback((shotId: string, type: "frames" | "video") => {
    const key = `${shotId}:${type}`
    const until = Date.now() + RENDER_PILL_COMPLETE_HOLD_MS

    const existingTimer = holdTimersRef.current[key]
    if (existingTimer !== undefined) window.clearTimeout(existingTimer)

    setCompletedHoldUntil((prev) => ({ ...prev, [key]: until }))

    holdTimersRef.current[key] = window.setTimeout(() => {
      setCompletedHoldUntil((prev) => {
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
      delete holdTimersRef.current[key]
    }, RENDER_PILL_COMPLETE_HOLD_MS)
  }, [])

  // Detect transitions from "loading" to any other state and hold the pill
  useEffect(() => {
    const previous = previousSimRef.current
    Object.entries(simulationByShot).forEach(([shotId, current]) => {
      const prev = previous[shotId]
      if (!prev) return
      if (prev.frames === "loading" && current.frames !== "loading") markPillComplete(shotId, "frames")
      if (prev.video === "loading" && current.video !== "loading") markPillComplete(shotId, "video")
    })
    previousSimRef.current = simulationByShot
  }, [simulationByShot, markPillComplete])

  // Clean up hold timers on unmount
  useEffect(() => {
    return () => {
      Object.values(holdTimersRef.current).forEach((timerId) => window.clearTimeout(timerId))
      holdTimersRef.current = {}
    }
  }, [])

  const renderingShots = useMemo<RenderingShot[]>(() => {
    const now = Date.now()
    const result: RenderingShot[] = []

    for (const [shotId, sim] of Object.entries(simulationByShot)) {
      const shot = shotById.get(shotId)
      if (!shot) continue
      const times = renderStartTimes[shotId]

      // Frames pill
      const framesHoldUntil = completedHoldUntil[`${shotId}:frames`] ?? 0
      if ((sim.frames === "loading" || framesHoldUntil > now) && times?.frames) {
        result.push({
          shotId,
          shotNumber: shot.number,
          type: "frames",
          originStep: times.frames.originStep,
          startedAt: times.frames.startedAt,
          durationMs: FRAMES_GENERATION_MS,
          isComplete: sim.frames !== "loading",
        })
      }

      // Video pill
      const videoHoldUntil = completedHoldUntil[`${shotId}:video`] ?? 0
      if ((sim.video === "loading" || videoHoldUntil > now) && times?.video) {
        result.push({
          shotId,
          shotNumber: shot.number,
          type: "video",
          originStep: times.video.originStep,
          startedAt: times.video.startedAt,
          durationMs: VIDEO_GENERATION_MS,
          isComplete: sim.video !== "loading",
        })
      }
    }

    return result
  }, [simulationByShot, renderStartTimes, shotById, completedHoldUntil])

  return { renderingShots }
}
