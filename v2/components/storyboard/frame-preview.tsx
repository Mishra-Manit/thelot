"use client"

import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { ImageIcon, Sparkles } from "lucide-react"
import { VideoPlayer, type VideoPlayerHandle } from "./video-player"
import { SpongebobLoading } from "./loading/spongebob-loading"
import { SimpsonLoading } from "./loading/simpson-loading"
import { PrincessLoading } from "./loading/princess-loading"

const MIN_TOP_PCT = 20
const MAX_TOP_PCT = 70

// Handle exposed to parent components for video control
export interface FramePreviewHandle {
  play: () => void
  pause: () => void
  seek: (seconds: number) => void
}

interface FramePreviewProps {
  sceneNumber: number | null
  shotNumber: number | null
  totalShots: number
  duration: number
  startFramePrompt: string
  shotTitle: string
  videoUrl: string
  isSaving?: boolean
  startFrameImageUrl: string
  endFrameImageUrl: string
  endFrameFallbackImageUrl: string
  isFramesLoading: boolean
  areFramesReady: boolean
  isVideoLoading: boolean
  onGenerateFrames: () => void
  onVideoTimeUpdate?: (time: number, duration: number) => void
  onVideoPlayStateChange?: (playing: boolean) => void
}

export const FramePreview = forwardRef<FramePreviewHandle, FramePreviewProps>(
  function FramePreview(
    {
      sceneNumber,
      shotNumber,
      totalShots,
      duration,
      startFramePrompt,
      shotTitle,
      videoUrl,
      isSaving = false,
      startFrameImageUrl,
      endFrameImageUrl,
      endFrameFallbackImageUrl,
      isFramesLoading,
      areFramesReady,
      isVideoLoading,
      onGenerateFrames,
      onVideoTimeUpdate,
      onVideoPlayStateChange,
    },
    ref
  ) {
    const hasShot = sceneNumber !== null && shotNumber !== null
    const [startHover, setStartHover] = useState(false)
    const [endHover, setEndHover] = useState(false)

    // Playback state driven by the VideoPlayer composition
    const playerRef = useRef<VideoPlayerHandle | null>(null)

    // Expose play/pause/seek to parent via forwardRef
    useImperativeHandle(ref, () => ({
      play: () => playerRef.current?.play(),
      pause: () => playerRef.current?.pause(),
      seek: (seconds: number) => playerRef.current?.seek(seconds),
    }))

    /* ── Vertical resize state ─── */
    const [topPct, setTopPct] = useState(30)
    const [isVDragging, setIsVDragging] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

  const handleVResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsVDragging(true)
      const startY = e.clientY
      const startPct = topPct
      const container = panelRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerHeight = containerRect.height

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientY - startY
        const deltaPct = (delta / containerHeight) * 100
        const next = Math.min(MAX_TOP_PCT, Math.max(MIN_TOP_PCT, startPct + deltaPct))
        setTopPct(next)
      }

      const onUp = () => {
        setIsVDragging(false)
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }

      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    },
    [topPct]
  )

  return (
    <div
      className="flex flex-col flex-1 min-w-0"
      style={{ background: "#000000" }}
    >
      {hasShot ? (
        <div ref={panelRef} className="flex flex-col flex-1 min-h-0" style={{ padding: "12px 12px 4px 12px" }}>
          {/* Prevent text selection while dragging */}
          {isVDragging && (
            <div className="fixed inset-0 z-50" style={{ cursor: "row-resize" }} />
          )}

          {/* Top: Start Frame + End Frame */}
          <div className="flex gap-2.5" style={{ flex: `0 0 ${topPct}%`, minHeight: 0 }}>
            {/* Start Frame */}
            <FrameCard
              label="Start Frame"
              sublabel={`S${sceneNumber}.${shotNumber}`}
              hover={startHover}
              onHover={setStartHover}
              prompt={startFramePrompt}
              imageUrl={startFrameImageUrl}
              isLoading={isFramesLoading}
              isReady={areFramesReady}
              onGenerate={onGenerateFrames}
            />
            {/* End Frame */}
            <FrameCard
              label="End Frame"
              sublabel={`S${sceneNumber}.${shotNumber}`}
              hover={endHover}
              onHover={setEndHover}
              prompt={startFramePrompt}
              imageUrl={endFrameImageUrl}
              fallbackImageUrl={endFrameFallbackImageUrl}
              isLoading={isFramesLoading}
              isReady={areFramesReady}
              onGenerate={onGenerateFrames}
              isEnd
            />
          </div>

          {/* ── Vertical Drag Handle ───────────────────── */}
          <div
            onMouseDown={handleVResizeStart}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize frames and video preview"
            aria-valuenow={Math.round(topPct)}
            aria-valuemin={MIN_TOP_PCT}
            aria-valuemax={MAX_TOP_PCT}
            tabIndex={0}
            className="v-resize-handle relative shrink-0"
            style={{
              height: "25px",
              cursor: "row-resize",
              zIndex: 10,
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                setTopPct((p) => Math.max(MIN_TOP_PCT, p - 1))
              } else if (e.key === "ArrowDown") {
                setTopPct((p) => Math.min(MAX_TOP_PCT, p + 1))
              }
            }}
          >
            {/* Visible rail */}
            <div
              className="v-resize-rail absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-150"
              style={{
                height: isVDragging ? "3px" : "1px",
                background: isVDragging ? "#7A7A7A" : "#232323",
              }}
            />
            {/* Hover / active indicator pill */}
            <div
              className="v-resize-pill absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150"
              style={{
                opacity: isVDragging ? 1 : 0,
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: "32px",
                  height: "5px",
                  background: "#7A7A7A",
                }}
              />
            </div>
            {/* Wider invisible hit area */}
            <div className="absolute inset-x-0 -top-2 -bottom-2" />
            <style>{`
              .v-resize-handle:hover .v-resize-rail {
                height: 2px !important;
                background: #696969 !important;
              }
              .v-resize-handle:hover .v-resize-pill {
                opacity: 0.6 !important;
              }
            `}</style>
          </div>

          {/* Bottom: Video Player */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div
              className="relative w-full h-full rounded-lg overflow-hidden"
              style={{ background: "#111111", border: "1px solid #232323" }}
            >
              {/* Video Preview label */}
              <div
                className="absolute top-3 left-3 z-20 flex items-center rounded-full cursor-default"
                style={{
                  background: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "4px 10px",
                }}
              >
                <span style={{ fontSize: "10px", color: "#ffffff", fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                  Video Preview
                </span>
              </div>

              <VideoPlayer
                videoUrl={videoUrl}
                onTimeUpdate={(cur, dur) => {
                  onVideoTimeUpdate?.(cur, dur)
                }}
                onPlayStateChange={(playing) => {
                  onVideoPlayStateChange?.(playing)
                }}
                playerRef={playerRef}
              />
              {isVideoLoading && (
                <div className="absolute inset-0 z-10">
                  <SpongebobLoading compact />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span style={{ fontSize: "11px", color: "#D9D9D9" }}>
            Select a shot
          </span>
        </div>
      )}
    </div>
  )
}
)

/* ── Frame Card ─────────────────────────── */

function FrameCard({
  label,
  sublabel,
  hover,
  onHover,
  prompt,
  imageUrl,
  fallbackImageUrl,
  isLoading = false,
  isReady = false,
  onGenerate,
  isEnd,
}: {
  label: string
  sublabel: string
  hover: boolean
  onHover: (v: boolean) => void
  prompt: string
  imageUrl: string
  fallbackImageUrl?: string
  isLoading?: boolean
  isReady?: boolean
  onGenerate?: () => void
  isEnd?: boolean
}) {
  const [imageError, setImageError] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl)

  useEffect(() => {
    setImageError(false)
    setCurrentImageUrl(imageUrl)
  }, [imageUrl])

  return (
    <div
      className="flex flex-col flex-1 rounded-lg overflow-hidden transition-all duration-150"
      style={{
        background: "#111111",
        border: hover ? "1px solid #696969" : "1px solid #232323",
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Image area */}
      <div className="flex-1 relative flex items-center justify-center" style={{ minHeight: "80px" }}>
        <div
          className="absolute top-2 left-2 z-20 flex items-center rounded-full cursor-default"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "4px 10px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
        </div>

        {/* Subtle gradient bg */}
        <div
          className="absolute inset-0"
          style={{
            background: isEnd
              ? "linear-gradient(135deg, #111111 0%, #232323 100%)"
              : "linear-gradient(135deg, #111111 0%, #232323 100%)",
          }}
        />

        {isLoading ? (
          isEnd ? <PrincessLoading /> : <SimpsonLoading />
        ) : isReady && currentImageUrl && !imageError ? (
          <img
            src={currentImageUrl}
            alt={`${label} preview`}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => {
              if (fallbackImageUrl && currentImageUrl !== fallbackImageUrl) {
                setCurrentImageUrl(fallbackImageUrl)
                return
              }
              setImageError(true)
            }}
          />
        ) : (
          <div className="relative flex flex-col items-center gap-2">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: "36px",
                height: "36px",
                background: isEnd
                  ? "rgba(87,87,87,0.12)"
                  : "rgba(105,105,105,0.15)",
                border: isEnd
                  ? "1px dashed rgba(87,87,87,0.25)"
                  : "1px dashed rgba(105,105,105,0.3)",
              }}
            >
              {isEnd ? (
                <ImageIcon size={14} style={{ color: "#575757" }} />
              ) : (
                <Sparkles size={14} style={{ color: "#696969" }} />
              )}
            </div>
            <span
              style={{
                fontSize: "10px",
                color: "#696969",
                textAlign: "center",
                maxWidth: "120px",
                lineHeight: "1.4",
              }}
            >
              {isReady && imageError ? "Frame preview unavailable" : "Generate frame from prompt"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

