'use client'

import type { Shot } from '@/db/schema'
import CompositionProvider, { useComposition } from './editor/CompositionProvider'
import VideoPlayer from './editor/VideoPlayer'
import PlaybackControls from './editor/PlaybackControls'

type Props = {
  shot: Shot | null
}

function LoadingOverlay() {
  const { loading } = useComposition()
  if (!loading) return null
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-dark-black/70 z-10">
      <span className="text-xs font-body text-warm-gray animate-pulse">Loading…</span>
    </div>
  )
}

export default function FramePreview({ shot }: Props) {
  return (
    <aside className="flex w-[500px] shrink-0 flex-col overflow-hidden rounded-xl border border-transparent bg-dark-black/80">
      <div className="flex items-center justify-between px-5 py-3.5">
        <span className="text-[10px] font-heading font-600 uppercase tracking-widest text-warm-gray">
          Preview
        </span>
        {shot && (
          <span className="text-xs font-body text-forest-green truncate max-w-[200px]">
            {shot.title}
          </span>
        )}
      </div>

      {shot ? (
        <CompositionProvider videoUrl={shot.videoUrl}>
          <div className="flex flex-1 items-start px-4 pb-4 pt-2">
            {/*
              Keep the preview viewport at the same aspect ratio as the composition.
              This removes letterboxing when source/composition dimensions match.
            */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-transparent bg-black">
              <LoadingOverlay />
              <VideoPlayer />
            </div>
          </div>
          <PlaybackControls />
        </CompositionProvider>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-gray text-[10px] font-body tracking-widest uppercase">
          No shot selected
        </div>
      )}
    </aside>
  )
}
