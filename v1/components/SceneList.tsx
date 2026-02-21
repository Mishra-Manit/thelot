'use client'

import { useEffect, useState } from 'react'
import type { Scene, Shot } from '@/db/schema'

type Props = {
  selectedScene: Scene | null
  selectedShot: Shot | null
  onSelectScene: (scene: Scene) => void
  onSelectShot: (shot: Shot) => void
}

type SceneWithShots = Scene & { shots: Shot[] }

export default function SceneList({ selectedScene, selectedShot, onSelectScene, onSelectShot }: Props) {
  const [scenes, setScenes] = useState<SceneWithShots[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/scenes')
        if (!res.ok) return
        const { data } = await res.json()
        const withShots = await Promise.all(
          data.map(async (scene: Scene) => {
            const r = await fetch(`/api/scenes/${scene.id}/shots`)
            const { data: shots } = await r.json()
            return { ...scene, shots: r.ok ? shots : [] }
          })
        )
        setScenes(withShots)
      } catch { /* network error — leave list empty */ }
    }
    load()
  }, [])

  async function addScene() {
    try {
      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Scene', order: scenes.length }),
      })
      if (!res.ok) return
      const { data } = await res.json()
      setScenes(prev => [...prev, { ...data, shots: [] }])
      onSelectScene(data)
    } catch { /* network error */ }
  }

  async function addShot(scene: SceneWithShots) {
    try {
      const res = await fetch(`/api/scenes/${scene.id}/shots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Shot', order: scene.shots.length }),
      })
      if (!res.ok) return
      const { data } = await res.json()
      setScenes(prev =>
        prev.map(s => s.id === scene.id ? { ...s, shots: [...s.shots, data] } : s)
      )
      onSelectShot(data)
    } catch { /* network error */ }
  }

  return (
    <aside className="w-64 shrink-0 overflow-hidden rounded-xl border border-transparent bg-dark-black/80">
      <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-[10px] font-heading font-600 uppercase tracking-widest text-muted-mauve">
          Scenes
        </span>
        <button
          onClick={addScene}
          className="rounded-md px-2 py-1 text-base leading-none text-slate-gray transition-colors hover:bg-dark-teal/60 hover:text-white"
          title="New scene"
        >
          +
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3 pt-1">
        {scenes.map(scene => (
          <div key={scene.id} className="space-y-1">
            {/* Scene row — two sibling buttons to avoid nested interactive elements */}
            <div className={`group flex items-center rounded-md transition-colors ${
              selectedScene?.id === scene.id ? 'bg-dark-teal/70' : 'hover:bg-dark-teal/50'
            }`}>
              <button
                onClick={() => onSelectScene(scene)}
                className={`flex-1 truncate rounded-l-md px-3.5 py-2.5 text-left text-xs font-heading font-500 transition-colors ${
                  selectedScene?.id === scene.id ? 'text-white' : 'text-warm-gray'
                }`}
              >
                {scene.title}
              </button>
              <button
                onClick={() => addShot(scene)}
                className="rounded-r-md px-3 py-2.5 text-sm leading-none text-slate-gray opacity-0 transition-colors group-hover:opacity-100 hover:text-forest-green"
                title="New shot"
              >
                +
              </button>
            </div>

            {scene.shots.map(shot => (
              <button
                key={shot.id}
                onClick={() => { onSelectScene(scene); onSelectShot(shot) }}
                className={`w-full rounded-md border-l-2 py-2 pl-6 pr-3 text-left text-xs transition-colors ${
                  selectedShot?.id === shot.id
                    ? 'bg-forest-green/25 text-white border-forest-green'
                    : 'text-muted-mauve hover:text-warm-gray hover:bg-dark-teal/40 border-transparent'
                }`}
              >
                {shot.title}
              </button>
            ))}
          </div>
        ))}
      </div>
      </div>
    </aside>
  )
}
