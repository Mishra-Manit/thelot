'use client'

import type { Shot } from '@/db/schema'
import CompositionProvider from './editor/CompositionProvider'
import VideoPlayer from './editor/VideoPlayer'
import PlaybackControls from './editor/PlaybackControls'

type Props = {
  shot: Shot | null
}

export default function FramePreview({ shot }: Props) {
  return (
    <aside className="w-72 bg-dark-black border-l border-slate-gray flex flex-col overflow-hidden shrink-0">
      <div className="p-4 border-b border-slate-gray">
        <span className="font-heading font-600 text-sm uppercase tracking-widest text-warm-gray">
          Preview
        </span>
      </div>

      {shot ? (
        <CompositionProvider>
          {/* Video canvas — fills available vertical space */}
          <VideoPlayer />

          {/* Playback bar */}
          <PlaybackControls />

          {/* Duration info */}
          <div className="flex flex-col gap-1 p-4 border-t border-slate-gray">
            <span className="text-xs font-heading font-500 uppercase tracking-widest text-warm-gray">
              Duration
            </span>
            <span className="text-sm font-body text-white">
              {shot.duration != null ? `${shot.duration}s` : '—'}
            </span>
          </div>
        </CompositionProvider>
      ) : (
        <div className="flex-1 flex items-center justify-center text-warm-gray text-xs font-body">
          No shot selected
        </div>
      )}
    </aside>
  )
}
