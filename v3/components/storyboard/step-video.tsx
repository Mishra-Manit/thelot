"use client"

import { useCallback, useEffect, useImperativeHandle, useRef } from "react"
import { Film, RefreshCw, Check } from "lucide-react"
import { SpongebobLoading } from "./loading/spongebob-loading"
import type { FramePreviewHandle } from "./frame-preview"

interface StepVideoProps {
  videoUrl: string
  isVideoLoading: boolean
  isApproved: boolean
  videoPlayerRef: React.RefObject<FramePreviewHandle | null>
  onTimeUpdate: (time: number, duration: number) => void
  onPlayStateChange: (playing: boolean) => void
  onRegenerateVideo: () => void
  onApproveShot: () => void
}

export function StepVideo({
  videoUrl,
  isVideoLoading,
  isApproved,
  videoPlayerRef,
  onTimeUpdate,
  onPlayStateChange,
  onRegenerateVideo,
  onApproveShot,
}: StepVideoProps) {
  const isDisabled = isVideoLoading
  const videoRef = useRef<HTMLVideoElement>(null)

  const emitVideoTime = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const duration = Number.isFinite(video.duration) ? video.duration : 0
    onTimeUpdate(video.currentTime, duration)
  }, [onTimeUpdate])

  useImperativeHandle(
    videoPlayerRef,
    () => ({
      play: () => {
        const video = videoRef.current
        if (!video) return
        video.play().catch(() => undefined)
      },
      pause: () => {
        const video = videoRef.current
        if (!video) return
        video.pause()
        onPlayStateChange(false)
      },
      seek: (seconds: number) => {
        const video = videoRef.current
        if (!video) return
        const duration = Number.isFinite(video.duration) ? video.duration : 0
        const nextTime = duration > 0 ? Math.max(0, Math.min(seconds, duration)) : Math.max(0, seconds)
        video.currentTime = nextTime
        onTimeUpdate(nextTime, duration)
      },
    }),
    [videoPlayerRef, onPlayStateChange, onTimeUpdate]
  )

  useEffect(() => {
    if (isVideoLoading || !videoUrl) {
      onPlayStateChange(false)
      onTimeUpdate(0, 0)
      return
    }

    const video = videoRef.current
    if (!video) return
    const duration = Number.isFinite(video.duration) ? video.duration : 0
    onPlayStateChange(!video.paused && !video.ended)
    onTimeUpdate(video.currentTime, duration)
  }, [isVideoLoading, onPlayStateChange, onTimeUpdate, videoUrl])

  useEffect(() => {
    return () => onPlayStateChange(false)
  }, [onPlayStateChange])

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ padding: "16px" }}>

      {/* Video preview area */}
      <div
        className="flex items-center justify-center rounded-lg overflow-hidden"
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          background: "#111111",
          border: `1px solid ${isApproved ? "#696969" : "#232323"}`,
          borderRadius: "8px",
          marginBottom: "12px",
        }}
      >
        {isVideoLoading ? (
          <SpongebobLoading compact />
        ) : videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            preload="metadata"
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            onLoadedMetadata={emitVideoTime}
            onTimeUpdate={emitVideoTime}
            onPlay={() => onPlayStateChange(true)}
            onPause={() => onPlayStateChange(false)}
            onEnded={() => onPlayStateChange(false)}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(105,105,105,0.12)",
                border: `1px solid #575757`,
                borderRadius: "10px",
              }}
            >
              <Film size={22} color="#696969" />
            </div>
            <span style={{ fontSize: "13px", color: "#696969", fontWeight: 500 }}>
              No video yet
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Regenerate — secondary */}
        <button
          type="button"
          onClick={onRegenerateVideo}
          disabled={isDisabled}
          className="flex items-center justify-center gap-2 transition-all duration-150"
          style={{
            background: "transparent",
            border: `1px solid ${isDisabled ? "#404040" : "#232323"}`,
            borderRadius: "8px",
            padding: "11px 16px",
            color: isDisabled ? "#404040" : "#696969",
            fontSize: "11px",
            textTransform: "uppercase",
            fontWeight: 600,
            letterSpacing: "0.05em",
            cursor: isDisabled ? "not-allowed" : "pointer",
            flex: "0 0 auto",
          }}
          onMouseEnter={(e) => {
            if (isDisabled) return
            e.currentTarget.style.borderColor = "#696969"
            e.currentTarget.style.color = "#D9D9D9"
          }}
          onMouseLeave={(e) => {
            if (isDisabled) return
            e.currentTarget.style.borderColor = "#232323"
            e.currentTarget.style.color = "#696969"
          }}
        >
          <RefreshCw size={13} />
          REGENERATE
        </button>

        {/* Approve Shot — primary */}
        <button
          type="button"
          onClick={onApproveShot}
          disabled={isDisabled || isApproved}
          className="flex flex-1 items-center justify-center gap-2 transition-all duration-150"
          style={{
            background: "transparent",
            border: `1px solid ${isApproved ? "#696969" : isDisabled ? "#404040" : "#D9D9D9"}`,
            borderRadius: "8px",
            padding: "11px 16px",
            color: isApproved ? "#696969" : isDisabled ? "#404040" : "#D9D9D9",
            fontSize: "11px",
            textTransform: "uppercase",
            fontWeight: 600,
            letterSpacing: "0.05em",
            cursor: isDisabled || isApproved ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (isDisabled || isApproved) return
            e.currentTarget.style.background = "rgba(255,255,255,0.04)"
            e.currentTarget.style.borderColor = "#ffffff"
            e.currentTarget.style.color = "#ffffff"
          }}
          onMouseLeave={(e) => {
            if (isDisabled || isApproved) return
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.borderColor = "#D9D9D9"
            e.currentTarget.style.color = "#D9D9D9"
          }}
        >
          {isApproved && <Check size={13} />}
          {isApproved ? "SHOT APPROVED" : "APPROVE SHOT"}
        </button>
      </div>
    </div>
  )
}
