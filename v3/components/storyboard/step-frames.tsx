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
        borderRadius: "6px",
        padding: "10px 12px",
        fontSize: "13px",
        lineHeight: 1.6,
        color: "#D9D9D9",
        outline: "none",
        fontFamily: "var(--font-inter)",
        minHeight: "72px",
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
  const [regenHover, setRegenHover] = useState(false)
  const [videoHover, setVideoHover] = useState(false)
  const isDisabled = isFramesLoading || isVideoLoading

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ padding: "16px", overflowY: "auto" }}>

      {/* Frame preview — fixed height fills properly, object-cover fills the frame */}
      <div style={{ height: "260px", flexShrink: 0, position: "relative" }}>
        {isVideoLoading ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#111111",
              border: "1px solid #232323",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
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

      {/* Meta row: label + regenerate — flush below the preview */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "8px 0",
          marginBottom: "16px",
          borderBottom: "1px solid #1a1a1a",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "#575757",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
          }}
        >
          Start Frame
        </span>

        <button
          type="button"
          onClick={onRegenerateFrames}
          disabled={isDisabled}
          onMouseEnter={() => setRegenHover(true)}
          onMouseLeave={() => setRegenHover(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "none",
            border: "none",
            padding: "2px 0",
            cursor: isDisabled ? "not-allowed" : "pointer",
            color: isDisabled ? "#404040" : regenHover ? "#D9D9D9" : "#696969",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.02em",
            transition: "color 0.15s ease",
          }}
        >
          <RefreshCw size={11} />
          Regenerate
        </button>
      </div>

      {/* Prompt label + textarea */}
      <div style={{ marginBottom: "16px", flexShrink: 0 }}>
        <span
          style={{
            fontSize: "10px",
            color: "#575757",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
            display: "block",
            marginBottom: "7px",
          }}
        >
          Frame Prompt
        </span>
        <PromptTextarea value={startFramePrompt} onChange={onUpdatePrompt} />
      </div>

      {/* Generate Video — footer action */}
      <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "14px", flexShrink: 0, marginTop: "auto" }}>
        <button
          type="button"
          onClick={onGenerateVideo}
          disabled={isDisabled}
          onMouseEnter={() => setVideoHover(true)}
          onMouseLeave={() => setVideoHover(false)}
          className="w-full flex items-center justify-between"
          style={{
            background: isDisabled
              ? "transparent"
              : videoHover
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.03)",
            border: `1px solid ${isDisabled ? "#2a2a2a" : videoHover ? "#696969" : "#333333"}`,
            borderRadius: "6px",
            padding: "11px 14px",
            color: isDisabled ? "#404040" : "#ffffff",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.04em",
            cursor: isDisabled ? "not-allowed" : "pointer",
            transition: "border-color 0.15s ease, background 0.15s ease, color 0.15s ease",
          }}
        >
          <span>{isVideoLoading ? "Generating Video..." : "Generate Video"}</span>
          <ArrowRight
            size={13}
            style={{
              opacity: isDisabled ? 0.3 : 1,
              transition: "transform 0.2s ease, opacity 0.15s ease",
              transform: videoHover && !isDisabled ? "translateX(2px)" : "none",
            }}
          />
        </button>
      </div>

    </div>
  )
}
