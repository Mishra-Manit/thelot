'use client'

import { useComposition } from './CompositionProvider'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PlaybackControls() {
  const { isPlaying, currentTime, duration, play, pause, seek } = useComposition()

  const position = duration > 0 ? currentTime / duration : 0

  return (
    <div className="flex items-center gap-3 border-t border-transparent bg-dark-navy/80 px-5 py-3.5">
      <button
        onClick={isPlaying ? pause : play}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-deep-teal text-xs text-white transition-colors hover:bg-forest-green"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>

      <span className="text-xs font-body text-warm-gray tabular-nums whitespace-nowrap">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={position}
        onChange={e => seek(Number(e.target.value) * duration)}
        className="h-1.5 flex-1 cursor-pointer accent-forest-green"
      />
    </div>
  )
}
