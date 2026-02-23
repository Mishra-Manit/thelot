"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { ImageIcon, Sparkles, List, Mic, Library, Smile } from "lucide-react"
import { VideoPlayer, type VideoPlayerHandle } from "./video-player"
import { SpongebobLoading } from "./loading/spongebob-loading"
import { SimpsonLoading } from "./loading/simpson-loading"
import { PrincessLoading } from "./loading/princess-loading"
import type { ShotInput } from "@/lib/storyboard-types"

// Handle exposed to parent components for video control
export interface FramePreviewHandle {
  play: () => void
  pause: () => void
  seek: (seconds: number) => void
}

interface FramePreviewProps {
  sceneNumber: number | null
  shotNumber: number | null
  totalShots: number
  startFramePrompt: string
  shotTitle: string
  shots: ShotInput[]
  isSaving?: boolean
  startFrameImageUrl: string
  endFrameImageUrl: string
  endFrameFallbackImageUrl: string
  isFramesLoading: boolean
  areFramesReady: boolean
  isVideoLoading: boolean
  onGenerateFrames: () => void
  onVideoTimeUpdate?: (time: number, duration: number) => void
  onVideoPlayStateChange?: (playing: boolean) => void
}

export const FramePreview = forwardRef<FramePreviewHandle, FramePreviewProps>(
  function FramePreview(
    {
      sceneNumber,
      shotNumber,
      shots,
      isVideoLoading,
      onVideoTimeUpdate,
      onVideoPlayStateChange,
    },
    ref
  ) {
    const hasShot = sceneNumber !== null && shotNumber !== null

    // Playback state driven by the VideoPlayer composition
    const playerRef = useRef<VideoPlayerHandle | null>(null)

    // Expose play/pause/seek to parent via forwardRef
    useImperativeHandle(ref, () => ({
      play: () => playerRef.current?.play(),
      pause: () => playerRef.current?.pause(),
      seek: (seconds: number) => playerRef.current?.seek(seconds),
    }))

  return (
    <div
      className="flex flex-col flex-1 min-w-0"
      style={{ background: "#000000" }}
    >
      {hasShot ? (
        <div className="flex flex-col flex-1 min-h-0" style={{ padding: "12px 12px 4px 12px" }}>
          {/* AI Tools Section */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center px-1">
              <span
                style={{
                  fontSize: "14px",
                  color: "#ffffff",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                }}
              >
                Tools
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Scene List",
                  description: "View and manage shots in this scene",
                  icon: List,
                },
                {
                  label: "Voice Generation",
                  description: "Generate dialogue from text or your voice",
                  icon: Mic,
                },
                {
                  label: "Media Library",
                  description: "Browse all videos and audio in this scene",
                  icon: Library,
                },
                {
                  label: "Lip Sync",
                  description: "Sync video to audio with AI lip movement",
                  icon: Smile,
                },
              ].map(({ label, description, icon: Icon }) => (
                <div
                  key={label}
                  className="group relative rounded-xl transition-all duration-200 border border-[#232323] hover:border-[#696969] cursor-pointer overflow-hidden"
                  style={{
                    background: "#111111",
                    padding: "16px",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)",
                    }}
                  />
                  <div className="relative z-10 flex items-start gap-3">
                    <div
                      className="flex shrink-0 items-center justify-center rounded-lg border border-[#2A2A2A] transition-colors group-hover:border-[#4A4A4A]"
                      style={{
                        width: "36px",
                        height: "36px",
                        background: "#1A1A1A",
                      }}
                    >
                      <Icon
                        size={16}
                        style={{ color: "#D9D9D9" }}
                        className="group-hover:text-white transition-colors"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#ffffff",
                          fontWeight: 500,
                          letterSpacing: "0.01em",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#888888",
                          lineHeight: "1.4",
                        }}
                      >
                        {description}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Video Preview */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div
              className="relative w-full h-full rounded-lg overflow-hidden"
              style={{ background: "#111111", border: "1px solid #232323" }}
            >
              {/* Video Preview label */}
              <div
                className="absolute top-3 left-3 z-20 flex items-center rounded-full cursor-default"
                style={{
                  background: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "4px 10px",
                }}
              >
                <span style={{ fontSize: "10px", color: "#ffffff", fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                  Video Preview
                </span>
              </div>

              <VideoPlayer
                shots={shots}
                onTimeUpdate={(cur, dur) => {
                  onVideoTimeUpdate?.(cur, dur)
                }}
                onPlayStateChange={(playing) => {
                  onVideoPlayStateChange?.(playing)
                }}
                playerRef={playerRef}
              />
              {isVideoLoading && (
                <div className="absolute inset-0 z-10">
                  <SpongebobLoading compact />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span style={{ fontSize: "11px", color: "#D9D9D9" }}>
            Select a shot
          </span>
        </div>
      )}
    </div>
  )
}
)

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
