'use client'

import { useEffect, useState } from 'react'
import type { Shot } from '@/db/schema'

type Props = {
  shot: Shot | null
  onUpdate: (shot: Shot) => void
}

type Field = 'title' | 'action' | 'internalMonologue' | 'cameraNotes'

export default function ShotDetail({ shot, onUpdate }: Props) {
  const [draft, setDraft] = useState<Partial<Shot>>({})

  useEffect(() => {
    setDraft(shot ?? {})
  }, [shot])

  async function save(field: Field) {
    if (!shot) return
    const res = await fetch(`/api/shots/${shot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: draft[field] }),
    })
    const { data } = await res.json()
    onUpdate(data)
  }

  if (!shot) {
    return (
      <main className="flex-1 bg-dark-black flex items-center justify-center text-warm-gray font-body text-sm">
        Select a shot to edit
      </main>
    )
  }

  return (
    <main className="flex-1 bg-dark-black overflow-y-auto p-6 flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-heading font-500 uppercase tracking-widest text-warm-gray">
          Shot Title
        </label>
        <input
          className="bg-dark-navy border border-slate-gray rounded px-3 py-2 text-sm font-body text-white focus:outline-none focus:border-teal"
          value={draft.title ?? ''}
          onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
          onBlur={() => save('title')}
        />
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-heading font-500 uppercase tracking-widest text-warm-gray">
          Duration (s)
        </label>
        <input
          type="number"
          className="bg-dark-navy border border-slate-gray rounded px-3 py-2 text-sm font-body text-white focus:outline-none focus:border-teal w-24"
          value={draft.duration ?? ''}
          onChange={e => setDraft(d => ({ ...d, duration: Number(e.target.value) }))}
          onBlur={async () => {
            if (!shot) return
            const res = await fetch(`/api/shots/${shot.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ duration: draft.duration }),
            })
            const { data } = await res.json()
            onUpdate(data)
          }}
        />
      </div>

      {/* Action */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-heading font-500 uppercase tracking-widest text-warm-gray">
          Action
        </label>
        <textarea
          rows={4}
          className="bg-dark-navy border border-slate-gray rounded px-3 py-2 text-sm font-body text-white focus:outline-none focus:border-teal resize-none"
          value={draft.action ?? ''}
          onChange={e => setDraft(d => ({ ...d, action: e.target.value }))}
          onBlur={() => save('action')}
        />
      </div>

      {/* Internal Monologue */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-heading font-500 uppercase tracking-widest text-warm-gray">
          Internal Monologue
        </label>
        <textarea
          rows={4}
          className="bg-dark-navy border border-slate-gray rounded px-3 py-2 text-sm font-body text-white focus:outline-none focus:border-teal resize-none"
          value={draft.internalMonologue ?? ''}
          onChange={e => setDraft(d => ({ ...d, internalMonologue: e.target.value }))}
          onBlur={() => save('internalMonologue')}
        />
      </div>

      {/* Camera Notes */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-heading font-500 uppercase tracking-widest text-warm-gray">
          Camera Notes
        </label>
        <textarea
          rows={3}
          className="bg-dark-navy border border-slate-gray rounded px-3 py-2 text-sm font-body text-white focus:outline-none focus:border-teal resize-none"
          value={draft.cameraNotes ?? ''}
          onChange={e => setDraft(d => ({ ...d, cameraNotes: e.target.value }))}
          onBlur={() => save('cameraNotes')}
        />
      </div>
    </main>
  )
}
