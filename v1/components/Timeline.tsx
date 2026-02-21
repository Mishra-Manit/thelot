'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
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
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(({ data }) => { if (!cancelled) setShots(data) })
      .catch(() => { if (!cancelled) setShots([]) })
    return () => { cancelled = true }
  }, [scene])

  const totalDuration = shots.reduce((sum, s) => sum + (s.duration ?? 0), 0)

  return (
    <div
      className="flex-shrink-0 px-4 py-3"
      style={{ backgroundColor: '#0D0E14', borderTop: '1px solid #252933', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Label row */}
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 10, color: '#404556', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {scene ? `Scene ${scene.order + 1} — Shot Timeline` : 'Shot Timeline'}
        </span>
        <div className="flex-1" style={{ height: 1, backgroundColor: '#252933' }} />
        {shots.length > 0 && (
          <span style={{ fontSize: 10, color: '#404556', fontVariantNumeric: 'tabular-nums' }}>
            {shots.length} shots • {totalDuration}s
          </span>
        )}
      </div>

      {/* Pills row */}
      <div
        className="flex items-center gap-1 p-1.5 rounded-full overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {shots.length === 0 ? (
          <span style={{ fontSize: 11, color: '#404556', padding: '0 4px' }}>
            {scene ? 'No shots yet' : 'Select a scene'}
          </span>
        ) : (
          shots.map((shot, idx) => {
            const isActive = shot.id === selectedShot?.id
            const flex = Math.max(shot.duration ?? 1, 1)
            return (
              <div
                key={shot.id}
                onClick={() => onSelectShot(shot)}
                className="relative rounded-[20px] overflow-hidden cursor-pointer transition-all"
                style={{
                  flex: `${flex} 0 0`,
                  minWidth: 50,
                  height: 44,
                  border: isActive ? '2px solid #597D7C' : '2px solid transparent',
                  boxShadow: isActive ? '0 0 10px #597D7C44' : 'none',
                  opacity: isActive ? 1 : 0.65,
                  backgroundColor: '#17292B',
                  borderRadius: 20,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.opacity = '0.65' }}
              >
                {/* Placeholder bg with gradient */}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to right, rgba(13,14,20,0.6), rgba(13,14,20,0.25))' }}
                />
                {/* Shot number */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span style={{ fontSize: 10, color: isActive ? '#597D7C' : '#777076', fontWeight: 600, letterSpacing: '0.02em' }}>
                    {idx + 1}
                  </span>
                </div>
              </div>
            )
          })
        )}

        {/* Add shot placeholder */}
        {scene && (
          <button
            className="flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors"
            style={{ width: 44, height: 44, backgroundColor: '#17292B', border: '1px dashed #597D7C', color: '#597D7C', borderRadius: 20 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#20504E' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#17292B' }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
