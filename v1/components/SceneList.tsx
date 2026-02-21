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
    fetchScenes()
  }, [])

  async function fetchScenes() {
    const res = await fetch('/api/scenes')
    const { data } = await res.json()
    // Fetch shots for each scene in parallel
    const withShots = await Promise.all(
      data.map(async (scene: Scene) => {
        const shotsRes = await fetch(`/api/scenes/${scene.id}/shots`)
        const { data: shots } = await shotsRes.json()
        return { ...scene, shots }
      })
    )
    setScenes(withShots)
  }

  async function addScene() {
    const res = await fetch('/api/scenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Scene', order: scenes.length }),
    })
    const { data } = await res.json()
    setScenes(prev => [...prev, { ...data, shots: [] }])
    onSelectScene(data)
  }

  async function addShot(scene: SceneWithShots) {
    const res = await fetch(`/api/scenes/${scene.id}/shots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Shot', order: scene.shots.length }),
    })
    const { data } = await res.json()
    setScenes(prev =>
      prev.map(s => s.id === scene.id ? { ...s, shots: [...s.shots, data] } : s)
    )
    onSelectShot(data)
  }

  return (
    <aside className="w-64 bg-dark-navy flex flex-col border-r border-slate-gray overflow-y-auto shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-slate-gray">
        <span className="font-heading font-600 text-sm uppercase tracking-widest text-warm-gray">
          Scenes
        </span>
        <button
          onClick={addScene}
          className="text-warm-gray hover:text-white text-lg leading-none"
        >
          +
        </button>
      </div>

      <div className="flex-1">
        {scenes.map(scene => (
          <div key={scene.id}>
            {/* Scene header */}
            <button
              onClick={() => onSelectScene(scene)}
              className={`w-full text-left px-4 py-2 flex items-center justify-between group ${
                selectedScene?.id === scene.id ? 'bg-slate-gray' : 'hover:bg-slate-gray/40'
              }`}
            >
              <span className="font-heading font-500 text-sm truncate">{scene.title}</span>
              <span
                onClick={e => { e.stopPropagation(); addShot(scene) }}
                className="text-warm-gray hover:text-white opacity-0 group-hover:opacity-100 ml-2 text-base leading-none"
              >
                +
              </span>
            </button>

            {/* Shot list under scene */}
            {scene.shots.map(shot => (
              <button
                key={shot.id}
                onClick={() => { onSelectScene(scene); onSelectShot(shot) }}
                className={`w-full text-left pl-8 pr-4 py-1.5 text-sm ${
                  selectedShot?.id === shot.id
                    ? 'bg-teal text-white'
                    : 'text-warm-gray hover:text-white hover:bg-slate-gray/30'
                }`}
              >
                {shot.title}
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
