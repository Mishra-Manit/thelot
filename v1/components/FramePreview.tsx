'use client'

import type { Scene, Shot } from '@/db/schema'
import CompositionProvider, { useComposition } from './editor/CompositionProvider'
import VideoPlayer from './editor/VideoPlayer'

type Props = {
  shot: Shot | null
  scene: Scene | null
}

// ─── Styled playback controls ─────────────────────────────────────────────────

function PlaybackControls() {
  const { isPlaying, currentTime, duration, play, pause } = useComposition()

  function fmt(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="flex items-center justify-center gap-4 py-2 flex-shrink-0">
      <span style={{ fontSize: 11, color: '#777076', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(currentTime)}
      </span>

      {/* Skip back */}
      <button style={{ color: '#777076', cursor: 'pointer', display: 'flex' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#777076"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
      </button>

      {/* Play / Pause */}
      <button
        onClick={isPlaying ? pause : play}
        className="flex items-center justify-center rounded-full cursor-pointer transition-colors"
        style={{ width: 36, height: 36, backgroundColor: '#597D7C', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#386775' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#597D7C' }}
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0D0E14"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#0D0E14" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>

      {/* Skip forward */}
      <button style={{ color: '#777076', cursor: 'pointer', display: 'flex' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#777076"><path d="M6 18l8.5-6L6 6v12zm2-8.14 4.94 3.5L8 17.14V9.86zM16 6h2v12h-2z"/></svg>
      </button>

      <span style={{ fontSize: 11, color: '#777076', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(duration)}
      </span>
    </div>
  )
}

// ─── LoadingOverlay ───────────────────────────────────────────────────────────

function LoadingOverlay() {
  const { loading } = useComposition()
  if (!loading) return null
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'rgba(13,14,20,0.7)' }}>
      <span style={{ fontSize: 11, color: '#777076' }}>Loading…</span>
    </div>
  )
}

// ─── FramePreview ─────────────────────────────────────────────────────────────

export default function FramePreview({ shot, scene }: Props) {
  const sceneNumber = scene ? (scene.order + 1) : null
  const shotLabel = sceneNumber != null ? `Scene ${sceneNumber}` : 'Select a shot'

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: '#0D0E14', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Video area */}
      <div className="flex-1 flex items-center justify-center p-4 pb-1 min-h-0">
        <div className="relative w-full h-full rounded-xl overflow-hidden">
          {shot ? (
            <CompositionProvider videoUrl={shot.videoUrl}>
              {/* Video canvas fills the container */}
              <VideoPlayer />
              <LoadingOverlay />

              {/* Vignette overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)' }}
              />

              {/* Shot label — top left */}
              <div
                className="absolute top-3 left-3 px-2.5 py-1 rounded-md pointer-events-none"
                style={{ backgroundColor: 'rgba(13,14,20,0.7)', backdropFilter: 'blur(8px)', fontSize: 11, color: '#ffffff' }}
              >
                {shotLabel}
              </div>

              {/* Playback controls overlay at bottom of card */}
              <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
                <PlaybackControls />
              </div>
            </CompositionProvider>
          ) : (
            <>
              {/* Empty state — dark placeholder */}
              <div className="w-full h-full" style={{ backgroundColor: '#0a0b10' }} />
              <div
                className="absolute top-3 left-3 px-2.5 py-1 rounded-md"
                style={{ backgroundColor: 'rgba(13,14,20,0.7)', backdropFilter: 'blur(8px)', fontSize: 11, color: '#777076' }}
              >
                Select a shot
              </div>
            </>
          )}
        </div>
      </div>

      {/* Static playback bar when no shot */}
      {!shot && (
        <div className="flex items-center justify-center gap-4 py-2 flex-shrink-0">
          <span style={{ fontSize: 11, color: '#404556', fontVariantNumeric: 'tabular-nums' }}>00:00</span>
          <button className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, backgroundColor: '#252933' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#404556" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z"/></svg>
          </button>
          <span style={{ fontSize: 11, color: '#404556', fontVariantNumeric: 'tabular-nums' }}>00:00</span>
        </div>
      )}
    </div>
  )
}
