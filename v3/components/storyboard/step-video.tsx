"use client"

import { Film, RefreshCw, Check } from "lucide-react"
import { SpongebobLoading } from "./loading/spongebob-loading"

interface StepVideoProps {
  videoUrl: string
  isVideoLoading: boolean
  isApproved: boolean
  onRegenerateVideo: () => void
  onApproveShot: () => void
}

export function StepVideo({
  isVideoLoading,
  isApproved,
  onRegenerateVideo,
  onApproveShot,
}: StepVideoProps) {
  const isDisabled = isVideoLoading

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ padding: "16px" }}>

      {/* Video preview area — position: relative so SpongebobLoading's absolute inset-0 stays contained */}
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          position: "relative",
          background: "#111111",
          border: `1px solid ${isApproved ? "#696969" : "#232323"}`,
          borderRadius: "8px",
          marginBottom: "12px",
          height: "220px",
        }}
      >
        {isVideoLoading ? (
          <SpongebobLoading compact />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(105,105,105,0.12)",
                border: `1px solid ${isApproved ? "#696969" : "#575757"}`,
                borderRadius: "10px",
              }}
            >
              {isApproved ? (
                <Check size={22} color="#D9D9D9" />
              ) : (
                <Film size={22} color="#696969" />
              )}
            </div>
            <span style={{ fontSize: "13px", color: isApproved ? "#D9D9D9" : "#696969", fontWeight: 500 }}>
              {isApproved ? "Shot approved" : "Video ready"}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Regenerate — secondary */}
        <button
          type="button"
          onClick={onRegenerateVideo}
          disabled={isDisabled}
          className="flex items-center justify-center gap-2 transition-all duration-150"
          style={{
            background: "transparent",
            border: `1px solid ${isDisabled ? "#404040" : "#232323"}`,
            borderRadius: "8px",
            padding: "11px 16px",
            color: isDisabled ? "#404040" : "#696969",
            fontSize: "11px",
            textTransform: "uppercase",
            fontWeight: 600,
            letterSpacing: "0.05em",
            cursor: isDisabled ? "not-allowed" : "pointer",
            flex: "0 0 auto",
          }}
          onMouseEnter={(e) => {
            if (isDisabled) return
            e.currentTarget.style.borderColor = "#696969"
            e.currentTarget.style.color = "#D9D9D9"
          }}
          onMouseLeave={(e) => {
            if (isDisabled) return
            e.currentTarget.style.borderColor = "#232323"
            e.currentTarget.style.color = "#696969"
          }}
        >
          <RefreshCw size={13} />
          REGENERATE
        </button>

        {/* Approve Shot — primary */}
        <button
          type="button"
          onClick={onApproveShot}
          disabled={isDisabled || isApproved}
          className="flex flex-1 items-center justify-center gap-2 transition-all duration-150"
          style={{
            background: "transparent",
            border: `1px solid ${isApproved ? "#696969" : isDisabled ? "#404040" : "#D9D9D9"}`,
            borderRadius: "8px",
            padding: "11px 16px",
            color: isApproved ? "#696969" : isDisabled ? "#404040" : "#D9D9D9",
            fontSize: "11px",
            textTransform: "uppercase",
            fontWeight: 600,
            letterSpacing: "0.05em",
            cursor: isDisabled || isApproved ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (isDisabled || isApproved) return
            e.currentTarget.style.background = "rgba(255,255,255,0.04)"
            e.currentTarget.style.borderColor = "#ffffff"
            e.currentTarget.style.color = "#ffffff"
          }}
          onMouseLeave={(e) => {
            if (isDisabled || isApproved) return
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.borderColor = "#D9D9D9"
            e.currentTarget.style.color = "#D9D9D9"
          }}
        >
          {isApproved && <Check size={13} />}
          {isApproved ? "SHOT APPROVED" : "APPROVE SHOT"}
        </button>
      </div>
    </div>
  )
}
