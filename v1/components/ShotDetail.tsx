'use client'

import { useEffect, useRef, useState } from 'react'
import type { Shot } from '@/db/schema'

type Props = {
  shot: Shot | null
  onUpdate: (shot: Shot) => void
}

// All fields that share the same save logic
type SaveableField = 'title' | 'duration' | 'action' | 'internalMonologue' | 'cameraNotes'

const AVAILABLE_VIDEOS = [
  { label: 'Battle Scene',          value: '/videos/battle_scene.mp4' },
  { label: 'Dunes Cinematic',       value: '/videos/dunes_cinematic.mp4' },
  { label: 'Flying Ornithopter',    value: '/videos/flying_ornithopter.mp4' },
  { label: 'Paul Atreides Closeup', value: '/videos/paul_atreides_closeup.mp4' },
  { label: 'Sandworm Erupting',     value: '/videos/sandworm_erupting.mp4' },
]

const fieldCls = "rounded-md border border-transparent bg-dark-navy px-4 py-3 text-sm font-body text-white transition-colors focus:outline-none focus:ring-1 focus:ring-forest-green"
const labelCls = "text-[10px] font-heading font-600 uppercase tracking-widest text-muted-mauve"

export default function ShotDetail({ shot, onUpdate }: Props) {
  const [draft, setDraft] = useState<Shot | null>(null)
  const savingRef = useRef(false)

  useEffect(() => { setDraft(shot) }, [shot])

  async function save(key: SaveableField) {
    if (!shot || !draft || savingRef.current) return
    savingRef.current = true
    try {
      const res = await fetch(`/api/shots/${shot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: draft[key] }),
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      const { data } = await res.json()
      onUpdate(data)
    } finally {
      savingRef.current = false
    }
  }

  async function saveVideoUrl(videoUrl: string | null) {
    if (!shot || savingRef.current) return
    savingRef.current = true
    try {
      const res = await fetch(`/api/shots/${shot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      const { data } = await res.json()
      onUpdate(data)
    } finally {
      savingRef.current = false
    }
  }

  if (!shot || !draft) {
    return (
      <main className="flex flex-1 items-center justify-center rounded-xl border border-transparent bg-dark-black/80 text-[10px] font-body tracking-widest text-slate-gray uppercase">
        Select a shot to edit
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-6 overflow-y-auto rounded-xl border border-transparent bg-dark-black/80 px-8 py-6">
      {/* Title + Duration */}
      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className={labelCls}>Shot Title</label>
          <input
            className={fieldCls}
            value={draft.title}
            onChange={e => setDraft(d => d ? { ...d, title: e.target.value } : d)}
            onBlur={() => save('title')}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Duration (s)</label>
          <input
            type="number"
            min={0}
            step={1}
            className={`${fieldCls} w-24`}
            value={draft.duration ?? ''}
            onChange={e => setDraft(d => d ? { ...d, duration: e.target.value === '' ? null : Number(e.target.value) } : d)}
            onBlur={() => save('duration')}
          />
        </div>
      </div>

      {/* Video */}
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Video Clip</label>
        <select
          className={fieldCls}
          value={draft.videoUrl ?? ''}
          onChange={e => {
            const videoUrl = e.target.value || null
            setDraft(d => d ? { ...d, videoUrl } : d)
            saveVideoUrl(videoUrl)
          }}
        >
          <option value="">— none —</option>
          {AVAILABLE_VIDEOS.map(v => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="border-t border-transparent" />

      {/* Action */}
      <div className="flex flex-col gap-2">
        <label className={labelCls}>Action</label>
        <textarea
          rows={3}
          className={`${fieldCls} resize-none`}
          value={draft.action ?? ''}
          onChange={e => setDraft(d => d ? { ...d, action: e.target.value } : d)}
          onBlur={() => save('action')}
        />
      </div>

      {/* Internal Monologue */}
      <div className="flex flex-col gap-2">
        <label className={labelCls}>Internal Monologue</label>
        <textarea
          rows={3}
          className={`${fieldCls} resize-none`}
          value={draft.internalMonologue ?? ''}
          onChange={e => setDraft(d => d ? { ...d, internalMonologue: e.target.value } : d)}
          onBlur={() => save('internalMonologue')}
        />
      </div>

      {/* Camera Notes */}
      <div className="flex flex-col gap-2">
        <label className={labelCls}>Camera Notes</label>
        <textarea
          rows={3}
          className={`${fieldCls} resize-none`}
          value={draft.cameraNotes ?? ''}
          onChange={e => setDraft(d => d ? { ...d, cameraNotes: e.target.value } : d)}
          onBlur={() => save('cameraNotes')}
        />
      </div>
    </main>
  )
}
