"use client"

import { useRef, useEffect, useCallback } from "react"
import { Sparkles } from "lucide-react"
import { SimpsonLoading } from "./loading/simpson-loading"

interface StepScriptProps {
  startFramePrompt: string
  isFramesLoading: boolean
  onUpdatePrompt: (value: string) => void
  onGenerateFrames: () => void
}

function PromptTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const resize = useCallback(() => {
    const el = ref.current
    if (el) { el.style.height = "0"; el.style.height = el.scrollHeight + "px" }
  }, [])
  useEffect(() => { resize() }, [value, resize])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      rows={3}
      placeholder="Describe the opening frame of this shot..."
      style={{
        resize: "none",
        overflow: "hidden",
        width: "100%",
        background: "#111111",
        border: "1px solid #232323",
        borderRadius: "8px",
        padding: "10px 12px",
        fontSize: "13px",
        lineHeight: 1.6,
        color: "#D9D9D9",
        outline: "none",
        fontFamily: "var(--font-inter)",
        minHeight: "80px",
      }}
    />
  )
}

export function StepScript({ startFramePrompt, isFramesLoading, onUpdatePrompt, onGenerateFrames }: StepScriptProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ padding: "16px" }}>

      {/* Frame placeholder / loading area */}
      <div
        className="flex items-center justify-center rounded-lg mb-4"
        style={{ background: "#111111", border: "1px solid #232323", height: "220px" }}
      >
        {isFramesLoading ? (
          <div className="flex flex-col items-center gap-3">
            <SimpsonLoading />
            <span style={{ fontSize: "12px", color: "#696969" }}>Generating start frame...</span>
            <span style={{ fontSize: "11px", color: "#404040" }}>Usually takes ~15 seconds</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: "40px", height: "40px", background: "rgba(105,105,105,0.12)", border: "1px dashed rgba(105,105,105,0.3)" }}
            >
              <Sparkles size={16} style={{ color: "#696969" }} />
            </div>
            <span style={{ fontSize: "12px", color: "#696969" }}>No frame generated yet</span>
          </div>
        )}
      </div>

      {/* Prompt label + textarea */}
      <div style={{ marginBottom: "12px" }}>
        <span style={{ fontSize: "11px", color: "#696969", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, display: "block", marginBottom: "6px" }}>
          Start Frame Prompt
        </span>
        <PromptTextarea value={startFramePrompt} onChange={onUpdatePrompt} />
      </div>

      {/* Generate CTA */}
      <button
        type="button"
        onClick={onGenerateFrames}
        disabled={isFramesLoading}
        className="w-full flex items-center justify-center gap-2 transition-all duration-150"
        style={{
          background: "transparent",
          border: `1px solid ${isFramesLoading ? "#404040" : "#D9D9D9"}`,
          borderRadius: "8px",
          padding: "12px 20px",
          color: isFramesLoading ? "#404040" : "#D9D9D9",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          cursor: isFramesLoading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (isFramesLoading) return
          e.currentTarget.style.borderColor = "#ffffff"
          e.currentTarget.style.color = "#ffffff"
          e.currentTarget.style.background = "rgba(255,255,255,0.04)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isFramesLoading ? "#404040" : "#D9D9D9"
          e.currentTarget.style.color = isFramesLoading ? "#404040" : "#D9D9D9"
          e.currentTarget.style.background = "transparent"
        }}
      >
        <Sparkles size={14} />
        {isFramesLoading ? "Generating..." : "Generate Start Frame"}
      </button>

    </div>
  )
}
