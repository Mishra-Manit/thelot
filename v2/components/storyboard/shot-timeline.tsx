"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Plus, Play, Pause, Minus, Maximize2 } from "lucide-react"
import type { StoryboardShot, ShotLayout } from "@/lib/storyboard-types"
import type { VideoSource as VideoSourceType } from "@diffusionstudio/core"

// Sidebar width constant
const SIDEBAR_WIDTH = 60
const TIMELINE_RIGHT_PADDING = 12
const RULER_HEIGHT = 24
const RULER_DOT_SIZE = 3
const RULER_DOT_OFFSET = 3
const TIMELINE_RESIZE_HANDLE_HEIGHT = 24
const ZOOM_CONTROLS_Y_OFFSET =
  (RULER_DOT_OFFSET + RULER_DOT_SIZE / 2 - TIMELINE_RESIZE_HANDLE_HEIGHT / 2) / 2

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
    const duration = Math.max(1, Math.round(shot.duration))
    const layout: ShotLayout = {
      shot,
      duration,
      startSec: cursor,
      leftPct: totalDuration > 0 ? (cursor / totalDuration) * 100 : 0,
      widthPct: totalDuration > 0 ? (duration / totalDuration) * 100 : 0,
    }
    cursor += duration
    return layout
  })
}

// Generate ruler marks (Opus Clip style: numbers with dots between)
function generateRulerMarks(totalDuration: number, containerWidth: number, zoom: number): { time: number; isNumber: boolean }[] {
  if (totalDuration <= 0) return []
  
  const totalWidth = containerWidth * zoom
  const pxPerSec = totalWidth / totalDuration
  
  // Determine major interval (where numbers appear) based on pixel density
  const majorInterval = pxPerSec >= 80 ? 5 : pxPerSec >= 40 ? 10 : pxPerSec >= 20 ? 15 : 30
  // Dots appear at 1/5 intervals between numbers
  const dotInterval = majorInterval / 5
  
  const marks: { time: number; isNumber: boolean }[] = []
  for (let t = 0; t <= totalDuration; t += dotInterval) {
    marks.push({ time: t, isNumber: t % majorInterval === 0 })
  }
  return marks
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
      if (frame) return (frame.canvas as HTMLCanvasElement).toDataURL()
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
  durationByShot: Record<string, number>
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
  durationByShot,
  onSelectShot,
  currentTime,
  totalDuration,
  isPlaying,
  onPlayPause,
  onSeek,
}: ShotTimelineProps) {
  const shotsWithDuration = useMemo(
    () =>
      shots.map((shot) => ({
        ...shot,
        duration: durationByShot[shot.id] ?? shot.duration,
      })),
    [shots, durationByShot]
  )

  // Compute scene total from shot durations
  const sceneTotalDuration = useMemo(
    () => shotsWithDuration.reduce((sum, shot) => sum + shot.duration, 0),
    [shotsWithDuration]
  )
  const effectiveDuration = totalDuration > 0 ? totalDuration : sceneTotalDuration

  // Compute layout for all shots
  const layouts = useMemo(
    () => computeLayout(shotsWithDuration, effectiveDuration),
    [shotsWithDuration, effectiveDuration]
  )

  // State
  const [zoom, setZoom] = useState(1)
  const [containerWidth, setContainerWidth] = useState(0)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const thumbnailCache = useRef<Map<string, string>>(new Map())
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const canControlPlayback = effectiveDuration > 0

  const timelineViewportWidth = Math.max(0, containerWidth - SIDEBAR_WIDTH - TIMELINE_RIGHT_PADDING)

  // Ruler marks (Opus Clip style)
  const rulerMarks = useMemo(
    () => generateRulerMarks(effectiveDuration, timelineViewportWidth, zoom),
    [effectiveDuration, timelineViewportWidth, zoom]
  )

  // Zoom handlers
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(1, z - 0.25)), [])
  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(4, z + 0.25)), [])
  const handleFit = useCallback(() => setZoom(1), [])

  // Measure container width
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Update playhead position via direct DOM mutation
  useEffect(() => {
    const playhead = playheadRef.current
    const scroll = scrollRef.current
    if (!playhead || !scroll || effectiveDuration <= 0) return

    const contentWidth = timelineViewportWidth * zoom
    const clampedTime = Math.max(0, Math.min(currentTime, effectiveDuration))
    const offset = (clampedTime / effectiveDuration) * contentWidth
    playhead.style.transform = `translateX(${offset}px)`
  }, [currentTime, effectiveDuration, zoom, timelineViewportWidth])

  // Extract thumbnails for shots with video URLs
  useEffect(() => {
    let cancelled = false

    shotsWithDuration.forEach(async (shot) => {
      if (!shot.videoUrl) return
      if (thumbnailCache.current.has(shot.id)) {
        const cached = thumbnailCache.current.get(shot.id)
        const pill = pillRefs.current.get(shot.id)
        if (pill && cached) pill.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 40%, transparent 100%), url(${cached})`
        return
      }

      const layout = layouts.find((item) => item.shot.id === shot.id)
      const thumbnail = await extractThumbnail(shot.videoUrl, layout?.duration ?? shot.duration)
      if (cancelled || !thumbnail) return

      thumbnailCache.current.set(shot.id, thumbnail)
      const pill = pillRefs.current.get(shot.id)
      if (pill) pill.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 40%, transparent 100%), url(${thumbnail})`
    })

    return () => { cancelled = true }
  }, [shotsWithDuration, layouts])

  // Playhead drag handler
  const handlePlayheadDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const scroll = scrollRef.current
      if (!scroll || effectiveDuration <= 0) return

      const contentWidth = timelineViewportWidth * zoom

      const seekFromEvent = (ev: MouseEvent) => {
        const rect = scroll.getBoundingClientRect()
        const x = ev.clientX - rect.left + scroll.scrollLeft
        const clamped = Math.max(0, Math.min(x, contentWidth))
        const seekTime = (clamped / contentWidth) * effectiveDuration
        
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
    [effectiveDuration, onSeek, timelineViewportWidth, zoom]
  )

  // Click-to-seek on timeline
  const handleSeekClick = useCallback(
    (e: React.MouseEvent) => {
      const scroll = scrollRef.current
      if (!scroll || effectiveDuration <= 0) return
      
      // Ignore clicks on buttons and playhead
      const target = e.target as HTMLElement
      if (target.closest("button") || target.closest(".playhead-head")) return

      const contentWidth = timelineViewportWidth * zoom
      const rect = scroll.getBoundingClientRect()
      const x = e.clientX - rect.left + scroll.scrollLeft
      const seekTime = (x / contentWidth) * effectiveDuration
      onSeek(Math.max(0, Math.min(seekTime, effectiveDuration)))
    },
    [effectiveDuration, onSeek, timelineViewportWidth, zoom]
  )

  // Pill click handler
  const handlePillClick = useCallback(
    (shotId: string, startSec: number) => {
      onSelectShot(shotId)
      onSeek(startSec)
    },
    [onSelectShot, onSeek]
  )

  // Track content width for positioning
  const contentWidth = timelineViewportWidth * zoom

  return (
    <div
      ref={containerRef}
      className="h-full min-h-0 flex flex-col"
      style={{ background: "#000000" }}
    >
      {/* Control Bar */}
      <div className="relative flex items-center justify-between h-10 px-4 shrink-0" style={{ background: "#000000" }}>
        {/* Left: SPLIT button */}
        <button
          className="shrink-0 transition-colors duration-150"
          style={{
            padding: "4px 16px",
            minWidth: "72px",
            borderRadius: "6px",
            background: "transparent",
            border: "1px solid transparent",
            color: "#D4D4D4",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            cursor: "not-allowed",
            transform: `translateY(${ZOOM_CONTROLS_Y_OFFSET}px)`,
          }}
          aria-disabled="true"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#3A3A3A"
            e.currentTarget.style.borderColor = "#4A4A4A"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.borderColor = "transparent"
          }}
        >
          SPLIT
        </button>

        {/* Center: Play/Pause + Combined Timecode */}
        <div 
          className="fixed left-1/2 flex items-center gap-3 rounded-full"
          style={{ 
            background: "#1C1C1E",
            padding: "4px 14px",
            zIndex: 50,
            transform: `translate(-50%, ${ZOOM_CONTROLS_Y_OFFSET}px)`,
          }}
        >
          <span style={{ fontSize: "13px", color: "#FFFFFF", fontVariantNumeric: "tabular-nums", fontWeight: 400 }}>
            {formatTime(currentTime)}
          </span>

          <button
            className="flex items-center justify-center rounded-full transition-all duration-150"
            style={{
              width: "30px",
              height: "30px",
              background: canControlPlayback ? "#F2F2F2" : "#333333",
              cursor: canControlPlayback ? "pointer" : "not-allowed",
              color: canControlPlayback ? "#1C1C1E" : "#777076"
            }}
            onClick={canControlPlayback ? onPlayPause : undefined}
            disabled={!canControlPlayback}
          >
            {isPlaying ? (
              <Pause size={12} fill="currentColor" />
            ) : (
              <Play size={12} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <span style={{ fontSize: "13px", color: "#6B7280", fontVariantNumeric: "tabular-nums", fontWeight: 400 }}>
            {formatTime(effectiveDuration)}
          </span>
        </div>

        {/* Right: Zoom controls */}
        <div
          className="flex items-center gap-2"
          style={{ transform: `translateY(${ZOOM_CONTROLS_Y_OFFSET}px)` }}
        >
          <button
            className="flex items-center justify-center transition-colors duration-150"
            style={{
              width: "24px",
              height: "24px",
              color: zoom > 1 ? "#777076" : "#404556",
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
            className="flex items-center justify-center transition-colors duration-150"
            style={{
              width: "24px",
              height: "24px",
              color: zoom < 4 ? "#777076" : "#404556",
              cursor: zoom < 4 ? "pointer" : "not-allowed",
            }}
            onClick={zoom < 4 ? handleZoomIn : undefined}
            disabled={zoom >= 4}
          >
            <Plus size={14} />
          </button>

          <button
            className="flex items-center gap-1 transition-colors duration-150"
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
            background: "transparent",
            border: "1px solid transparent",
            color: "#D4D4D4",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              cursor: "pointer",
            }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#3A3A3A"
            e.currentTarget.style.borderColor = "#4A4A4A"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.borderColor = "transparent"
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
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Fixed Left Sidebar */}
          <div 
            className="shrink-0 flex flex-col"
            style={{ width: `${SIDEBAR_WIDTH}px`, background: "#000000" }}
          >
            {/* Ruler gutter */}
            <div style={{ height: `${RULER_HEIGHT}px` }} />
            
            {/* Video track gutter - Add button */}
            <div 
              className="flex items-center justify-center"
              style={{ height: "40px" }}
            >
              <button
                className="flex items-center justify-center transition-colors duration-150"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  border: "1px dashed #444",
                  background: "transparent",
                  color: "#666",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1a1a1a"
                  e.currentTarget.style.borderStyle = "solid"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.borderStyle = "dashed"
                }}
              >
                <Plus size={14} />
              </button>
            </div>
            
            {/* Audio track gutter */}
            <div style={{ height: "28px" }} />
          </div>

          {/* Scrollable Timeline Content */}
          <div 
            ref={scrollRef}
            className="flex-1 min-w-0 overflow-x-auto relative flex"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#404556 #000000",
            }}
            onClick={handleSeekClick}
          >
            {/* Content wrapper with exact zoom width */}
            <div 
              className="shrink-0"
              style={{ 
                width: `${timelineViewportWidth * zoom}px`, 
                position: "relative" 
              }}
            >
              {/* Ruler Row - Opus Clip style */}
              <div
                className="relative flex items-center"
                style={{ height: `${RULER_HEIGHT}px`, background: "#000000" }}
              >
                {rulerMarks.map(({ time, isNumber }, i) => {
                  const leftPct = effectiveDuration > 0 ? (time / effectiveDuration) * 100 : 0
                  return (
                    <div
                      key={i}
                      className="absolute"
                      style={{ 
                        left: `${leftPct}%`, 
                        transform: "translateX(-50%)",
                        top: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "flex-start",
                        paddingTop: isNumber ? "0px" : `${RULER_DOT_OFFSET}px`,
                      }}
                    >
                      {isNumber ? (
                        <span style={{ 
                          fontSize: "11px", 
                          color: "#777076", 
                          fontWeight: 500,
                          fontVariantNumeric: "tabular-nums",
                          lineHeight: 1,
                        }}>
                          {Math.floor(time)}
                        </span>
                      ) : (
                        <div
                          style={{
                            width: `${RULER_DOT_SIZE}px`,
                            height: `${RULER_DOT_SIZE}px`,
                            borderRadius: "50%",
                            background: "#777076",
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Video Track */}
              <div 
                className="relative"
                style={{ height: "40px", background: "#000000" }}
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
                      className="absolute transition-all duration-150"
                      style={{
                        top: "2px",
                        bottom: "2px",
                        left: `calc(${layout.leftPct}% + 1px)`,
                        width: `calc(${layout.widthPct}% - 2px)`,
                        minWidth: "40px",
                        borderRadius: "4px",
                        backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        backgroundClip: "border-box",
                        backgroundColor: "#1a1a1a",
                        border: isSelected ? "2px solid #666" : "1px solid transparent",
                        opacity: isSelected ? 1 : 0.9,
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.opacity = "1" }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.opacity = "0.9" }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePillClick(layout.shot.id, layout.startSec)
                      }}
                    >
                      {/* Metadata - compact */}
                      <div className="absolute bottom-1 left-2 right-2 flex justify-between items-center pointer-events-none">
                        <span
                          className="truncate"
                          style={{ fontSize: "10px", fontWeight: 500, color: "#fff", maxWidth: "70%" }}
                        >
                          {layout.shot.number} {layout.shot.title || "Untitled"}
                        </span>
                        <span style={{ fontSize: "9px", color: "#A3A3A3", flexShrink: 0, marginLeft: "4px" }}>
                          {layout.duration}s
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Audio Track */}
              <div 
                className="relative"
                style={{ height: "28px", background: "#000000" }}
              >
                {layouts.map((layout) => {
                  const isSelected = selectedShot === layout.shot.id
                  return (
                    <button
                      key={`audio-${layout.shot.id}`}
                      className="absolute transition-all duration-150"
                      style={{
                        top: "2px",
                        bottom: "2px",
                        left: `calc(${layout.leftPct}% + 1px)`,
                        width: `calc(${layout.widthPct}% - 2px)`,
                        minWidth: "40px",
                        borderRadius: "4px",
                        backgroundColor: "#3A3A3A",
                        border: isSelected ? "2px solid #666" : "1px solid transparent",
                        opacity: isSelected ? 1 : 0.95,
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.opacity = "1" }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.opacity = "0.9" }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePillClick(layout.shot.id, layout.startSec)
                      }}
                    />
                  )
                })}
              </div>

              {/* Unified Playhead */}
              <div
                ref={playheadRef}
                className="absolute pointer-events-none"
                style={{
                  top: 0,
                  left: 0,
                  width: "2px",
                  height: "100%",
                  zIndex: 60,
                  willChange: "transform",
                }}
              >
                {/* Playhead head - compact rounded rectangle */}
                <div
                  className="playhead-head absolute pointer-events-auto cursor-ew-resize"
                  style={{
                    top: "2px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "10px",
                    height: "18px",
                    background: "transparent",
                    border: "1px solid #FFFFFF",
                    borderRadius: "3px 3px 2px 2px",
                    zIndex: 1,
                  }}
                  onMouseDown={handlePlayheadDrag}
                />
                {/* Playhead line */}
                <div
                  style={{
                    position: "absolute",
                    top: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "2px",
                    height: "calc(100% - 20px)",
                    background: "#FFFFFF",
                    borderRadius: "1px",
                  }}
                />
              </div>
            </div>

            {/* Spacer to preserve right padding */}
            <div 
              className="shrink-0" 
              style={{ width: `${TIMELINE_RIGHT_PADDING}px` }} 
            />
          </div>
        </div>
      )}

      {/* Zoom slider styling */}
      <style>{`
        .zoom-slider {
          -webkit-appearance: none;
          appearance: none;
          background: #333;
          border-radius: 2px;
        }
        .zoom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #666;
          cursor: pointer;
          border: none;
        }
        .zoom-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #666;
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
