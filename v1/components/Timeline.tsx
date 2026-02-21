'use client'

import { useEffect, useState } from 'react'
import type { Scene, Shot } from '@/db/schema'

type Props = {
  scene: Scene | null
  selectedShot: Shot | null
  onSelectShot: (shot: Shot) => void
}

export default function Timeline({ scene, selectedShot, onSelectShot }: Props) {
  const [shots, setShots] = useState<Shot[]>([])

  useEffect(() => {
    if (!scene) { setShots([]); return }

    let cancelled = false

    fetch(`/api/scenes/${scene.id}/shots`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed: ${r.status}`)
        return r.json()
      })
      .then(({ data }) => { if (!cancelled) setShots(data) })
      .catch(() => { if (!cancelled) setShots([]) })

    return () => { cancelled = true }
  }, [scene])

  return (
    <footer className="flex h-24 shrink-0 items-center gap-2 overflow-x-auto rounded-xl border border-transparent bg-dark-navy/80 px-5 py-3">
      {shots.length === 0 ? (
        <span className="text-slate-gray text-[10px] font-body tracking-widest uppercase">
          {scene ? 'No shots in this scene' : 'Select a scene'}
        </span>
      ) : (
        shots.map(shot => (
          <button
            key={shot.id}
            onClick={() => onSelectShot(shot)}
            style={{ minWidth: shot.duration ? `${shot.duration * 20}px` : '80px' }}
            className={`h-12 shrink-0 rounded-md border px-3 text-xs font-heading font-500 transition-colors ${
              selectedShot?.id === shot.id
                ? 'bg-forest-green/25 border-forest-green text-white'
                : 'bg-dark-black border-transparent text-muted-mauve hover:border-forest-green hover:text-warm-gray'
            }`}
          >
            {shot.title}
          </button>
        ))
      )}
    </footer>
  )
}
