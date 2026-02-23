"use client"

import { useState, useEffect } from "react"
import { ImageIcon, Sparkles } from "lucide-react"
import { SimpsonLoading } from "./loading/simpson-loading"
import { PrincessLoading } from "./loading/princess-loading"

// Handle exposed to parent components for video control
export interface FramePreviewHandle {
  play: () => void
  pause: () => void
  seek: (seconds: number) => void
}

/* ── Frame Card ─────────────────────────── */

export function FrameCard({
  label,
  sublabel,
  hover,
  onHover,
  prompt,
  imageUrl,
  fallbackImageUrl,
  isLoading = false,
  isReady = false,
  onGenerate,
  isEnd,
}: {
  label: string
  sublabel: string
  hover: boolean
  onHover: (v: boolean) => void
  prompt: string
  imageUrl: string
  fallbackImageUrl?: string
  isLoading?: boolean
  isReady?: boolean
  onGenerate?: () => void
  isEnd?: boolean
}) {
  const [imageError, setImageError] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl)

  useEffect(() => {
    setImageError(false)
    setCurrentImageUrl(imageUrl)
  }, [imageUrl])

  return (
    <div
      className="flex flex-col flex-1 rounded-lg overflow-hidden transition-all duration-150"
      style={{
        background: "#111111",
        border: hover ? "1px solid #696969" : "1px solid #232323",
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Image area */}
      <div className="flex-1 relative flex items-center justify-center" style={{ minHeight: "80px" }}>
        <div
          className="absolute top-2 left-2 z-20 flex items-center rounded-full cursor-default"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "4px 10px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
        </div>

        {/* Subtle gradient bg */}
        <div
          className="absolute inset-0"
          style={{
            background: isEnd
              ? "linear-gradient(135deg, #111111 0%, #232323 100%)"
              : "linear-gradient(135deg, #111111 0%, #232323 100%)",
          }}
        />

        {isLoading ? (
          isEnd ? <PrincessLoading /> : <SimpsonLoading />
        ) : isReady && currentImageUrl && !imageError ? (
          <img
            src={currentImageUrl}
            alt={`${label} preview`}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => {
              if (fallbackImageUrl && currentImageUrl !== fallbackImageUrl) {
                setCurrentImageUrl(fallbackImageUrl)
                return
              }
              setImageError(true)
            }}
          />
        ) : (
          <div className="relative flex flex-col items-center gap-2">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: "36px",
                height: "36px",
                background: isEnd
                  ? "rgba(87,87,87,0.12)"
                  : "rgba(105,105,105,0.15)",
                border: isEnd
                  ? "1px dashed rgba(87,87,87,0.25)"
                  : "1px dashed rgba(105,105,105,0.3)",
              }}
            >
              {isEnd ? (
                <ImageIcon size={14} style={{ color: "#575757" }} />
              ) : (
                <Sparkles size={14} style={{ color: "#696969" }} />
              )}
            </div>
            <span
              style={{
                fontSize: "10px",
                color: "#696969",
                textAlign: "center",
                maxWidth: "120px",
                lineHeight: "1.4",
              }}
            >
              {isReady && imageError ? "Frame preview unavailable" : "Generate frame from prompt"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
