"use client"

import { useRef, useEffect, useCallback, useState, useLayoutEffect } from "react"
import {
  Clock,
  Clapperboard,
  Brain,
  Camera,
  Play,
  Image as ImageIcon,
  Minus,
  Plus,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { StoryboardShot, StoryboardShotUpdateInput } from "@/lib/storyboard-types"

const MIN_DURATION_SECONDS = 1
const MAX_DURATION_SECONDS = 30
const SCREENPLAY_FONT_FAMILY = "var(--font-mono)"

interface ShotDetailProps {
  shot: StoryboardShot
  sceneNumber: number
  shotIndex: number
  onUpdate: (field: keyof StoryboardShotUpdateInput, value: string | number) => void
  widthPct?: number
  onGenerateVideo: () => void
  canGenerateVideo: boolean
  isVideoLoading: boolean
  isVideoReady: boolean
  onGenerateFrames: () => void
  canGenerateFrames: boolean
  isFramesLoading: boolean
  areFramesReady: boolean
}

/* ─── Auto-resize textarea ─── */
function AutoTextarea({
  value,
  onChange,
  style,
  className,
}: {
  value: string
  onChange: (v: string) => void
  style?: React.CSSProperties
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (el) {
      el.style.height = "0"
      el.style.height = el.scrollHeight + "px"
    }
  }, [])

  useEffect(() => {
    resize()
  }, [value, resize])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      rows={1}
      className={className}
      style={{
        resize: "none",
        overflow: "hidden",
        border: "none",
        background: "transparent",
        outline: "none",
        width: "100%",
        padding: 0,
        margin: 0,
        ...style,
      }}
    />
  )
}

/* ─── Editor block ─── */
function EditorBlock({
  accentColor,
  icon: Icon,
  label,
  children,
  marginBottom = 12,
  marginTop = 0,
  showLabelRow = true,
}: {
  accentColor: string
  icon: LucideIcon
  label: string
  children: React.ReactNode
  marginBottom?: number
  marginTop?: number
  showLabelRow?: boolean
}) {
  return (
    <div className="group" style={{ marginBottom: `${marginBottom}px`, marginTop: `${marginTop}px` }}>
      <div className="transition-colors duration-150 rounded-md">
        {/* Label row */}
        <div 
          className={`flex items-center gap-1.5 mb-1.5 opacity-0 transition-opacity duration-150 ${
            showLabelRow ? "group-hover:opacity-100 group-focus-within:opacity-100" : ""
          }`}
          aria-hidden={!showLabelRow}
        >
          <Icon size={12} style={{ color: accentColor }} />
          <span
            style={{
              fontSize: "10px",
              letterSpacing: "0.08em",
              fontWeight: 600,
              color: accentColor,
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

function ShotDetailHeader({
  sceneNumber,
  shotIndex,
  duration,
  onDurationChange,
  enableHoverLabels,
  onToggleHoverLabels,
  isAdvancedMode,
  onToggleAdvancedMode,
}: {
  sceneNumber: number
  shotIndex: number
  duration: number
  onDurationChange: (nextValue: number) => void
  enableHoverLabels: boolean
  onToggleHoverLabels: () => void
  isAdvancedMode: boolean
  onToggleAdvancedMode: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span
          style={{
            background: "#69696918",
            border: "1px solid #69696933",
            fontSize: "10px",
            textTransform: "uppercase",
            color: "#696969",
            fontWeight: 600,
            letterSpacing: "0.05em",
            borderRadius: "4px",
            padding: "2px 8px",
          }}
        >
          Scene {sceneNumber}, Shot {shotIndex}
        </span>
        <span style={{ color: "#696969", fontSize: "12px" }}>&middot;</span>
        <div
          className="inline-flex items-center gap-1 rounded-md"
          style={{
            background: "#111111",
            border: "1px solid #232323",
            padding: "2px",
          }}
        >
          <button
            type="button"
            onClick={() => onDurationChange(duration - 1)}
            disabled={duration <= MIN_DURATION_SECONDS}
            className="flex items-center justify-center rounded transition-all duration-150 disabled:cursor-not-allowed"
            style={{
              width: "18px",
              height: "18px",
              color: duration <= MIN_DURATION_SECONDS ? "#232323" : "#D9D9D9",
            }}
            aria-label="Decrease duration by one second"
          >
            <Minus size={10} />
          </button>
          <span
            style={{
              minWidth: "34px",
              textAlign: "center",
              fontSize: "11px",
              color: "#E6E8EE",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {duration}s
          </span>
          <button
            type="button"
            onClick={() => onDurationChange(duration + 1)}
            disabled={duration >= MAX_DURATION_SECONDS}
            className="flex items-center justify-center rounded transition-all duration-150 disabled:cursor-not-allowed"
            style={{
              width: "18px",
              height: "18px",
              color: duration >= MAX_DURATION_SECONDS ? "#232323" : "#D9D9D9",
            }}
            aria-label="Increase duration by one second"
          >
            <Plus size={10} />
          </button>
        </div>

        <span style={{ color: "#696969", fontSize: "12px" }}>&middot;</span>
        <button
          type="button"
          onClick={onToggleAdvancedMode}
          className="flex items-center gap-1.5 rounded transition-all duration-150 hover:bg-[#222222]"
          style={{
            color: isAdvancedMode ? "#eeeeee" : "#888888",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "4px 8px",
            border: "1px solid transparent",
            background: isAdvancedMode ? "#222222" : "transparent"
          }}
        >
          <Sparkles size={12} />
          <span>Advanced AI Editing</span>
        </button>
      </div>
      
      <button
        type="button"
        onClick={onToggleHoverLabels}
        className="flex items-center gap-1.5 rounded transition-all duration-150 hover:bg-[#222222]"
        style={{
          color: enableHoverLabels ? "#888888" : "#444444",
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          padding: "4px 8px",
          border: "1px solid transparent",
        }}
        aria-label="Toggle hover labels"
      >
        {enableHoverLabels ? <Eye size={12} /> : <EyeOff size={12} />}
        <span>Labels</span>
      </button>
    </div>
  )
}

function ShotDetailEditor({
  shot,
  onUpdate,
  enableHoverLabels,
  onGenerateVideo,
  canGenerateVideo,
  isVideoLoading,
  isVideoReady,
  onGenerateFrames,
  canGenerateFrames,
  isFramesLoading,
  areFramesReady,
}: {
  shot: StoryboardShot
  onUpdate: (field: keyof StoryboardShotUpdateInput, value: string | number) => void
  enableHoverLabels: boolean
  onGenerateVideo: () => void
  canGenerateVideo: boolean
  isVideoLoading: boolean
  isVideoReady: boolean
  onGenerateFrames: () => void
  canGenerateFrames: boolean
  isFramesLoading: boolean
  areFramesReady: boolean
}) {
  return (
    <>
      {/* Shot title */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <span
          style={{
            fontSize: "26px",
            color: "#eeeeee",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            fontFamily: SCREENPLAY_FONT_FAMILY,
          }}
        >
          EXT.
        </span>
        <input
          type="text"
          value={shot.title}
          onChange={(e) => onUpdate("title", e.target.value)}
          className="font-serif"
          style={{
            fontSize: "26px",
            color: "#eeeeee",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            border: "none",
            background: "transparent",
            outline: "none",
            width: "100%",
            fontFamily: SCREENPLAY_FONT_FAMILY,
          }}
        />
      </div>

      {/* Block 1 — ACTION */}
      <EditorBlock accentColor="#696969" icon={Clapperboard} label="Action" marginBottom={20} showLabelRow={enableHoverLabels}>
        <AutoTextarea
          value={shot.action}
          onChange={(v) => onUpdate("action", v)}
          style={{
            fontSize: "15px",
            lineHeight: 1.72,
            color: "#d4d4d4",
            fontFamily: SCREENPLAY_FONT_FAMILY,
          }}
        />
      </EditorBlock>

      {/* Block 2 — INTERNAL MONOLOGUE */}
      <EditorBlock accentColor="#575757" icon={Brain} label="Internal Monologue" marginBottom={0} marginTop={-16} showLabelRow={enableHoverLabels}>
        <div
          style={{
            width: "60%",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "4px",
              textTransform: "uppercase",
              color: "#cccccc",
              fontFamily: SCREENPLAY_FONT_FAMILY,
            }}
          >
            CHARACTER (V.O.)
          </div>
          <AutoTextarea
            value={shot.internalMonologue}
            onChange={(v) => onUpdate("internalMonologue", v)}
            style={{
              fontSize: "15px",
              color: "#cccccc",
              textAlign: "center",
              fontStyle: "normal",
              fontFamily: SCREENPLAY_FONT_FAMILY,
            }}
          />
        </div>
      </EditorBlock>

      {/* Block 3 — CAMERA NOTES */}
      <EditorBlock accentColor="#696969" icon={Camera} label="Camera Notes" marginBottom={0} showLabelRow={enableHoverLabels}>
        <PromptBox
          value={shot.cameraNotes}
          onChange={(v) => onUpdate("cameraNotes", v)}
          prefix="[CAMERA]"
          italic
        />
      </EditorBlock>

      {/* Start Frame prompt */}
      <EditorBlock accentColor="#696969" icon={ImageIcon} label="Start Frame" marginBottom={6} showLabelRow={enableHoverLabels}>
        <PromptBox
          value={shot.startFramePrompt}
          onChange={(v) => onUpdate("startFramePrompt", v)}
          prefix="[START FRAME]"
        />
      </EditorBlock>

      {/* End Frame prompt */}
      <EditorBlock accentColor="#7A7A7A" icon={Play} label="End Frame" marginBottom={8} showLabelRow={enableHoverLabels}>
        <PromptBox
          value={shot.videoPrompt}
          onChange={(v) => onUpdate("videoPrompt", v)}
          prefix="[END FRAME]"
        />
      </EditorBlock>

      {/* Generate Frames / Generate Video button */}
      <button
        className="flex items-center justify-center gap-2 transition-all duration-200 mt-10 mx-auto group"
        style={{
          background: "transparent",
          border: "1px dashed #696969",
          color: "#888888",
          fontSize: "13px",
          fontFamily: SCREENPLAY_FONT_FAMILY,
          fontWeight: 600,
          letterSpacing: "0.05em",
          padding: "12px 24px",
          minWidth: "300px",
          opacity: (!areFramesReady && (!canGenerateFrames || isFramesLoading)) || (areFramesReady && (!canGenerateVideo || isVideoLoading)) ? 0.4 : 1,
          cursor: (!areFramesReady && (!canGenerateFrames || isFramesLoading)) || (areFramesReady && (!canGenerateVideo || isVideoLoading)) ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if ((!areFramesReady && (!canGenerateFrames || isFramesLoading)) || (areFramesReady && (!canGenerateVideo || isVideoLoading))) return
          e.currentTarget.style.color = "#eeeeee"
          e.currentTarget.style.borderColor = "#eeeeee"
          e.currentTarget.style.borderStyle = "solid"
          e.currentTarget.style.boxShadow = "0 0 15px rgba(238, 238, 238, 0.1)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#888888"
          e.currentTarget.style.borderColor = "#696969"
          e.currentTarget.style.borderStyle = "dashed"
          e.currentTarget.style.boxShadow = "none"
        }}
        onClick={areFramesReady ? onGenerateVideo : onGenerateFrames}
        disabled={(!areFramesReady && (!canGenerateFrames || isFramesLoading)) || (areFramesReady && (!canGenerateVideo || isVideoLoading))}
      >
        <span className="flex items-center gap-2">
          <span style={{ color: "#696969" }}>[</span>
          <span>
            {!areFramesReady
              ? isFramesLoading
                ? "ACTION: GENERATING FRAMES..."
                : "ACTION: GENERATE FRAMES"
              : isVideoLoading
                ? "ACTION: GENERATING VIDEO..."
                : isVideoReady
                  ? "ACTION: REGENERATE VIDEO"
                  : "ACTION: GENERATE VIDEO"}
          </span>
          <span style={{ color: "#696969" }}>]</span>
        </span>
      </button>
    </>
  )
}

export function ShotDetail({
  shot,
  sceneNumber,
  shotIndex,
  onUpdate,
  widthPct = 50,
  onGenerateVideo,
  canGenerateVideo,
  isVideoLoading,
  isVideoReady,
  onGenerateFrames,
  canGenerateFrames,
  isFramesLoading,
  areFramesReady,
}: ShotDetailProps) {
  const [enableHoverLabels, setEnableHoverLabels] = useState(true)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)

  const clampedDuration = Math.min(
    MAX_DURATION_SECONDS,
    Math.max(MIN_DURATION_SECONDS, Math.round(shot.duration))
  )

  const handleDurationChange = (nextValue: number) => {
    const safeValue = Math.min(
      MAX_DURATION_SECONDS,
      Math.max(MIN_DURATION_SECONDS, Math.round(nextValue))
    )
    onUpdate("duration", safeValue)
  }

  return (
    <div
      className="overflow-y-auto scrollbar-hide"
      style={{
        background: "#000000",
        width: `${widthPct}%`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "16px 16px 24px 24px",
          maxWidth: "720px",
        }}
      >
        <ShotDetailHeader 
          sceneNumber={sceneNumber}
          shotIndex={shotIndex}
          duration={clampedDuration}
          onDurationChange={handleDurationChange}
          enableHoverLabels={enableHoverLabels}
          onToggleHoverLabels={() => setEnableHoverLabels(prev => !prev)}
          isAdvancedMode={isAdvancedMode}
          onToggleAdvancedMode={() => setIsAdvancedMode(prev => !prev)}
        />

        {!isAdvancedMode ? (
          <ShotDetailEditor 
            shot={shot}
            onUpdate={onUpdate}
            enableHoverLabels={enableHoverLabels}
            onGenerateVideo={onGenerateVideo}
            canGenerateVideo={canGenerateVideo}
            isVideoLoading={isVideoLoading}
            isVideoReady={isVideoReady}
            onGenerateFrames={onGenerateFrames}
            canGenerateFrames={canGenerateFrames}
            isFramesLoading={isFramesLoading}
            areFramesReady={areFramesReady}
          />
        ) : (
          <div className="flex-1 w-full min-h-[500px]" style={{ background: "#000000" }}>
            <div className="grid grid-cols-2 gap-3 p-4">
              {["Shot List", "Voice Generation", "Media Library", "Lip Sync"].map((label) => (
                <div
                  key={label}
                  className="rounded-md flex items-center justify-center"
                  style={{
                    minHeight: "120px",
                    background: "#0D0E14",
                    border: "1px solid #252933",
                    color: "#D9D9D9",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PromptBox({
  value,
  onChange,
  prefix,
  italic = false,
}: {
  value: string
  onChange: (v: string) => void
  prefix?: string
  italic?: boolean
}) {
  return (
    <div
      className="rounded-lg transition-colors duration-150 focus-within:bg-[#111111] focus-within:border-[#69696955]"
      style={{
        background: "#000000",
        border: "1px solid #111111",
        padding: "9px 12px",
        minHeight: "50px",
      }}
    >
      <div className="flex items-start gap-1">
        {prefix ? (
          <div className="relative w-full">
            <div
              aria-hidden="true"
              className={italic ? "italic" : ""}
              style={{
                fontSize: "15px",
                lineHeight: 1.72,
                color: "transparent",
                whiteSpace: "pre-wrap",
                fontFamily: SCREENPLAY_FONT_FAMILY,
                pointerEvents: "none",
                wordBreak: "break-word",
                margin: 0,
                padding: 0,
              }}
            >
              <span style={{ color: "transparent", userSelect: "none" }}>{prefix} </span>
              {value || " "}
            </div>
            <AutoTextarea
              value={prefix + " " + value}
              onChange={(v) => {
                if (v.startsWith(prefix + " ")) {
                  onChange(v.substring(prefix.length + 1))
                } else if (v.startsWith(prefix)) {
                  onChange(v.substring(prefix.length))
                } else {
                  onChange(v)
                }
              }}
              className={`absolute top-0 left-0 w-full h-full text-transparent caret-[#D9D9D9] selection:bg-[#69696988] ${italic ? "italic" : ""}`}
              style={{
                fontSize: "15px",
                lineHeight: 1.72,
                color: "transparent",
                fontFamily: SCREENPLAY_FONT_FAMILY,
                background: "transparent",
                wordBreak: "break-word",
                margin: 0,
                padding: 0,
              }}
            />
            <div
              aria-hidden="true"
              className={`absolute top-0 left-0 w-full h-full pointer-events-none ${italic ? "italic" : ""}`}
              style={{
                fontSize: "15px",
                lineHeight: 1.72,
                color: "#D9D9D9",
                whiteSpace: "pre-wrap",
                fontFamily: SCREENPLAY_FONT_FAMILY,
                wordBreak: "break-word",
                margin: 0,
                padding: 0,
              }}
            >
              <span style={{ color: "#696969" }}>{prefix}</span> <span style={{ color: "#D9D9D9", opacity: italic ? 0.7 : 1 }}>{value}</span>
            </div>
          </div>
        ) : (
          <AutoTextarea
            value={value}
            onChange={onChange}
            className={italic ? "italic" : ""}
            style={{
              fontSize: "15px",
              lineHeight: 1.72,
              color: "#D9D9D9",
            }}
          />
        )}
      </div>
    </div>
  )
}
