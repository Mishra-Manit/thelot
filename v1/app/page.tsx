'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, Users, Clapperboard, Film,
  Coins, Download, FileText, Settings, Share2,
} from 'lucide-react'
import SceneList from '@/components/SceneList'
import ShotDetail from '@/components/ShotDetail'
import Timeline from '@/components/Timeline'
import type { Scene, Shot } from '@/db/schema'

const FramePreview = dynamic(() => import('@/components/FramePreview'), { ssr: false })

export default function Page() {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null)

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ backgroundColor: '#0D0E14', fontFamily: 'Inter, sans-serif' }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <header
        className="flex items-center flex-shrink-0"
        style={{ height: 48, borderBottom: '1px solid #252933', backgroundColor: '#0D0E14' }}
      >
        {/* Left: back + title */}
        <div className="flex items-center gap-3 pl-4 pr-6 flex-shrink-0">
          <button
            className="flex items-center justify-center cursor-pointer transition-colors"
            style={{ color: '#777076' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#777076' }}
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: 14, color: '#ffffff', fontWeight: 500, whiteSpace: 'nowrap' }}>
            The Lot
          </span>
        </div>

        {/* Center: pipeline steps */}
        <div className="flex-1 flex items-center justify-center gap-0">
          <button
            className="flex items-center gap-2 px-4 cursor-pointer transition-colors"
            style={{ color: '#60515C', fontSize: 13, height: 48 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#777076' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#60515C' }}
          >
            <Users size={14} />
            <span style={{ whiteSpace: 'nowrap' }}>Cast, Locations, Props</span>
          </button>

          <div className="flex-shrink-0" style={{ width: 24, height: 1, backgroundColor: '#404556' }} />

          <div
            className="flex items-center gap-2 px-5 rounded-full flex-shrink-0"
            style={{ backgroundColor: '#597D7C', height: 30, fontSize: 13, color: '#0D0E14', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            <Clapperboard size={14} />
            <span>Review Scene &amp; Shot Information</span>
          </div>

          <div className="flex-shrink-0" style={{ width: 24, height: 1, backgroundColor: '#404556' }} />

          <button
            className="flex items-center gap-2 px-4 cursor-pointer transition-colors"
            style={{ color: '#60515C', fontSize: 13, height: 48 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#777076' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#60515C' }}
          >
            <Film size={14} />
            <span style={{ whiteSpace: 'nowrap' }}>Generate and Edit Film</span>
          </button>
        </div>

        {/* Right: utility buttons */}
        <div className="flex items-center gap-1 pr-4 flex-shrink-0">
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
            style={{ color: '#597D7C', fontSize: 12 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#252933' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <Coins size={14} />
            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>0</span>
          </button>

          {[<Download key="dl" size={16} />, <FileText key="ft" size={16} />, <Settings key="st" size={16} />].map((icon, i) => (
            <button
              key={i}
              className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors"
              style={{ color: '#777076' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#252933'; e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#777076' }}
            >
              {icon}
            </button>
          ))}

          <button
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cursor-pointer transition-colors ml-1"
            style={{ backgroundColor: '#252933', border: '1px solid #404556', color: '#777076', fontSize: 12, fontWeight: 500 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#404556'; e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#252933'; e.currentTarget.style.color = '#777076' }}
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="flex-shrink-0" style={{ borderRight: '1px solid #252933' }}>
          <SceneList
            selectedScene={selectedScene}
            selectedShot={selectedShot}
            onSelectScene={setSelectedScene}
            onSelectShot={setSelectedShot}
            onBack={() => { setSelectedScene(null); setSelectedShot(null) }}
          />
        </div>

        {/* Center + right, stacked with timeline below */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Editor + preview row */}
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 min-w-0 min-h-0 overflow-hidden" style={{ borderRight: '1px solid #252933' }}>
              <ShotDetail shot={selectedShot} scene={selectedScene} onUpdate={setSelectedShot} />
            </div>
            <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
              <FramePreview shot={selectedShot} scene={selectedScene} />
            </div>
          </div>

          {/* Timeline */}
          <Timeline
            scene={selectedScene}
            selectedShot={selectedShot}
            onSelectShot={setSelectedShot}
          />
        </div>
      </div>
    </div>
  )
}
