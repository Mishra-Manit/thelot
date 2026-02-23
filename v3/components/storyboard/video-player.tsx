"use client"

import { useEffect, useRef, useImperativeHandle } from "react"
import { Play } from "lucide-react"
import type { Composition as CompositionType, VideoSource as VideoSourceType } from "@diffusionstudio/core"
import type { ShotInput } from "@/lib/storyboard-types"

export interface VideoPlayerHandle {
  play: () => void
  pause: () => void
  seek: (seconds: number) => void
}

interface VideoPlayerProps {
  shots: ShotInput[]
  onTimeUpdate: (current: number, duration: number) => void
  onPlayStateChange: (playing: boolean) => void
  playerRef: React.RefObject<VideoPlayerHandle | null>
}

const COMP_WIDTH = 1920
const COMP_HEIGHT = 1080

export function VideoPlayer({
  shots,
  onTimeUpdate,
  onPlayStateChange,
  playerRef,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const compositionRef = useRef<CompositionType | null>(null)

  // Store callbacks in refs for stable access
  const onTimeUpdateRef = useRef(onTimeUpdate)
  onTimeUpdateRef.current = onTimeUpdate
  const onPlayStateChangeRef = useRef(onPlayStateChange)
  onPlayStateChangeRef.current = onPlayStateChange

  // Expose play/pause/seek to parent
  useImperativeHandle(playerRef, () => ({
    play() {
      compositionRef.current?.play()
    },
    pause() {
      compositionRef.current?.pause()
      onPlayStateChangeRef.current(false)
    },
    seek(seconds: number) {
      const composition = compositionRef.current
      if (composition) {
        composition.seek(seconds)
        onTimeUpdateRef.current(seconds, composition.duration)
      }
    },
  }))

  // Scale canvas to fit container while preserving aspect ratio
  useEffect(() => {
    const container = containerRef.current
    const mount = mountRef.current
    if (!container || !mount) return

    const observer = new ResizeObserver(() => {
      const scale = Math.min(
        container.clientWidth / COMP_WIDTH,
        container.clientHeight / COMP_HEIGHT
      )
      mount.style.transform = `scale(${scale})`
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Build composition with all playable shots
  useEffect(() => {
    const playableShots = shots.filter((s) => s.videoUrl)
    if (playableShots.length === 0 || !mountRef.current) return

    let cancelled = false

    async function init() {
      const { Composition, VideoClip, Source, Layer } = await import("@diffusionstudio/core")

      if (cancelled || !mountRef.current) return

      // Tear down previous composition
      compositionRef.current?.unmount()

      const composition = new Composition({ width: COMP_WIDTH, height: COMP_HEIGHT })
      composition.mount(mountRef.current)

      // Create sequential layer for all clips
      const layer = new Layer({ mode: "SEQUENTIAL" })
      await composition.add(layer)

      // Load and add all video clips
      for (const shot of playableShots) {
        if (cancelled) {
          composition.unmount()
          return
        }

        try {
          const source = await Source.from<VideoSourceType>(shot.videoUrl)
          const clip = new VideoClip(source, { position: "center", width: "100%" })
          await layer.add(clip)
        } catch (error) {
          console.error(`Failed to load video for shot ${shot.id}:`, error)
        }
      }

      if (cancelled) {
        composition.unmount()
        return
      }

      // Wire playback events
      composition.on("playback:time", (time) => {
        onTimeUpdateRef.current(time ?? 0, composition.duration)
      })
      composition.on("playback:start", () => onPlayStateChangeRef.current(true))
      composition.on("playback:end", () => onPlayStateChangeRef.current(false))

      compositionRef.current = composition
    }

    init().catch(console.error)

    return () => {
      cancelled = true
      compositionRef.current?.unmount()
      compositionRef.current = null
    }
  }, [shots])

  const hasPlayableShots = shots.some((s) => s.videoUrl)

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: hasPlayableShots ? "#000" : "transparent" }}
    >
      <div
        ref={mountRef}
        style={{ width: COMP_WIDTH, height: COMP_HEIGHT, transformOrigin: "center" }}
      />

      {!hasPlayableShots && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center gap-2 rounded-lg"
            style={{
              padding: "6px 14px",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(105,105,105,0.25)",
            }}
          >
            <Play size={12} style={{ color: "#696969" }} />
            <span style={{ fontSize: "11px", color: "#D9D9D9" }}>
              No video clips available
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
