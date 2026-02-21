"use client"

import { useState, useCallback, useRef } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ImageIcon,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { VideoPlayer, type VideoPlayerHandle } from "./video-player"

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

const MIN_TOP_PCT = 20
const MAX_TOP_PCT = 70

interface FramePreviewProps {
  sceneNumber: number | null
  shotNumber: number | null
  totalShots: number
  duration: number
  startFramePrompt: string
  shotTitle: string
  videoUrl: string
  isSaving?: boolean
}

export function FramePreview({
  sceneNumber,
  shotNumber,
  totalShots,
  duration,
  startFramePrompt,
  shotTitle,
  videoUrl,
  isSaving = false,
}: FramePreviewProps) {
  const hasShot = sceneNumber !== null && shotNumber !== null
  const [startHover, setStartHover] = useState(false)
  const [endHover, setEndHover] = useState(false)

  // Playback state driven by the VideoPlayer composition
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef<VideoPlayerHandle | null>(null)

  /* ── Vertical resize state ─── */
  const [topPct, setTopPct] = useState(45)
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
      style={{ background: "#0D0E14" }}
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
              showRegenerate
            />
            {/* End Frame */}
            <FrameCard
              label="End Frame"
              sublabel={`S${sceneNumber}.${shotNumber}`}
              hover={endHover}
              onHover={setEndHover}
              prompt={startFramePrompt}
              isEnd
              showRegenerate
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
                background: isVDragging ? "#555B6E" : "#252933",
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
                  background: "#555B6E",
                }}
              />
            </div>
            {/* Wider invisible hit area */}
            <div className="absolute inset-x-0 -top-2 -bottom-2" />
            <style>{`
              .v-resize-handle:hover .v-resize-rail {
                height: 2px !important;
                background: #404556 !important;
              }
              .v-resize-handle:hover .v-resize-pill {
                opacity: 0.6 !important;
              }
            `}</style>
          </div>

          {/* Bottom: Video Player */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div
              className="relative w-full h-full rounded-lg overflow-hidden flex flex-col"
              style={{ background: "#0f1018", border: "1px solid #252933" }}
            >
              {/* Video label bar */}
              <div
                className="flex items-center justify-between"
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #252933",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="rounded"
                    style={{
                      width: "6px",
                      height: "6px",
                      background: "#404556",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#ffffff", fontWeight: 500 }}>
                    Video Preview
                  </span>
                  <span style={{ fontSize: "10px", color: "#404556" }}>
                    {shotTitle}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#777076",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  Scene {sceneNumber} / Shot {shotNumber} of {totalShots}
                </span>
              </div>

              {/* Video content area */}
              <div className="flex-1 relative">
                <VideoPlayer
                  videoUrl={videoUrl}
                  onTimeUpdate={(cur, dur) => {
                    setCurrentTime(cur)
                    setTotalDuration(dur)
                  }}
                  onPlayStateChange={setIsPlaying}
                  playerRef={playerRef}
                />
              </div>

              {/* Playback controls */}
              <div
                className="flex items-center justify-center gap-4"
                style={{
                  padding: "10px 12px",
                  borderTop: "1px solid #1a1c25",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "#404556",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatTime(currentTime)}
                </span>

                {/* Progress bar */}
                <div className="flex-1 relative" style={{ height: "3px" }}>
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: "#1a1c25" }}
                  />
                  <div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{
                      background: "#404556",
                      width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
                    }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="transition-colors duration-150"
                    style={{ color: "#404556" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#ffffff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#404556")
                    }
                    onClick={() => playerRef.current?.seek(0)}
                    aria-label="Skip back"
                  >
                    <SkipBack size={13} />
                  </button>
                  <button
                    className="flex items-center justify-center rounded-full transition-colors duration-150"
                    style={{
                      width: "28px",
                      height: "28px",
                      background: "#404556",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#555B6E")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#404556")
                    }
                    onClick={() => {
                      if (isPlaying) {
                        playerRef.current?.pause()
                        setIsPlaying(false)
                      } else {
                        playerRef.current?.play()
                        setIsPlaying(true)
                      }
                    }}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause size={12} style={{ color: "#0D0E14" }} />
                    ) : (
                      <Play
                        size={12}
                        style={{ color: "#0D0E14", marginLeft: "1px" }}
                      />
                    )}
                  </button>
                  <button
                    className="transition-colors duration-150"
                    style={{ color: "#404556" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#ffffff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#404556")
                    }
                    onClick={() => playerRef.current?.seek(totalDuration)}
                    aria-label="Skip forward"
                  >
                    <SkipForward size={13} />
                  </button>
                </div>

                <span
                  style={{
                    fontSize: "10px",
                    color: "#404556",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {isSaving ? "Saving..." : formatTime(totalDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span style={{ fontSize: "11px", color: "#777076" }}>
            Select a shot
          </span>
        </div>
      )}
    </div>
  )
}

/* ── Frame Card ─────────────────────────── */

function FrameCard({
  label,
  sublabel,
  hover,
  onHover,
  prompt,
  isEnd,
  showRegenerate,
}: {
  label: string
  sublabel: string
  hover: boolean
  onHover: (v: boolean) => void
  prompt: string
  isEnd?: boolean
  showRegenerate?: boolean
}) {
  return (
    <div
      className="flex flex-col flex-1 rounded-lg overflow-hidden transition-all duration-150"
      style={{
        background: "#0f1018",
        border: hover ? "1px solid #404556" : "1px solid #252933",
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "7px 10px",
          borderBottom: "1px solid #252933",
        }}
      >
        <div className="flex items-center gap-1.5">
          <ImageIcon size={11} style={{ color: isEnd ? "#60515C" : "#404556" }} />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "0.02em",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: "9px",
              color: "#404556",
              marginLeft: "2px",
            }}
          >
            {sublabel}
          </span>
        </div>
        {showRegenerate && (
          <button
            className="flex items-center gap-1 rounded-full transition-colors duration-150"
            style={{
              padding: "4px 10px",
              background: "rgba(64,69,86,0.18)",
              border: "1px solid rgba(64,69,86,0.45)",
              color: "#C7CEDA",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(64,69,86,0.28)"
              e.currentTarget.style.borderColor = "rgba(64,69,86,0.65)"
              e.currentTarget.style.color = "#FFFFFF"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(64,69,86,0.18)"
              e.currentTarget.style.borderColor = "rgba(64,69,86,0.45)"
              e.currentTarget.style.color = "#C7CEDA"
            }}
            aria-label="Regenerate frame"
          >
            <RefreshCw size={10} />
            <span
              style={{
                fontSize: "9px",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              Regenerate
            </span>
          </button>
        )}
      </div>

      {/* Image area */}
      <div className="flex-1 relative flex items-center justify-center" style={{ minHeight: "80px" }}>
        {/* Subtle gradient bg */}
        <div
          className="absolute inset-0"
          style={{
            background: isEnd
              ? "linear-gradient(135deg, #0f1018 0%, #14121a 100%)"
              : "linear-gradient(135deg, #0f1018 0%, #131520 100%)",
          }}
        />

        {/* Empty state */}
        <div className="relative flex flex-col items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: "36px",
              height: "36px",
              background: isEnd
                ? "rgba(96,81,92,0.1)"
                : "rgba(64,69,86,0.15)",
              border: isEnd
                ? "1px dashed rgba(96,81,92,0.25)"
                : "1px dashed rgba(64,69,86,0.3)",
            }}
          >
            {isEnd ? (
              <ImageIcon size={14} style={{ color: "#60515C" }} />
            ) : (
              <Sparkles size={14} style={{ color: "#404556" }} />
            )}
          </div>
          <span style={{ fontSize: "10px", color: "#404556", textAlign: "center", maxWidth: "110px", lineHeight: "1.4" }}>
            {"Generate frame from prompt"}
          </span>
        </div>
      </div>
    </div>
  )
}
