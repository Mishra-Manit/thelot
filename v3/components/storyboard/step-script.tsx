"use client"

import { useRef, useEffect, useCallback } from "react"
import { Sparkles, ArrowRight } from "lucide-react"
import { SimpsonLoading } from "./loading/simpson-loading"

interface StepScriptProps {
  startFramePrompt: string
  isFramesLoading: boolean
  isFramesReady: boolean
  startFrameImageUrl: string
  onUpdatePrompt: (value: string) => void
  onGenerateFrames: () => void
  onMoveToVideo: () => void
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

export function StepScript({ 
  startFramePrompt, 
  isFramesLoading, 
  isFramesReady,
  startFrameImageUrl,
  onUpdatePrompt, 
  onGenerateFrames,
  onMoveToVideo
}: StepScriptProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px" }}>

      {/* Frame placeholder / loading area — position: relative so absolute-positioned loaders stay contained */}
      <div
        className="flex items-center justify-center rounded-lg mb-4 overflow-hidden"
        style={{ position: "relative", background: "#111111", border: "1px solid #232323", height: "300px", flexShrink: 0 }}
      >
        {isFramesLoading ? (
          <SimpsonLoading label="Generating start frame..." />
        ) : isFramesReady && startFrameImageUrl ? (
          <img 
            src={startFrameImageUrl} 
            alt="Start frame" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = "none"
              const parent = e.currentTarget.parentElement
              if (parent) {
                const fallback = document.createElement("div")
                fallback.className = "flex flex-col items-center gap-3"
                fallback.innerHTML = `
                  <div class="flex items-center justify-center rounded-lg" style="width: 40px; height: 40px; background: rgba(105,105,105,0.12); border: 1px dashed rgba(105,105,105,0.3)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#696969" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off"><line x1="3" x2="21" y1="3" y2="21"/><path d="M10.5 10.5 15 15"/><path d="m21 15-3.086-2.855"/><path d="m21 12.54V5a2 2 0 0 0-2-2H7.5"/><path d="M3 8v11a2 2 0 0 0 2 2h14"/></svg>
                  </div>
                  <span style="font-size: 12px; color: #696969">Image failed to load</span>
                `
                parent.appendChild(fallback)
              }
            }}
          />
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
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: "11px", color: "#696969", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, display: "block", marginBottom: "6px" }}>
          Start Frame Prompt
        </span>
        <PromptTextarea value={startFramePrompt} onChange={onUpdatePrompt} />
      </div>

      <div className="flex flex-col gap-2 pt-2" style={{ flexShrink: 0 }}>
        {/* Generate CTA */}
        <button
          type="button"
          onClick={onGenerateFrames}
          disabled={isFramesLoading}
          className="w-full flex items-center justify-center gap-2 transition-all duration-150"
          style={{
            background: isFramesLoading || isFramesReady ? "transparent" : "#ffffff",
            border: `1px solid ${isFramesLoading || isFramesReady ? "#232323" : "#ffffff"}`,
            borderRadius: "8px",
            padding: "12px 20px",
            color: isFramesLoading ? "#696969" : isFramesReady ? "#D9D9D9" : "#000000",
            fontSize: "11px",
            textTransform: "uppercase",
            fontWeight: 600,
            letterSpacing: "0.05em",
            cursor: isFramesLoading ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (isFramesLoading) return
            if (isFramesReady) {
              e.currentTarget.style.borderColor = "#464646"
              e.currentTarget.style.color = "#ffffff"
            } else {
              e.currentTarget.style.background = "#D9D9D9"
              e.currentTarget.style.borderColor = "#D9D9D9"
            }
          }}
          onMouseLeave={(e) => {
            if (isFramesLoading) return
            if (isFramesReady) {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.borderColor = "#232323"
              e.currentTarget.style.color = "#D9D9D9"
            } else {
              e.currentTarget.style.background = "#ffffff"
              e.currentTarget.style.borderColor = "#ffffff"
              e.currentTarget.style.color = "#000000"
            }
          }}
        >
          <Sparkles size={14} />
          {isFramesLoading 
            ? "GENERATING..." 
            : isFramesReady 
              ? "CHANGE THE PROMPT AND REGENERATE?" 
              : "GENERATE START FRAME"}
        </button>

        {/* Move to Video CTA */}
        {isFramesReady && !isFramesLoading && (
          <button
            type="button"
            onClick={onMoveToVideo}
            className="w-full flex items-center justify-center gap-2 transition-all duration-150"
            style={{
              background: "#ffffff",
              border: "1px solid #ffffff",
              borderRadius: "8px",
              padding: "12px 20px",
              color: "#000000",
              fontSize: "11px",
              textTransform: "uppercase",
              fontWeight: 600,
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#D9D9D9"
              e.currentTarget.style.borderColor = "#D9D9D9"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff"
              e.currentTarget.style.borderColor = "#ffffff"
            }}
          >
            MOVE TO VIDEO GENERATION
            <ArrowRight size={14} />
          </button>
        )}
      </div>

    </div>
  )
}
