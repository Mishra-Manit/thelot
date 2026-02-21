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
} from "lucide-react"
import type { Shot } from "@/lib/storyboard-data"

interface ShotDetailProps {
  shot: Shot
  sceneNumber: number
  onUpdate: (field: keyof Shot, value: string | number) => void
  widthPct?: number
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
        style={{ left: "-28px", color: "#404556" }}
      >
        <GripVertical size={14} style={{ opacity: 0.45 }} />
      </div>
      {/* Left accent border on hover */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-full"
        style={{ background: accentColor }}
      />
      <div className="group-hover:bg-[#ffffff04] transition-colors duration-150 rounded-md pl-3">
        {/* Label row */}
        <div className="flex items-center gap-1.5 mb-2">
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

export function ShotDetail({ shot, sceneNumber, onUpdate, widthPct = 50 }: ShotDetailProps) {
  return (
    <div
      className="overflow-y-auto scrollbar-hide"
      style={{
        background: "#0D0E14",
        width: `${widthPct}%`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "24px 32px 32px 60px",
          maxWidth: "720px",
        }}
      >
        {/* Top metadata */}
        <div className="flex items-center gap-2 mb-3">
          <span
            style={{
              background: "#40455618",
              border: "1px solid #40455633",
              fontSize: "10px",
              textTransform: "uppercase",
              color: "#404556",
              fontWeight: 600,
              letterSpacing: "0.05em",
              borderRadius: "4px",
              padding: "2px 8px",
            }}
          >
            Scene {sceneNumber}
          </span>
          <span style={{ color: "#404556", fontSize: "12px" }}>&middot;</span>
          <span
            className="flex items-center gap-1"
            style={{ color: "#60515C", fontSize: "11px" }}
          >
            <Clock size={11} />
            {shot.duration}s
          </span>
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
            marginBottom: "4px",
          }}
        />

        {/* Duration editor */}
        <div className="flex items-center gap-1 mb-6">
          <span style={{ fontSize: "11px", color: "#404556" }}>Duration:</span>
          <input
            type="number"
            value={shot.duration}
            onChange={(e) => onUpdate("duration", parseInt(e.target.value) || 0)}
            style={{
              fontSize: "11px",
              color: "#777076",
              background: "transparent",
              border: "none",
              outline: "none",
              width: "24px",
              textAlign: "center",
            }}
          />
          <span style={{ fontSize: "11px", color: "#404556" }}>s</span>
        </div>

        {/* Block 1 — ACTION */}
        <EditorBlock accentColor="#404556" icon={Clapperboard} label="Action">
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
        <EditorBlock accentColor="#60515C" icon={Brain} label="Internal Monologue">
          <div
            style={{
              background: "#60515C08",
              borderLeft: "3px solid #60515C44",
              padding: "10px 16px",
              borderRadius: "0 4px 4px 0",
            }}
          >
            <AutoTextarea
              value={shot.monologue}
              onChange={(v) => onUpdate("monologue", v)}
              style={{
                fontSize: "15px",
                color: "#cccccc",
                fontStyle: "italic",
              }}
            />
          </div>
        </EditorBlock>

        {/* Block 3 — CAMERA NOTES */}
        <EditorBlock accentColor="#404556" icon={Camera} label="Camera Notes">
          <div
            style={{
              background: "#1A1C25",
              border: "1px solid #252933",
              borderRadius: "6px",
              padding: "10px 14px",
            }}
          >
            <AutoTextarea
              value={shot.cameraNotes}
              onChange={(v) => onUpdate("cameraNotes", v)}
              className="font-mono"
              style={{
                fontSize: "13px",
                lineHeight: 1.7,
                color: "#777076",
              }}
            />
          </div>
        </EditorBlock>

        {/* Block 4 — VIDEO CLIP */}
        <EditorBlock accentColor="#555B6E" icon={Play} label="Video Clip">
          <select
            value={shot.videoClip}
            onChange={(e) => onUpdate("videoClip", e.target.value)}
            style={{
              background: "#1A1C25",
              border: "1px solid #252933",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "13px",
              color: "#777076",
              width: "100%",
              outline: "none",
            }}
          >
            {[
              "— none —",
              "Battle Scene",
              "Dunes Cinematic",
              "Flying Ornithopter",
              "Paul Atreides Closeup",
              "Sandworm Erupting",
            ].map((opt) => (
              <option key={opt} value={opt} style={{ background: "#1A1C25" }}>
                {opt}
              </option>
            ))}
          </select>
        </EditorBlock>

        {/* AI Generation Prompts header */}
        <div className="flex items-center gap-3 mb-5 mt-8">
          <div className="flex items-center gap-1.5 shrink-0">
            <Sparkles size={14} style={{ color: "#404556" }} />
            <span
              style={{
                fontSize: "12px",
                color: "#404556",
                fontWeight: 600,
              }}
            >
              AI Generation Prompts
            </span>
          </div>
          <div className="flex-1" style={{ height: "1px", background: "#252933" }} />
        </div>

        {/* Start Frame prompt */}
        <EditorBlock accentColor="#404556" icon={ImageIcon} label="Start Frame">
          <PromptBox
            value={shot.startFramePrompt}
            onChange={(v) => onUpdate("startFramePrompt", v)}
          />
        </EditorBlock>

        {/* Video prompt */}
        <EditorBlock accentColor="#555B6E" icon={Play} label="Video">
          <PromptBox
            value={shot.videoPrompt}
            onChange={(v) => onUpdate("videoPrompt", v)}
          />
        </EditorBlock>

        {/* Regenerate button */}
        <button
          className="flex items-center justify-center gap-2 w-full rounded-lg transition-all duration-150 mt-4"
          style={{
            background: "linear-gradient(135deg, #40455622, #40455611)",
            border: "1px solid #40455644",
            color: "#404556",
            fontSize: "13px",
            fontWeight: 500,
            padding: "10px 0",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(135deg, #40455633, #40455622)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(135deg, #40455622, #40455611)"
          }}
        >
          <Sparkles size={16} />
          <span>Regenerate Shot with AI</span>
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
      className="rounded-lg transition-colors duration-150 focus-within:bg-[#1A1C25] focus-within:border-[#40455655]"
      style={{
        background: "#0D0E14",
        border: "1px solid #1A1C25",
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
          color: "#777076",
        }}
      />
    </div>
  )
}
