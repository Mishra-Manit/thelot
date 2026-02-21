'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import SceneList from '@/components/SceneList'
import ShotDetail from '@/components/ShotDetail'
import Timeline from '@/components/Timeline'
import type { Scene, Shot } from '@/db/schema'

// Dynamic import — FramePreview uses @diffusionstudio/core which requires browser APIs
const FramePreview = dynamic(() => import('@/components/FramePreview'), { ssr: false })

export default function Page() {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null)

  return (
    <div className="flex h-screen flex-col gap-4 overflow-hidden bg-dark-black p-4">
      {/* Three-panel main area */}
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        <SceneList
          selectedScene={selectedScene}
          selectedShot={selectedShot}
          onSelectScene={setSelectedScene}
          onSelectShot={setSelectedShot}
          onBack={() => setSelectedScene(null)}
        />
        <ShotDetail
          shot={selectedShot}
          onUpdate={setSelectedShot}
        />
        <FramePreview shot={selectedShot} />
      </div>

      {/* Bottom timeline strip */}
      <Timeline
        scene={selectedScene}
        selectedShot={selectedShot}
        onSelectShot={setSelectedShot}
      />
    </div>
  )
}
