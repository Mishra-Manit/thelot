"use client"

import { useEffect, useRef, useImperativeHandle } from "react"
import { Play } from "lucide-react"
// Type-only import: used purely for TypeScript annotations, never at runtime.
// The actual runtime values come from the dynamic import() below.
import type {
  Composition as CompositionType,
  VideoSource as VideoSourceType,
} from "@diffusionstudio/core"

export interface VideoPlayerHandle {
  play: () => void
  pause: () => void
  seek: (seconds: number) => void
}

interface VideoPlayerProps {
  videoUrl: string
  onTimeUpdate: (current: number, duration: number) => void
  onPlayStateChange: (playing: boolean) => void
  playerRef: React.RefObject<VideoPlayerHandle | null>
}

// Composition pixel dimensions — drives aspect ratio scaling
const COMP_WIDTH = 1920
const COMP_HEIGHT = 1080

export function VideoPlayer({
  videoUrl,
  onTimeUpdate,
  onPlayStateChange,
  playerRef,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)

  // Holds the live composition across renders without triggering re-renders
  const compositionRef = useRef<CompositionType | null>(null)

  // Expose play / pause / seek to the parent via the forwarded ref
  useImperativeHandle(playerRef, () => ({
    play() {
      compositionRef.current?.play()
    },
    pause() {
      compositionRef.current?.pause()
    },
    seek(seconds: number) {
      compositionRef.current?.seek(seconds)
    },
  }))

  // Scale the fixed-size mount div to fit the container while preserving aspect ratio
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

  // Build the composition whenever videoUrl changes
  useEffect(() => {
    if (!videoUrl || !mountRef.current) return

    let cancelled = false

    async function init() {
      // Dynamically import so Next.js doesn't attempt to bundle browser-only APIs on the server
      const { Composition, VideoClip, Source } = await import(
        "@diffusionstudio/core"
      )

      if (cancelled || !mountRef.current) return

      // Tear down any previous composition
      compositionRef.current?.unmount()

      const composition = new Composition({ width: COMP_WIDTH, height: COMP_HEIGHT })

      // Mount before loading content so the canvas is in the DOM
      composition.mount(mountRef.current)

      const source = await Source.from<VideoSourceType>(videoUrl)
      if (cancelled) {
        composition.unmount()
        return
      }

      const layer = composition.createLayer()
      await composition.add(layer)
      await layer.add(new VideoClip(source, { position: "center", width: "100%" }))

      // Wire playback events to parent callbacks
      composition.on("playback:time", (time) => {
        onTimeUpdate(time ?? 0, composition.duration)
      })

      composition.on("playback:end", () => {
        onPlayStateChange(false)
      })

      compositionRef.current = composition
    }

    init().catch(console.error)

    return () => {
      cancelled = true
      compositionRef.current?.unmount()
      compositionRef.current = null
    }
  }, [videoUrl]) // eslint-disable-line react-hooks/exhaustive-deps
  // onTimeUpdate / onPlayStateChange are stable setter functions from useState — intentionally omitted

  // Always render containerRef and mountRef so the ResizeObserver starts on the
  // very first mount — even when videoUrl is initially empty (e.g. while loading).
  // If we early-returned without refs, the observer would never attach and scaling
  // would never fire once a URL arrived later.
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: videoUrl ? "#000" : "transparent" }}
    >
      {/* Fixed-resolution canvas — CSS scale applied by ResizeObserver */}
      <div
        ref={mountRef}
        style={{
          width: COMP_WIDTH,
          height: COMP_HEIGHT,
          transformOrigin: "center",
        }}
      />

      {/* Empty state — shown as overlay when there is no video */}
      {!videoUrl && (
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
              No video clip selected
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
