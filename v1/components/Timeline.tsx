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
    fetch(`/api/scenes/${scene.id}/shots`)
      .then(r => r.json())
      .then(({ data }) => setShots(data))
  }, [scene])

  return (
    <footer className="h-24 bg-dark-navy border-t border-slate-gray flex items-center px-4 gap-2 overflow-x-auto shrink-0">
      {shots.length === 0 ? (
        <span className="text-warm-gray text-xs font-body">
          {scene ? 'No shots in this scene' : 'Select a scene'}
        </span>
      ) : (
        shots.map(shot => (
          <button
            key={shot.id}
            onClick={() => onSelectShot(shot)}
            className={`shrink-0 h-14 px-3 rounded text-xs font-heading font-500 border transition-colors ${
              selectedShot?.id === shot.id
                ? 'bg-teal border-teal text-white'
                : 'bg-dark-black border-slate-gray text-warm-gray hover:border-teal hover:text-white'
            }`}
            style={{ minWidth: shot.duration ? `${shot.duration * 20}px` : '80px' }}
          >
            {shot.title}
          </button>
        ))
      )}
    </footer>
  )
}
