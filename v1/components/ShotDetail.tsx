'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Clock, GripVertical, Clapperboard, Brain, Camera,
  Sparkles, Image, Play as PlayIcon, Film,
} from 'lucide-react'
import type { Scene, Shot } from '@/db/schema'

type Props = {
  shot: Shot | null
  scene: Scene | null
  onUpdate: (shot: Shot) => void
}

type SaveableField = 'title' | 'duration' | 'action' | 'internalMonologue' | 'cameraNotes'

const AVAILABLE_VIDEOS = [
  { label: 'Battle Scene',          value: '/videos/battle_scene.mp4' },
  { label: 'Dunes Cinematic',       value: '/videos/dunes_cinematic.mp4' },
  { label: 'Flying Ornithopter',    value: '/videos/flying_ornithopter.mp4' },
  { label: 'Paul Atreides Closeup', value: '/videos/paul_atreides_closeup.mp4' },
  { label: 'Sandworm Erupting',     value: '/videos/sandworm_erupting.mp4' },
]

// ─── EditorBlock ─────────────────────────────────────────────────────────────
// Notion-style hoverable block with drag handle and left accent bar.

function EditorBlock({ children, accentColor }: { children: React.ReactNode; accentColor?: string }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative flex"
      style={{ marginLeft: -28 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <div
        className="flex-shrink-0 flex items-start justify-center pt-1"
        style={{ width: 28, opacity: hovered ? 0.45 : 0, transition: 'opacity 150ms', color: '#404556', cursor: 'grab' }}
      >
        <GripVertical size={14} />
      </div>

      {/* Content with left accent */}
      <div
        className="flex-1 min-w-0 rounded-md"
        style={{
          borderLeft: `2px solid ${hovered ? (accentColor ?? '#404556') : 'transparent'}`,
          paddingLeft: 12,
          paddingTop: 2,
          paddingBottom: 2,
          backgroundColor: hovered ? '#ffffff04' : 'transparent',
          transition: 'border-color 150ms, background-color 150ms',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── BlockLabel ──────────────────────────────────────────────────────────────

function BlockLabel({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span style={{ color, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 10, color, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        {label}
      </span>
    </div>
  )
}

// ─── ProseTextarea ───────────────────────────────────────────────────────────
// Transparent textarea that looks like document prose.

function ProseTextarea({
  value, onChange, onBlur, placeholder,
  monospace = false, italic = false, color,
}: {
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  placeholder: string
  monospace?: boolean
  italic?: boolean
  color?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Auto-resize height
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={1}
      style={{
        display: 'block',
        fontSize: monospace ? 13 : 15,
        lineHeight: monospace ? '1.7' : '1.85',
        color: color ?? (monospace ? '#777076' : '#d4d4d4'),
        fontFamily: monospace
          ? "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
          : 'Inter, sans-serif',
        fontStyle: italic ? 'italic' : 'normal',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        resize: 'none',
        width: '100%',
        padding: 0,
        margin: 0,
        overflow: 'hidden',
      }}
    />
  )
}

// ─── PromptBlock ─────────────────────────────────────────────────────────────

function PromptBlock({ label, icon, value, accentColor }: {
  label: string; icon: React.ReactNode; value: string; accentColor: string
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ marginBottom: 6 }}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ paddingLeft: 2 }}>
        <span style={{ color: accentColor, display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 10, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div
        className="rounded-lg transition-all"
        style={{
          backgroundColor: focused ? '#17292B' : '#0D0E14',
          border: `1px solid ${focused ? accentColor + '55' : '#17292B'}`,
          padding: '10px 14px',
          minHeight: 56,
          cursor: 'text',
          transition: 'border-color 200ms, background-color 200ms',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        tabIndex={0}
      >
        <p style={{ fontSize: 13, lineHeight: '1.7', color: value ? '#777076' : '#404556', fontFamily: 'Inter, sans-serif', fontStyle: value ? 'normal' : 'italic', margin: 0 }}>
          {value || `Describe the ${label.toLowerCase()}...`}
        </p>
      </div>
    </div>
  )
}

// ─── ShotDetail ──────────────────────────────────────────────────────────────

export default function ShotDetail({ shot, scene, onUpdate }: Props) {
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
      <main
        className="flex flex-1 flex-col items-center justify-center h-full gap-3"
        style={{ backgroundColor: '#0D0E14' }}
      >
        <Film size={32} style={{ color: '#404556' }} />
        <span style={{ fontSize: 13, color: '#404556' }}>Select a scene to begin editing</span>
      </main>
    )
  }

  const sceneNumber = (scene?.order ?? 0) + 1

  // Derive AI prompt strings from current content
  const startFramePrompt = `${draft.action?.split('.')[0] ?? 'Opening frame'}. Cinematic lighting, film grain.`
  const videoPrompt = draft.action && draft.cameraNotes
    ? `${draft.action} Camera: ${draft.cameraNotes.split('.')[0]}.`
    : draft.action ?? ''

  return (
    <main
      className="flex flex-1 flex-col h-full overflow-y-auto"
      style={{ backgroundColor: '#0D0E14', fontFamily: 'Inter, sans-serif', scrollbarWidth: 'thin', scrollbarColor: '#404556 transparent' }}
    >
      <div style={{ paddingLeft: 60, paddingRight: 32, paddingTop: 24, paddingBottom: 32, maxWidth: 720 }}>

        {/* Scene + duration metadata row */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="px-2 py-0.5 rounded"
            style={{ backgroundColor: '#597D7C18', border: '1px solid #597D7C33', fontSize: 10, color: '#597D7C', fontWeight: 600, letterSpacing: '0.05em' }}
          >
            SCENE {sceneNumber}
          </div>
          <span style={{ color: '#404556' }}>·</span>
          <div className="flex items-center gap-1">
            <Clock size={11} style={{ color: '#60515C' }} />
            <span style={{ fontSize: 11, color: '#60515C', fontVariantNumeric: 'tabular-nums' }}>
              {draft.duration ?? 0}s
            </span>
          </div>
        </div>

        {/* Shot title — large editable heading */}
        <input
          value={draft.title}
          onChange={e => setDraft(d => d ? { ...d, title: e.target.value } : d)}
          onBlur={() => save('title')}
          className="mb-1 w-full"
          style={{
            display: 'block',
            fontSize: 26,
            color: '#eeeeee',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
          }}
        />

        {/* Duration editor */}
        <div className="flex items-center gap-2 mb-6">
          <span style={{ fontSize: 11, color: '#404556' }}>Duration:</span>
          <input
            type="number"
            min={0}
            step={1}
            value={draft.duration ?? ''}
            onChange={e => setDraft(d => d ? { ...d, duration: e.target.value === '' ? null : Number(e.target.value) } : d)}
            onBlur={() => save('duration')}
            style={{
              fontSize: 11,
              color: '#777076',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              width: 36,
              padding: 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <span style={{ fontSize: 11, color: '#404556' }}>s</span>
        </div>

        {/* ── Document blocks ─────────────────────────────────── */}

        {/* Action */}
        <div className="mb-5">
          <EditorBlock accentColor="#597D7C">
            <BlockLabel icon={<Clapperboard size={12} />} label="Action" color="#597D7C" />
            <ProseTextarea
              value={draft.action ?? ''}
              onChange={v => setDraft(d => d ? { ...d, action: v } : d)}
              onBlur={() => save('action')}
              placeholder="Describe the action for this shot..."
            />
          </EditorBlock>
        </div>

        {/* Internal Monologue */}
        <div className="mb-5">
          <EditorBlock accentColor="#60515C">
            <BlockLabel icon={<Brain size={12} />} label="Internal Monologue" color="#60515C" />
            <div className="rounded-md" style={{ backgroundColor: '#60515C08', borderLeft: '3px solid #60515C44', padding: '10px 16px' }}>
              <ProseTextarea
                value={draft.internalMonologue ?? ''}
                onChange={v => setDraft(d => d ? { ...d, internalMonologue: v } : d)}
                onBlur={() => save('internalMonologue')}
                placeholder="Character's inner thoughts..."
                italic
                color="#cccccc"
              />
            </div>
          </EditorBlock>
        </div>

        {/* Camera Notes */}
        <div className="mb-5">
          <EditorBlock accentColor="#404556">
            <BlockLabel icon={<Camera size={12} />} label="Camera Notes" color="#777076" />
            <div className="rounded-md" style={{ backgroundColor: '#17292B', border: '1px solid #252933', padding: '10px 14px' }}>
              <ProseTextarea
                value={draft.cameraNotes ?? ''}
                onChange={v => setDraft(d => d ? { ...d, cameraNotes: v } : d)}
                onBlur={() => save('cameraNotes')}
                placeholder="Lens choice, movement, framing..."
                monospace
              />
            </div>
          </EditorBlock>
        </div>

        {/* Video Clip selector */}
        <div className="mb-7">
          <EditorBlock accentColor="#386775">
            <BlockLabel icon={<PlayIcon size={12} />} label="Video Clip" color="#386775" />
            <select
              value={draft.videoUrl ?? ''}
              onChange={e => {
                const videoUrl = e.target.value || null
                setDraft(d => d ? { ...d, videoUrl } : d)
                saveVideoUrl(videoUrl)
              }}
              style={{
                fontSize: 13,
                color: '#777076',
                backgroundColor: '#17292B',
                border: '1px solid #252933',
                borderRadius: 6,
                padding: '6px 10px',
                outline: 'none',
                cursor: 'pointer',
                width: '100%',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <option value="">— none —</option>
              {AVAILABLE_VIDEOS.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </EditorBlock>
        </div>

        {/* ── AI Generation Prompts ─────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} style={{ color: '#597D7C' }} />
            <span style={{ fontSize: 12, color: '#597D7C', fontWeight: 600, letterSpacing: '-0.01em' }}>
              AI Generation Prompts
            </span>
            <div className="flex-1" style={{ height: 1, backgroundColor: '#252933', marginLeft: 6 }} />
          </div>

          <div className="flex flex-col gap-4">
            <PromptBlock
              label="Start Frame"
              icon={<Image size={12} />}
              value={startFramePrompt}
              accentColor="#597D7C"
            />
            <PromptBlock
              label="Video"
              icon={<PlayIcon size={12} />}
              value={videoPrompt}
              accentColor="#386775"
            />
          </div>
        </div>

        {/* Regenerate button */}
        <button
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg transition-all cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #597D7C22, #597D7C11)', border: '1px solid #597D7C44', color: '#597D7C', fontSize: 13, fontWeight: 500 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #597D7C33, #597D7C22)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #597D7C22, #597D7C11)' }}
        >
          <Sparkles size={16} />
          Regenerate Shot with AI
        </button>

      </div>
    </main>
  )
}
