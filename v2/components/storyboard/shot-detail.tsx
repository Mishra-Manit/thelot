"use client"

import { useRef, useEffect, useCallback } from "react"
import {
  Clock,
  Clapperboard,
  Brain,
  Camera,
  Play,
  GripVertical,
  Sparkles,
  Image as ImageIcon,
  Minus,
  Plus,
} from "lucide-react"
import type { StoryboardShot, StoryboardShotUpdateInput } from "@/lib/storyboard-types"

const MIN_DURATION_SECONDS = 1
const MAX_DURATION_SECONDS = 30

interface ShotDetailProps {
  shot: StoryboardShot
  sceneNumber: number
  onUpdate: (field: keyof StoryboardShotUpdateInput, value: string | number) => void
  widthPct?: number
  onGenerateVideo: () => void
  onResetSimulation: () => void
  canGenerateVideo: boolean
  isVideoLoading: boolean
  isVideoReady: boolean
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
        ...style,
      }}
    />
  )
}

/* ─── Editor block with drag handle ─── */
function EditorBlock({
  accentColor,
  icon: Icon,
  label,
  children,
}: {
  accentColor: string
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="group relative" style={{ marginBottom: "20px" }}>
      {/* Drag handle */}
      <div
        className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-start pt-7"
        style={{ left: "-28px", color: "#696969" }}
      >
        <GripVertical size={14} style={{ opacity: 0.45 }} />
      </div>
      <div className="transition-colors duration-150 rounded-md">
        {/* Label row */}
        <div className="flex items-center gap-1.5 mb-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
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

export function ShotDetail({
  shot,
  sceneNumber,
  onUpdate,
  widthPct = 50,
  onGenerateVideo,
  onResetSimulation,
  canGenerateVideo,
  isVideoLoading,
  isVideoReady,
}: ShotDetailProps) {
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
          padding: "24px 16px 32px 16px",
          maxWidth: "720px",
        }}
      >
        {/* Top metadata */}
        <div className="flex items-center gap-2 mb-3">
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
            Scene {sceneNumber}
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
              onClick={() => handleDurationChange(clampedDuration - 1)}
              disabled={clampedDuration <= MIN_DURATION_SECONDS}
              className="flex items-center justify-center rounded transition-all duration-150 disabled:cursor-not-allowed"
              style={{
                width: "18px",
                height: "18px",
                color: clampedDuration <= MIN_DURATION_SECONDS ? "#232323" : "#D9D9D9",
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
              {clampedDuration}s
            </span>
            <button
              type="button"
              onClick={() => handleDurationChange(clampedDuration + 1)}
              disabled={clampedDuration >= MAX_DURATION_SECONDS}
              className="flex items-center justify-center rounded transition-all duration-150 disabled:cursor-not-allowed"
              style={{
                width: "18px",
                height: "18px",
                color: clampedDuration >= MAX_DURATION_SECONDS ? "#232323" : "#D9D9D9",
              }}
              aria-label="Increase duration by one second"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>

        {/* Shot title */}
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
            marginBottom: "24px",
          }}
        />

        {/* Block 1 — ACTION */}
        <EditorBlock accentColor="#696969" icon={Clapperboard} label="Action">
          <AutoTextarea
            value={shot.action}
            onChange={(v) => onUpdate("action", v)}
            style={{
              fontSize: "15px",
              lineHeight: 1.85,
              color: "#d4d4d4",
            }}
          />
        </EditorBlock>

        {/* Block 2 — INTERNAL MONOLOGUE */}
        <EditorBlock accentColor="#575757" icon={Brain} label="Internal Monologue">
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
              }}
            />
          </div>
        </EditorBlock>

        {/* Block 3 — CAMERA NOTES */}
        <EditorBlock accentColor="#696969" icon={Camera} label="Camera Notes">
          <div className="flex items-start gap-2">
            <span className="font-mono" style={{ color: "#696969", fontSize: "13px", lineHeight: 1.7 }}>[CAMERA]</span>
            <AutoTextarea
              value={shot.cameraNotes}
              onChange={(v) => onUpdate("cameraNotes", v)}
              className="font-mono italic"
              style={{
                fontSize: "13px",
                lineHeight: 1.7,
                color: "#8a8a8a",
              }}
            />
          </div>
        </EditorBlock>

        {/* Block 4 — VIDEO CLIP */}
        <EditorBlock accentColor="#7A7A7A" icon={Play} label="Video Clip">
          <select
            value={shot.videoUrl}
            onChange={(e) => onUpdate("videoUrl", e.target.value)}
            style={{
              background: "#111111",
              border: "1px solid #232323",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "13px",
              color: "#D9D9D9",
              width: "100%",
              outline: "none",
            }}
          >
            {[
              { label: "— none —", value: "" },
              { label: "Battle Scene", value: "/videos/battle_scene.mp4" },
              { label: "Dunes Cinematic", value: "/videos/dunes_cinematic.mp4" },
              { label: "Flying Ornithopter", value: "/videos/flying_ornithopter.mp4" },
              { label: "Paul Atreides Close-up", value: "/videos/paul_atreides_closeup.mp4" },
              { label: "Sandworm Erupting", value: "/videos/sandworm_erupting.mp4" },
            ].map((opt) => (
              <option key={opt.value} value={opt.value} style={{ background: "#111111" }}>
                {opt.label}
              </option>
            ))}
          </select>
        </EditorBlock>

        {/* Director's Notes header */}
        <div className="flex items-center gap-3 mb-5 mt-8">
          <div className="flex items-center gap-1.5 shrink-0">
            <Sparkles size={14} style={{ color: "#696969" }} />
            <span
              style={{
                fontSize: "12px",
                color: "#696969",
                fontWeight: 600,
              }}
            >
              🎬 DIRECTOR'S NOTES
            </span>
          </div>
          <div className="flex-1" style={{ height: "1px", background: "#232323" }} />
        </div>

        {/* Start Frame prompt */}
        <EditorBlock accentColor="#696969" icon={ImageIcon} label="Start Frame">
          <PromptBox
            value={shot.startFramePrompt}
            onChange={(v) => onUpdate("startFramePrompt", v)}
          />
        </EditorBlock>

        {/* Video prompt */}
        <EditorBlock accentColor="#7A7A7A" icon={Play} label="Video">
          <PromptBox
            value={shot.videoPrompt}
            onChange={(v) => onUpdate("videoPrompt", v)}
          />
        </EditorBlock>

        {/* Generate / Regenerate video */}
        <button
          className="flex items-center justify-center gap-2 w-full rounded-lg transition-all duration-150 mt-4"
          style={{
            background: "linear-gradient(135deg, #69696922, #69696911)",
            border: "1px solid #69696944",
            color: "#696969",
            fontSize: "13px",
            fontWeight: 500,
            padding: "10px 0",
            opacity: !canGenerateVideo || isVideoLoading ? 0.55 : 1,
            cursor: !canGenerateVideo || isVideoLoading ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!canGenerateVideo || isVideoLoading) return
            e.currentTarget.style.background =
              "linear-gradient(135deg, #69696933, #69696922)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(135deg, #69696922, #69696911)"
          }}
          onClick={onGenerateVideo}
          disabled={!canGenerateVideo || isVideoLoading}
        >
          <Sparkles
            size={16}
            className={isVideoLoading ? "animate-spin" : undefined}
            style={{ animationDuration: "1.6s" }}
          />
          <span>
            {isVideoLoading
              ? "Generating Shot with AI..."
              : isVideoReady
                ? "Regenerate Shot with AI"
                : "Generate Shot with AI"}
          </span>
        </button>

        <button
          className="w-full rounded-lg transition-all duration-150 mt-2"
          style={{
            background: "transparent",
            border: "1px dashed #69696955",
            color: "#D9D9D9",
            fontSize: "12px",
            fontWeight: 500,
            padding: "8px 0",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#7A7A7A"
            e.currentTarget.style.color = "#F0F0F0"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#69696955"
            e.currentTarget.style.color = "#D9D9D9"
          }}
          onClick={onResetSimulation}
        >
          Reset Simulation
        </button>
      </div>
    </div>
  )
}

function PromptBox({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div
      className="rounded-lg transition-colors duration-150 focus-within:bg-[#111111] focus-within:border-[#69696955]"
      style={{
        background: "#000000",
        border: "1px solid #111111",
        padding: "10px 14px",
        minHeight: "56px",
      }}
    >
      <AutoTextarea
        value={value}
        onChange={onChange}
        style={{
          fontSize: "13px",
          lineHeight: 1.7,
          color: "#D9D9D9",
        }}
      />
    </div>
  )
}
