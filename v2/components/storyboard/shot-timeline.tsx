"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Plus, Play, Pause, Minus, Maximize2 } from "lucide-react"
import type { StoryboardShot, ShotLayout } from "@/lib/storyboard-types"
import type { VideoSource as VideoSourceType } from "@diffusionstudio/core"

// Format time as M:SS
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

// Compute layout positions for all shots
function computeLayout(shots: StoryboardShot[], totalDuration: number): ShotLayout[] {
  let cursor = 0
  return shots.map((shot) => {
    const layout: ShotLayout = {
      shot,
      startSec: cursor,
      leftPct: totalDuration > 0 ? (cursor / totalDuration) * 100 : 0,
      widthPct: totalDuration > 0 ? (shot.duration / totalDuration) * 100 : 0,
    }
    cursor += shot.duration
    return layout
  })
}

// Draw ruler tick marks on canvas
function drawRuler(
  canvas: HTMLCanvasElement,
  totalDuration: number,
  zoom: number,
  containerWidth: number
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx || totalDuration <= 0) return

  const dpr = window.devicePixelRatio ?? 1
  const w = containerWidth * zoom
  const h = 24

  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  // Background
  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, w, h)

  // Adaptive tick interval based on pixel density
  const pxPerSec = w / totalDuration
  const majorInterval = pxPerSec >= 80 ? 1 : pxPerSec >= 40 ? 2 : pxPerSec >= 20 ? 5 : 10
  const minorInterval = majorInterval >= 5 ? 1 : 0.5

  // Draw ticks
  for (let t = 0; t <= totalDuration; t += minorInterval) {
    const x = (t / totalDuration) * w
    const isMajor = t % majorInterval === 0

    ctx.beginPath()
    ctx.moveTo(x, h)
    ctx.lineTo(x, isMajor ? h - 10 : h - 5)
    ctx.strokeStyle = isMajor ? "#777076" : "#404556"
    ctx.lineWidth = 1
    ctx.stroke()

    if (isMajor && t < totalDuration) {
      ctx.fillStyle = "#777076"
      ctx.font = "9px system-ui, sans-serif"
      ctx.fillText(formatTime(t), x + 3, 10)
    }
  }
}

// Extract a single thumbnail frame from a video URL
async function extractThumbnail(videoUrl: string, duration: number): Promise<string | null> {
  try {
    const core = await import("@diffusionstudio/core")
    const source = await core.Source.from<VideoSourceType>(videoUrl)
    const midpoint = duration / 2
    for await (const frame of source.thumbnailsInRange({
      start: midpoint,
      end: midpoint + 0.1,
      count: 1,
      width: 200,
      height: 80,
    })) {
      if (frame) return frame.canvas.toDataURL()
    }
    return null
  } catch {
    return null
  }
}

// Generate pseudo-random waveform bars based on shot ID
function generateWaveformBars(shotId: string): number[] {
  const seed = shotId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return Array.from({ length: 24 }, (_, i) => 25 + ((seed * (i + 1) * 7) % 50))
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
  onSelectShot,
  currentTime,
  totalDuration,
  isPlaying,
  onPlayPause,
  onSeek,
}: ShotTimelineProps) {
  // Compute scene total from shot durations
  const sceneTotalDuration = useMemo(
    () => shots.reduce((sum, shot) => sum + shot.duration, 0),
    [shots]
  )
  const effectiveDuration = totalDuration > 0 ? totalDuration : sceneTotalDuration

  // Compute layout for all shots
  const layouts = useMemo(
    () => computeLayout(shots, effectiveDuration),
    [shots, effectiveDuration]
  )

  // State
  const [zoom, setZoom] = useState(1)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const rulerCanvasRef = useRef<HTMLCanvasElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const thumbnailCache = useRef<Map<string, string>>(new Map())
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const canControlPlayback = effectiveDuration > 0

  // Zoom handlers
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(1, z - 0.25)), [])
  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(4, z + 0.25)), [])
  const handleFit = useCallback(() => setZoom(1), [])

  // Draw ruler on mount and when zoom/duration changes
  useEffect(() => {
    const canvas = rulerCanvasRef.current
    const container = containerRef.current
    if (!canvas || !container || effectiveDuration <= 0) return

    const containerWidth = container.clientWidth - 12 // Account for gutter
    drawRuler(canvas, effectiveDuration, zoom, containerWidth)
  }, [effectiveDuration, zoom])

  // Update playhead position via direct DOM mutation
  useEffect(() => {
    const playhead = playheadRef.current
    const track = trackRef.current
    if (!playhead || !track || effectiveDuration <= 0) return

    const clampedTime = Math.max(0, Math.min(currentTime, effectiveDuration))
    const offset = (clampedTime / effectiveDuration) * track.scrollWidth
    playhead.style.transform = `translateX(${offset}px)`
  }, [currentTime, effectiveDuration, zoom])

  // Extract thumbnails for shots with video URLs
  useEffect(() => {
    let cancelled = false

    shots.forEach(async (shot) => {
      if (!shot.videoUrl) return
      if (thumbnailCache.current.has(shot.id)) {
        const cached = thumbnailCache.current.get(shot.id)
        const pill = pillRefs.current.get(shot.id)
        if (pill && cached) pill.style.backgroundImage = `url(${cached})`
        return
      }

      const thumbnail = await extractThumbnail(shot.videoUrl, shot.duration)
      if (cancelled || !thumbnail) return

      thumbnailCache.current.set(shot.id, thumbnail)
      const pill = pillRefs.current.get(shot.id)
      if (pill) pill.style.backgroundImage = `url(${thumbnail})`
    })

    return () => { cancelled = true }
  }, [shots])

  // Playhead drag handler
  const handlePlayheadDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const track = trackRef.current
      if (!track || effectiveDuration <= 0) return

      const seekFromEvent = (ev: MouseEvent) => {
        const rect = track.getBoundingClientRect()
        const x = ev.clientX - rect.left + track.scrollLeft
        const clamped = Math.max(0, Math.min(x, track.scrollWidth))
        const seekTime = (clamped / track.scrollWidth) * effectiveDuration
        
        // Update playhead immediately for smoothness
        if (playheadRef.current) {
          playheadRef.current.style.transform = `translateX(${clamped}px)`
        }
        onSeek(seekTime)
      }

      const onMove = (ev: MouseEvent) => seekFromEvent(ev)
      const onUp = () => {
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }

      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    },
    [effectiveDuration, onSeek]
  )

  // Click-to-seek on ruler or empty track areas
  const handleSeekClick = useCallback(
    (e: React.MouseEvent) => {
      const track = trackRef.current
      if (!track || effectiveDuration <= 0) return
      if ((e.target as HTMLElement).closest("button")) return

      const rect = track.getBoundingClientRect()
      const x = e.clientX - rect.left + track.scrollLeft
      const seekTime = (x / track.scrollWidth) * effectiveDuration
      onSeek(Math.max(0, Math.min(seekTime, effectiveDuration)))
    },
    [effectiveDuration, onSeek]
  )

  // Pill click handler - selects and seeks
  const handlePillClick = useCallback(
    (shotId: string, startSec: number) => {
      onSelectShot(shotId)
      onSeek(startSec)
    },
    [onSelectShot, onSeek]
  )

  return (
    <div
      ref={containerRef}
      className="h-full min-h-0 flex flex-col"
      style={{ background: "#000000" }}
    >
      {/* Control Bar */}
      <div className="flex items-center gap-4 h-10 border-b border-[#252933] bg-black px-4 shrink-0">
        {/* Left: SPLIT button placeholder */}
        <button
          className="shrink-0 transition-colors duration-150"
          style={{
            padding: "4px 10px",
            borderRadius: "4px",
            background: "#1A1C25",
            border: "1px solid #252933",
            color: "#404556",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            cursor: "not-allowed",
          }}
          disabled
        >
          SPLIT
        </button>

        {/* Center: Time + Play/Pause */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <span style={{ fontSize: "12px", color: "#777076", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
            {formatTime(currentTime)}
          </span>

          <button
            className="flex items-center justify-center rounded-full transition-all duration-150 hover:bg-[#252933]"
            style={{
              width: "28px",
              height: "28px",
              background: "transparent",
              cursor: canControlPlayback ? "pointer" : "not-allowed",
              color: canControlPlayback ? "#FFFFFF" : "#404556"
            }}
            onClick={canControlPlayback ? onPlayPause : undefined}
            disabled={!canControlPlayback}
          >
            {isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <span style={{ fontSize: "12px", color: "#777076", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
            {formatTime(effectiveDuration)}
          </span>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center transition-colors duration-150 hover:text-white"
            style={{
              width: "24px",
              height: "24px",
              color: zoom > 1 ? "#777076" : "#252933",
              cursor: zoom > 1 ? "pointer" : "not-allowed",
            }}
            onClick={zoom > 1 ? handleZoomOut : undefined}
            disabled={zoom <= 1}
          >
            <Minus size={14} />
          </button>

          <input
            type="range"
            min={1}
            max={4}
            step={0.25}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="zoom-slider"
            style={{ width: "80px", height: "4px", cursor: "pointer" }}
          />

          <button
            className="flex items-center justify-center transition-colors duration-150 hover:text-white"
            style={{
              width: "24px",
              height: "24px",
              color: zoom < 4 ? "#777076" : "#252933",
              cursor: zoom < 4 ? "pointer" : "not-allowed",
            }}
            onClick={zoom < 4 ? handleZoomIn : undefined}
            disabled={zoom >= 4}
          >
            <Plus size={14} />
          </button>

          <button
            className="flex items-center gap-1 transition-colors duration-150 hover:bg-[#252933]"
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              background: "transparent",
              color: "#777076",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              cursor: "pointer",
            }}
            onClick={handleFit}
          >
            <Maximize2 size={12} />
            FIT
          </button>
        </div>
      </div>

      {/* Timeline Area */}
      {shots.length === 0 ? (
        <div className="flex-1 flex items-center justify-center" style={{ color: "#404556", fontSize: "12px" }}>
          No shots in this scene
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Ruler Row */}
          <div className="flex shrink-0 border-b border-[#252933]" style={{ height: "24px", background: "#000000" }}>
            <div className="shrink-0" style={{ width: "12px" }} />
            <div className="flex-1 relative overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <canvas
                ref={rulerCanvasRef}
                style={{ display: "block", width: `${zoom * 100}%`, minWidth: "100%" }}
              />
              {/* Playhead diamond handle */}
              <div
                ref={playheadRef}
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{ left: 0, width: "2px", willChange: "transform" }}
              >
                <div
                  className="absolute cursor-ew-resize pointer-events-auto"
                  style={{
                    top: "12px",
                    left: "50%",
                    transform: "translateX(-50%) rotate(45deg)",
                    width: "8px",
                    height: "8px",
                    background: "#386775",
                    border: "1.5px solid #20504E",
                  }}
                  onMouseDown={handlePlayheadDrag}
                />
              </div>
            </div>
          </div>

          {/* Tracks Container */}
          <div
            ref={trackRef}
            className="flex-1 min-h-0 flex flex-col relative overflow-x-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#404556 #000000" }}
            onClick={handleSeekClick}
          >
            {/* Video Track */}
            <div className="flex shrink-0 border-b border-[#252933]" style={{ height: "64px", background: "#000000" }}>
              <div
                className="shrink-0 flex items-center justify-center border-r border-[#252933]"
                style={{ width: "12px", fontSize: "8px", color: "#404556", fontWeight: 600 }}
              >
                V
              </div>
              <div
                className="flex-1 relative"
                style={{ width: `${zoom * 100}%`, minWidth: "100%" }}
              >
                {layouts.map((layout) => {
                  const isSelected = selectedShot === layout.shot.id
                  return (
                    <button
                      key={layout.shot.id}
                      ref={(el) => {
                        if (el) pillRefs.current.set(layout.shot.id, el)
                        else pillRefs.current.delete(layout.shot.id)
                      }}
                      className="absolute top-[2px] bottom-[2px] transition-all duration-150"
                      style={{
                        left: `${layout.leftPct}%`,
                        width: `calc(${layout.widthPct}% - 4px)`,
                        minWidth: "40px",
                        borderRadius: "4px",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "#1A1C25",
                        border: isSelected ? "1px solid #60515C" : "1px solid #252933",
                        opacity: isSelected ? 1 : 0.8,
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.opacity = "1" }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.opacity = "0.8" }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePillClick(layout.shot.id, layout.startSec)
                      }}
                    >
                      {/* Gradient overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)",
                          borderRadius: "3px",
                        }}
                      />
                      {/* Metadata */}
                      <div className="absolute bottom-1 left-2 right-2 flex justify-between pointer-events-none">
                        <span
                          className="truncate"
                          style={{ fontSize: "10px", fontWeight: 500, color: "#fff", maxWidth: "70%" }}
                        >
                          {layout.shot.number} {layout.shot.title || "Untitled"}
                        </span>
                        <span style={{ fontSize: "9px", color: "#A3A3A3", flexShrink: 0, marginLeft: "4px" }}>
                          {layout.shot.duration}s
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Audio Track */}
            <div className="flex shrink-0 border-b border-[#252933]" style={{ height: "40px", background: "#000000" }}>
              <div
                className="shrink-0 flex items-center justify-center border-r border-[#252933]"
                style={{ width: "12px", fontSize: "8px", color: "#404556", fontWeight: 600 }}
              >
                A
              </div>
              <div
                className="flex-1 relative"
                style={{ width: `${zoom * 100}%`, minWidth: "100%" }}
              >
                {layouts.map((layout) => {
                  const isSelected = selectedShot === layout.shot.id
                  const bars = generateWaveformBars(layout.shot.id)
                  return (
                    <button
                      key={`audio-${layout.shot.id}`}
                      className="absolute top-[2px] bottom-[2px] overflow-hidden transition-all duration-150"
                      style={{
                        left: `${layout.leftPct}%`,
                        width: `calc(${layout.widthPct}% - 4px)`,
                        minWidth: "40px",
                        borderRadius: "4px",
                        backgroundColor: "#1A1C25",
                        border: isSelected ? "1px solid #60515C" : "1px solid #252933",
                        opacity: isSelected ? 1 : 0.8,
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.opacity = "1" }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.opacity = "0.8" }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePillClick(layout.shot.id, layout.startSec)
                      }}
                    >
                      {/* Fake waveform bars */}
                      <div className="absolute inset-0 flex items-center justify-around px-2">
                        {bars.map((h, i) => (
                          <div
                            key={i}
                            style={{
                              width: "2px",
                              height: `${h}%`,
                              backgroundColor: "#404556",
                              opacity: 0.5,
                              borderRadius: "1px",
                            }}
                          />
                        ))}
                      </div>
                      {/* Title */}
                      <span
                        className="absolute left-2 top-1/2 -translate-y-1/2 truncate pointer-events-none"
                        style={{ fontSize: "9px", color: "#777076", maxWidth: "60%" }}
                      >
                        {layout.shot.title || "Audio"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Playhead line spanning both tracks */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: "12px",
                width: "1px",
                background: "#597D7C",
                transform: playheadRef.current?.style.transform ?? "translateX(0px)",
                zIndex: 20,
              }}
            />
          </div>
        </div>
      )}

      {/* Slider thumb styling */}
      <style>{`
        .zoom-slider {
          -webkit-appearance: none;
          appearance: none;
          background: #252933;
          border-radius: 2px;
        }
        .zoom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
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
