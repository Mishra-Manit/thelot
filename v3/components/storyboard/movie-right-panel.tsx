"use client"

import { useRef, useImperativeHandle } from "react"
import type { VideoPlayerHandle } from "./video-player"
import type { FramePreviewHandle } from "./frame-preview"
import { VideoPlayer } from "./video-player"
import type { ShotInput } from "@/lib/storyboard-types"

interface MovieRightPanelProps {
  shots: ShotInput[]
  videoPlayerRef: React.RefObject<FramePreviewHandle | null>
  onTimeUpdate: (time: number, duration: number) => void
  onPlayStateChange: (playing: boolean) => void
}

export function MovieRightPanel({
  shots,
  videoPlayerRef,
  onTimeUpdate,
  onPlayStateChange,
}: MovieRightPanelProps) {
  const playerRef = useRef<VideoPlayerHandle | null>(null)

  useImperativeHandle(videoPlayerRef, () => ({
    play: () => playerRef.current?.play(),
    pause: () => playerRef.current?.pause(),
    seek: (s: number) => playerRef.current?.seek(s),
  }))

  return (
    <div className="flex flex-col flex-1 min-w-0" style={{ background: "#000000" }}>
      {/* Video preview */}
      <div className="flex-1 min-h-0 relative" style={{ padding: "16px 16px 8px 16px" }}>
        <div
          className="relative w-full h-full rounded-lg overflow-hidden"
          style={{ background: "#111111", border: "1px solid #232323" }}
        >
          <VideoPlayer
            shots={shots}
            onTimeUpdate={onTimeUpdate}
            onPlayStateChange={onPlayStateChange}
            playerRef={playerRef}
          />
        </div>
      </div>

      {/* Movie controls (disabled placeholders) */}
      <div className="flex items-center gap-2 px-4 pb-3">
        {MOVIE_CONTROLS.map((label) => (
          <button
            key={label}
            disabled
            className="flex-1 rounded-md"
            style={{
              padding: "8px 0",
              fontSize: "11px",
              color: "#ffffff",
              background: "#111111",
              border: "1px solid #464646",
              opacity: 0.8,
              cursor: "not-allowed",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 text-center">
        <span style={{ fontSize: "11px", color: "#696969" }}>
          Select a scene below to drill into scene-level editing
        </span>
      </div>
    </div>
  )
}

const MOVIE_CONTROLS = ["Add Soundtrack", "Color Grading", "Export Full Movie"]
