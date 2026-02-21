import type { Shot } from '@/db/schema'

type Props = {
  shot: Shot | null
}

// Placeholder frame box — will show start/end frame images when media upload is added
function FrameBox({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-heading font-500 uppercase tracking-widest text-warm-gray">
        {label}
      </span>
      <div className="aspect-video bg-dark-navy border border-slate-gray rounded flex items-center justify-center text-warm-gray text-xs">
        No frame
      </div>
    </div>
  )
}

export default function FramePreview({ shot }: Props) {
  return (
    <aside className="w-72 bg-dark-black border-l border-slate-gray p-4 flex flex-col gap-6 overflow-y-auto shrink-0">
      <span className="font-heading font-600 text-sm uppercase tracking-widest text-warm-gray">
        Preview
      </span>

      {shot ? (
        <>
          <FrameBox label="Start Frame" />
          <FrameBox label="End Frame" />

          <div className="flex flex-col gap-1">
            <span className="text-xs font-heading font-500 uppercase tracking-widest text-warm-gray">
              Duration
            </span>
            <span className="text-sm font-body text-white">
              {shot.duration != null ? `${shot.duration}s` : '—'}
            </span>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-warm-gray text-xs font-body">
          No shot selected
        </div>
      )}
    </aside>
  )
}
