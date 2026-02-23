"use client"

import { useRef, useEffect, useCallback } from "react"
import { Minus, Plus } from "lucide-react"
import type { StoryboardShot, StoryboardShotUpdateInput } from "@/lib/storyboard-types"

const MIN_DURATION_SECONDS = 1
const MAX_DURATION_SECONDS = 30
const SCREENPLAY_FONT = "var(--font-mono)"

interface ScriptPanelProps {
  shot: StoryboardShot
  sceneNumber: number
  shotIndex: number
  durationDisplay: number
  widthPct?: number
  onUpdate: (field: keyof StoryboardShotUpdateInput, value: string | number) => void
  onDurationDisplayChange: (nextValue: number) => void
}

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

  useEffect(() => { resize() }, [value, resize])

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

function EditorBlock({ children, marginBottom = 12, marginTop = 0 }: {
  children: React.ReactNode
  marginBottom?: number
  marginTop?: number
}) {
  return (
    <div className="group" style={{ marginBottom: `${marginBottom}px`, marginTop: `${marginTop}px` }}>
      <div className="transition-colors duration-150 rounded-md">
        <div className="mb-1.5 h-3" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}

function PromptBox({ value, onChange, prefix, italic = false }: {
  value: string
  onChange: (v: string) => void
  prefix?: string
  italic?: boolean
}) {
  return (
    <div
      className="rounded-lg transition-colors duration-150 focus-within:bg-[#111111] focus-within:border-[#69696955]"
      style={{ background: "#000000", border: "1px solid #111111", padding: "9px 12px", minHeight: "50px" }}
    >
      <div className="flex items-start gap-1">
        {prefix ? (
          <div className="relative w-full">
            {/* Hidden mirror for height sizing */}
            <div
              aria-hidden="true"
              className={italic ? "italic" : ""}
              style={{ fontSize: "15px", lineHeight: 1.72, color: "transparent", whiteSpace: "pre-wrap", fontFamily: SCREENPLAY_FONT, pointerEvents: "none", wordBreak: "break-word", margin: 0, padding: 0 }}
            >
              <span style={{ color: "transparent", userSelect: "none" }}>{prefix} </span>
              {value || " "}
            </div>
            {/* Invisible textarea for editing */}
            <AutoTextarea
              value={prefix + " " + value}
              onChange={(v) => {
                if (v.startsWith(prefix + " ")) onChange(v.substring(prefix.length + 1))
                else if (v.startsWith(prefix)) onChange(v.substring(prefix.length))
                else onChange(v)
              }}
              className={`absolute top-0 left-0 w-full h-full text-transparent caret-[#D9D9D9] selection:bg-[#69696988] ${italic ? "italic" : ""}`}
              style={{ fontSize: "15px", lineHeight: 1.72, color: "transparent", fontFamily: SCREENPLAY_FONT, background: "transparent", wordBreak: "break-word", margin: 0, padding: 0 }}
            />
            {/* Visible overlay with colored prefix */}
            <div
              aria-hidden="true"
              className={`absolute top-0 left-0 w-full h-full pointer-events-none ${italic ? "italic" : ""}`}
              style={{ fontSize: "15px", lineHeight: 1.72, color: "#D9D9D9", whiteSpace: "pre-wrap", fontFamily: SCREENPLAY_FONT, wordBreak: "break-word", margin: 0, padding: 0 }}
            >
              <span style={{ color: "#696969" }}>{prefix}</span>{" "}
              <span style={{ color: "#D9D9D9", opacity: italic ? 0.7 : 1 }}>{value}</span>
            </div>
          </div>
        ) : (
          <AutoTextarea
            value={value}
            onChange={onChange}
            className={italic ? "italic" : ""}
            style={{ fontSize: "15px", lineHeight: 1.72, color: "#D9D9D9" }}
          />
        )}
      </div>
    </div>
  )
}

export function ScriptPanel({
  shot,
  sceneNumber,
  shotIndex,
  durationDisplay,
  widthPct = 50,
  onUpdate,
  onDurationDisplayChange,
}: ScriptPanelProps) {
  const clampedDuration = Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, Math.round(durationDisplay)))

  const handleDurationChange = (nextValue: number) => {
    const safeValue = Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, Math.round(nextValue)))
    onDurationDisplayChange(safeValue)
  }

  return (
    <div
      className="overflow-y-auto scrollbar-hide"
      style={{ background: "#000000", width: `${widthPct}%`, flexShrink: 0 }}
    >
      <div style={{ padding: "16px 16px 24px 24px", maxWidth: "720px" }}>

        {/* Header: scene/shot label + duration controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span style={{
              background: "#69696918",
              border: "1px solid #69696933",
              fontSize: "10px",
              textTransform: "uppercase",
              color: "#696969",
              fontWeight: 600,
              letterSpacing: "0.05em",
              borderRadius: "4px",
              padding: "2px 8px",
            }}>
              Scene {sceneNumber}, Shot {shotIndex}
            </span>
            <span style={{ color: "#696969", fontSize: "12px" }}>&middot;</span>
            <div
              className="inline-flex items-center gap-1 rounded-md"
              style={{ background: "#111111", border: "1px solid #232323", padding: "2px" }}
            >
              <button
                type="button"
                onClick={() => handleDurationChange(clampedDuration - 1)}
                disabled={clampedDuration <= MIN_DURATION_SECONDS}
                className="flex items-center justify-center rounded transition-all duration-150 disabled:cursor-not-allowed"
                style={{ width: "18px", height: "18px", color: clampedDuration <= MIN_DURATION_SECONDS ? "#232323" : "#D9D9D9" }}
                aria-label="Decrease duration"
              >
                <Minus size={10} />
              </button>
              <span style={{ minWidth: "34px", textAlign: "center", fontSize: "11px", color: "#D9D9D9", fontVariantNumeric: "tabular-nums" }}>
                Clip Len: {clampedDuration}s
              </span>
              <button
                type="button"
                onClick={() => handleDurationChange(clampedDuration + 1)}
                disabled={clampedDuration >= MAX_DURATION_SECONDS}
                className="flex items-center justify-center rounded transition-all duration-150 disabled:cursor-not-allowed"
                style={{ width: "18px", height: "18px", color: clampedDuration >= MAX_DURATION_SECONDS ? "#232323" : "#D9D9D9" }}
                aria-label="Increase duration"
              >
                <Plus size={10} />
              </button>
            </div>
          </div>
        </div>

        {/* Shot title (slugline) */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "14px" }}>
          <span style={{ fontSize: "26px", color: "#eeeeee", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.25, fontFamily: SCREENPLAY_FONT }}>
            EXT.
          </span>
          <input
            type="text"
            value={shot.title}
            onChange={(e) => onUpdate("title", e.target.value)}
            style={{ fontSize: "26px", color: "#eeeeee", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.25, border: "none", background: "transparent", outline: "none", width: "100%", fontFamily: SCREENPLAY_FONT }}
          />
        </div>

        {/* Action */}
        <EditorBlock marginBottom={20}>
          <AutoTextarea
            value={shot.action}
            onChange={(v) => onUpdate("action", v)}
            style={{ fontSize: "15px", lineHeight: 1.72, color: "#d4d4d4", fontFamily: SCREENPLAY_FONT }}
          />
        </EditorBlock>

        {/* Internal monologue (V.O.) */}
        <EditorBlock marginBottom={0} marginTop={-16}>
          <div style={{ width: "60%", margin: "0 auto" }}>
            <div style={{ textAlign: "center", fontSize: "14px", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", color: "#cccccc", fontFamily: SCREENPLAY_FONT }}>
              CHARACTER (V.O.)
            </div>
            <AutoTextarea
              value={shot.internalMonologue}
              onChange={(v) => onUpdate("internalMonologue", v)}
              style={{ fontSize: "15px", color: "#cccccc", textAlign: "center", fontFamily: SCREENPLAY_FONT }}
            />
          </div>
        </EditorBlock>

        {/* Camera notes */}
        <EditorBlock marginBottom={0}>
          <PromptBox
            value={shot.cameraNotes}
            onChange={(v) => onUpdate("cameraNotes", v)}
            prefix="[CAMERA]"
            italic
          />
        </EditorBlock>

      </div>
    </div>
  )
}
