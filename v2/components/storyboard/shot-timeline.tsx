"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Plus, Play, Pause, Minus, Maximize2 } from "lucide-react"
import type { StoryboardShot } from "@/lib/storyboard-types"
import type { VideoSource as VideoSourceType } from "@diffusionstudio/core"

// Format time as MM:SS
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(1, "0")}:${String(s).padStart(2, "0")}`
}

// Extract a single thumbnail frame from a video URL using diffusion-core
async function extractThumbnail(videoUrl: string): Promise<string | null> {
  try {
    const core = await import("@diffusionstudio/core")
    const source = await core.Source.from<VideoSourceType>(videoUrl)
    for await (const frame of source.thumbnailsInRange({
      start: 0,
      end: 1,
      count: 1,
      width: 160,
      height: 60,
    })) {
      if (frame) return frame.canvas.toDataURL()
    }
    return null
  } catch {
    return null
  }
}

interface ShotTimelineProps {
  shots: StoryboardShot[]
  selectedShot: string | null
  sceneNumber: number
  onSelectShot: (shotId: string) => void
  currentTime: number
  totalDuration: number
  isPlaying: boolean
  onPlayPause: () => void
  onSeek: (seconds: number) => void
}

export function ShotTimeline({
  shots,
  selectedShot,
  sceneNumber,
  onSelectShot,
  currentTime,
  totalDuration,
  isPlaying,
  onPlayPause,
  onSeek,
}: ShotTimelineProps) {
  // Calculate scene total from shot durations
  const sceneTotalDuration = shots.reduce((sum, shot) => sum + shot.duration, 0)

  // Zoom state: 1 = fit all, >1 = zoomed in
  const [zoom, setZoom] = useState(1)

  // Refs for direct DOM manipulation
  const stripContainerRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const thumbnailCache = useRef<Map<string, string>>(new Map())

  // Can control playback if we have a valid duration
  const canControlPlayback = totalDuration > 0

  // Handle zoom controls
  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(1, z - 0.25))
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(4, z + 0.25))
  }, [])

  const handleFit = useCallback(() => {
    setZoom(1)
  }, [])

  // Click-to-seek on the pill strip
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = stripContainerRef.current
      if (!container || sceneTotalDuration === 0) return

      // Only seek if clicking on the container itself, not on a pill
      if ((e.target as HTMLElement).closest("button")) return

      const rect = container.getBoundingClientRect()
      const scrollLeft = container.scrollLeft
      const clickX = e.clientX - rect.left + scrollLeft
      const containerWidth = container.scrollWidth

      const clickedTime = (clickX / containerWidth) * sceneTotalDuration
      onSeek(Math.max(0, Math.min(sceneTotalDuration, clickedTime)))
    },
    [sceneTotalDuration, onSeek]
  )

  // Update playhead position via direct DOM mutation (no re-render)
  useEffect(() => {
    const playhead = playheadRef.current
    const container = stripContainerRef.current
    if (!playhead || !container) return

    // Clamp currentTime to valid range and calculate position
    const effectiveDuration = sceneTotalDuration > 0 ? sceneTotalDuration : 1
    const clampedTime = Math.max(0, Math.min(currentTime, effectiveDuration))
    const offset = (clampedTime / effectiveDuration) * container.scrollWidth
    playhead.style.transform = `translateX(${offset}px)`
  }, [currentTime, sceneTotalDuration, zoom])

  // Async thumbnail extraction - fires once per shot, caches results
  useEffect(() => {
    let cancelled = false

    shots.forEach(async (shot) => {
      if (!shot.videoUrl) return
      if (thumbnailCache.current.has(shot.id)) {
        // Apply cached thumbnail if pill exists
        const pill = pillRefs.current.get(shot.id)
        const cached = thumbnailCache.current.get(shot.id)
        if (pill && cached) {
          pill.style.backgroundImage = `url(${cached})`
        }
        return
      }

      const thumbnail = await extractThumbnail(shot.videoUrl)
      if (cancelled || !thumbnail) return

      thumbnailCache.current.set(shot.id, thumbnail)
      const pill = pillRefs.current.get(shot.id)
      if (pill) {
        pill.style.backgroundImage = `url(${thumbnail})`
      }
    })

    return () => {
      cancelled = true
    }
  }, [shots])

  return (
    <div
      className="h-full min-h-0 flex flex-col rounded-xl"
      style={{
        background: "#000000",
        padding: "6px 16px 12px",
      }}
    >
      {/* Control Bar */}
      <div className="flex items-center gap-4 mb-3">
        {/* Left: SPLIT button (placeholder) */}
        <button
          className="flex items-center justify-center shrink-0 transition-colors duration-150"
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            background: "#252933",
            border: "1px solid #404556",
            color: "#FFFFFF",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            cursor: "not-allowed",
            opacity: 0.5,
          }}
          disabled
          aria-label="Split shot (coming soon)"
        >
          SPLIT
        </button>

        {/* Center: Time + Play/Pause */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <span
            style={{
              fontSize: "12px",
              color: "#777076",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 500,
            }}
          >
            {formatTime(currentTime)}
          </span>

          <button
            className="flex items-center justify-center rounded-full transition-all duration-150"
            style={{
              width: "32px",
              height: "32px",
              background: canControlPlayback ? "#FFFFFF" : "#252933",
              cursor: canControlPlayback ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (canControlPlayback) e.currentTarget.style.background = "#D9D9D9"
            }}
            onMouseLeave={(e) => {
              if (canControlPlayback) e.currentTarget.style.background = "#FFFFFF"
            }}
            onClick={canControlPlayback ? onPlayPause : undefined}
            disabled={!canControlPlayback}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={14} style={{ color: "#000000" }} />
            ) : (
              <Play size={14} style={{ color: "#000000", marginLeft: "2px" }} />
            )}
          </button>

          <span
            style={{
              fontSize: "12px",
              color: "#777076",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 500,
            }}
          >
            {formatTime(sceneTotalDuration)}
          </span>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center transition-colors duration-150"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              background: zoom > 1 ? "#252933" : "transparent",
              color: zoom > 1 ? "#777076" : "#404556",
              cursor: zoom > 1 ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (zoom > 1) e.currentTarget.style.color = "#FFFFFF"
            }}
            onMouseLeave={(e) => {
              if (zoom > 1) e.currentTarget.style.color = "#777076"
            }}
            onClick={zoom > 1 ? handleZoomOut : undefined}
            disabled={zoom <= 1}
            aria-label="Zoom out"
          >
            <Minus size={14} />
          </button>

          {/* Zoom slider */}
          <input
            type="range"
            min={1}
            max={4}
            step={0.25}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="zoom-slider"
            style={{
              width: "80px",
              height: "4px",
              appearance: "none",
              background: "#252933",
              borderRadius: "2px",
              cursor: "pointer",
            }}
            aria-label="Zoom level"
          />

          <button
            className="flex items-center justify-center transition-colors duration-150"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              background: zoom < 4 ? "#252933" : "transparent",
              color: zoom < 4 ? "#777076" : "#404556",
              cursor: zoom < 4 ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (zoom < 4) e.currentTarget.style.color = "#FFFFFF"
            }}
            onMouseLeave={(e) => {
              if (zoom < 4) e.currentTarget.style.color = "#777076"
            }}
            onClick={zoom < 4 ? handleZoomIn : undefined}
            disabled={zoom >= 4}
            aria-label="Zoom in"
          >
            <Plus size={14} />
          </button>

          <button
            className="flex items-center justify-center transition-colors duration-150"
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              background: "#252933",
              border: "1px solid #404556",
              color: "#FFFFFF",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#404556"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#252933"
            }}
            onClick={handleFit}
            aria-label="Fit all shots to view"
          >
            <Maximize2 size={12} style={{ marginRight: "4px" }} />
            FIT
          </button>
        </div>
      </div>

      {/* Scrollable Strip Container */}
      <div
        ref={stripContainerRef}
        className="flex-1 relative overflow-x-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#404556 #000000",
        }}
        onClick={handleTimelineClick}
      >
        {/* Pill strip with zoom scaling */}
        <div
          className="flex items-center gap-1 relative h-full"
          style={{
            width: zoom === 1 ? "100%" : `${zoom * 100}%`,
            minWidth: "100%",
            minHeight: "60px",
          }}
        >
          {/* Playhead cursor */}
          <div
            ref={playheadRef}
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              width: "1px",
              background: "#777076",
              transform: "translateX(0px)",
              willChange: "transform",
              zIndex: 20,
              left: 0,
            }}
          >
            {/* Triangle indicator at top */}
            <div
              style={{
                position: "absolute",
                top: "-6px",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "6px solid #777076",
              }}
            />
          </div>

          {/* Shot pills */}
          {shots.length === 0 ? (
            <div
              className="flex items-center justify-center flex-1"
              style={{
                color: "#404556",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              No shots in this scene
            </div>
          ) : (
            shots.map((shot) => {
              const isSelected = selectedShot === shot.id
              // Ensure minimum flex value to prevent zero-width pills
            const flexValue = Math.max(shot.duration, 0.5)
            return (
              <button
                key={shot.id}
                ref={(el) => {
                  if (el) pillRefs.current.set(shot.id, el)
                  else pillRefs.current.delete(shot.id)
                }}
                className="relative flex items-end overflow-hidden transition-all duration-150 shrink-0"
                style={{
                  flex: flexValue,
                  minWidth: "50px",
                  height: "60px",
                  borderRadius: "20px",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "#1A1C25",
                  border: isSelected ? "2px solid #404556" : "2px solid transparent",
                  boxShadow: isSelected ? "0 0 10px #40455644" : "none",
                  opacity: isSelected ? 1 : 0.65,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.opacity = "0.9"
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.opacity = "0.65"
                }}
                onClick={(e) => {
                  e.stopPropagation() // Prevent timeline click-to-seek
                  onSelectShot(shot.id)
                }}
              >
                {/* Dark gradient overlay for text legibility */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: isSelected
                      ? "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 100%)"
                      : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 100%)",
                  }}
                />

                {/* Bottom-aligned metadata row */}
                <div
                  className="relative z-10 w-full flex items-end justify-between pointer-events-none"
                  style={{ padding: "0 10px 8px" }}
                >
                  {/* Shot number + title */}
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: isSelected ? "#FFFFFF" : "#D9D9D9",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "70%",
                      lineHeight: 1.2,
                    }}
                  >
                    {shot.number} {shot.title || "Untitled"}
                  </span>

                  {/* Duration */}
                  <span
                    style={{
                      fontSize: "10px",
                      color: isSelected ? "#D9D9D9" : "#777076",
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1.2,
                      flexShrink: 0,
                      marginLeft: "8px",
                    }}
                  >
                    {shot.duration}s
                  </span>
                </div>
              </button>
            )
          })
          )}

          {/* Add shot button */}
          <button
            className="flex items-center justify-center shrink-0 transition-colors duration-150"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "20px",
              background: "#1A1C25",
              border: "1px dashed #404556",
              color: "#404556",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#252933"
              e.currentTarget.style.color = "#777076"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1A1C25"
              e.currentTarget.style.color = "#404556"
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label="Add shot"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Slider thumb styling */}
      <style>{`
        .zoom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #777076;
          cursor: pointer;
          border: none;
        }
        .zoom-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #777076;
          cursor: pointer;
          border: none;
        }
        .zoom-slider:hover::-webkit-slider-thumb {
          background: #FFFFFF;
        }
        .zoom-slider:hover::-moz-range-thumb {
          background: #FFFFFF;
        }
      `}</style>
    </div>
  )
}
