"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { RefreshCw, ArrowRight } from "lucide-react"
import { FrameCard } from "./frame-preview"
import { SpongebobLoading } from "./loading/spongebob-loading"

interface StepFramesProps {
  startFrameImageUrl: string
  startFramePrompt: string
  sceneNumber: number
  shotNumber: number
  isFramesLoading: boolean
  isVideoLoading: boolean
  onUpdatePrompt: (value: string) => void
  onRegenerateFrames: () => void
  onGenerateVideo: () => void
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
      placeholder="Describe the opening frame..."
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

export function StepFrames({
  startFrameImageUrl,
  startFramePrompt,
  sceneNumber,
  shotNumber,
  isFramesLoading,
  isVideoLoading,
  onUpdatePrompt,
  onRegenerateFrames,
  onGenerateVideo,
}: StepFramesProps) {
  const [frameHover, setFrameHover] = useState(false)

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ padding: "16px" }}>

      {/* Generated frame display */}
      <div style={{ height: "200px", marginBottom: "10px" }}>
        {isVideoLoading ? (
          // position: relative so SpongebobLoading's absolute inset-0 stays within this container
          <div className="w-full h-full flex items-center justify-center rounded-lg" style={{ position: "relative", background: "#111111", border: "1px solid #232323" }}>
            <SpongebobLoading compact />
          </div>
        ) : (
          <FrameCard
            label="START FRAME"
            sublabel={`S${sceneNumber}.${shotNumber}`}
            hover={frameHover}
            onHover={setFrameHover}
            prompt={startFramePrompt}
            imageUrl={startFrameImageUrl}
            isLoading={isFramesLoading}
            isReady={true}
          />
        )}
      </div>

      {/* Regenerate frame button */}
      <button
        type="button"
        onClick={onRegenerateFrames}
        disabled={isFramesLoading || isVideoLoading}
        className="flex items-center justify-center gap-2 transition-all duration-150 mb-4"
        style={{
          background: "transparent",
          border: "1px solid #232323",
          borderRadius: "6px",
          padding: "8px 14px",
          color: "#696969",
          fontSize: "12px",
          fontWeight: 500,
          cursor: isFramesLoading || isVideoLoading ? "not-allowed" : "pointer",
          width: "fit-content",
          alignSelf: "flex-start",
        }}
        onMouseEnter={(e) => {
          if (isFramesLoading || isVideoLoading) return
          e.currentTarget.style.borderColor = "#696969"
          e.currentTarget.style.color = "#D9D9D9"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#232323"
          e.currentTarget.style.color = "#696969"
        }}
      >
        <RefreshCw size={12} />
        Regenerate Frame
      </button>

      {/* Prompt label + textarea */}
      <div style={{ marginBottom: "12px" }}>
        <span style={{ fontSize: "11px", color: "#696969", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, display: "block", marginBottom: "6px" }}>
          Start Frame Prompt
        </span>
        <PromptTextarea value={startFramePrompt} onChange={onUpdatePrompt} />
      </div>

      {/* Generate Video CTA (primary) */}
      <button
        type="button"
        onClick={onGenerateVideo}
        disabled={isVideoLoading || isFramesLoading}
        className="w-full flex items-center justify-center gap-2 transition-all duration-150 mt-auto"
        style={{
          background: "transparent",
          border: `1px solid ${isVideoLoading || isFramesLoading ? "#404040" : "#D9D9D9"}`,
          borderRadius: "8px",
          padding: "13px 20px",
          color: isVideoLoading || isFramesLoading ? "#404040" : "#D9D9D9",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          cursor: isVideoLoading || isFramesLoading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (isVideoLoading || isFramesLoading) return
          e.currentTarget.style.background = "rgba(255,255,255,0.04)"
          e.currentTarget.style.borderColor = "#ffffff"
          e.currentTarget.style.color = "#ffffff"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent"
          e.currentTarget.style.borderColor = isVideoLoading || isFramesLoading ? "#404040" : "#D9D9D9"
          e.currentTarget.style.color = isVideoLoading || isFramesLoading ? "#404040" : "#D9D9D9"
        }}
      >
        <ArrowRight size={14} />
        {isVideoLoading ? "Generating Video..." : "Generate Video"}
      </button>

    </div>
  )
}
