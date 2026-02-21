'use client'

import { useState } from 'react'
import SceneList from '@/components/SceneList'
import ShotDetail from '@/components/ShotDetail'
import FramePreview from '@/components/FramePreview'
import Timeline from '@/components/Timeline'
import type { Scene, Shot } from '@/db/schema'

export default function Page() {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Three-panel main area */}
      <div className="flex flex-1 overflow-hidden">
        <SceneList
          selectedScene={selectedScene}
          selectedShot={selectedShot}
          onSelectScene={setSelectedScene}
          onSelectShot={setSelectedShot}
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
