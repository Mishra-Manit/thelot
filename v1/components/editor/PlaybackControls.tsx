'use client'

import { useComposition } from './CompositionProvider'

/** Formats seconds into MM:SS display */
function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PlaybackControls() {
    const { isPlaying, currentTime, duration, play, pause, seek } = useComposition()

    const position = duration > 0 ? currentTime / duration : 0

    return (
        <div className="flex items-center gap-3 px-3 py-2 bg-dark-navy border-t border-slate-gray">
            {/* Play / Pause */}
            <button
                onClick={isPlaying ? pause : play}
                className="w-8 h-8 flex items-center justify-center rounded bg-teal hover:bg-deep-teal text-white text-sm transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? '❚❚' : '▶'}
            </button>

            {/* Time display */}
            <span className="text-xs font-body text-warm-gray tabular-nums min-w-[5rem]">
                {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Seek slider */}
            <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={position}
                onChange={e => seek(Number(e.target.value) * duration)}
                className="flex-1 h-1 accent-teal cursor-pointer"
            />
        </div>
    )
}
