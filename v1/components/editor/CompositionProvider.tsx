'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type * as core from '@diffusionstudio/core'

type CompositionContextValue = {
    composition: core.Composition | null
    isPlaying: boolean
    currentTime: number
    duration: number
    loading: boolean
    play: () => Promise<void>
    pause: () => Promise<void>
    seek: (time: number) => Promise<void>
}

const CompositionContext = createContext<CompositionContextValue | null>(null)

export function useComposition() {
    const ctx = useContext(CompositionContext)
    if (!ctx) throw new Error('useComposition must be used within <CompositionProvider>')
    return ctx
}

type Props = {
    videoUrl?: string | null
    children: ReactNode
}

export default function CompositionProvider({ videoUrl, children }: Props) {
    const compositionRef = useRef<core.Composition | null>(null)
    const coreRef = useRef<typeof core | null>(null)
    const [composition, setComposition] = useState<core.Composition | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [loading, setLoading] = useState(false)

    // Create the Composition once on mount
    useEffect(() => {
        let cancelled = false

        async function init() {
            const coreModule = await import('@diffusionstudio/core')
            if (cancelled) return

            coreRef.current = coreModule

            const comp = new coreModule.Composition({
                width: 1920,
                height: 1080,
                background: '#0D0E14',
            })

            compositionRef.current = comp
            setComposition(comp)
        }

        init()

        return () => {
            cancelled = true
            compositionRef.current?.unmount()
        }
    }, [])

    // Load a video clip when videoUrl changes
    useEffect(() => {
        const comp = compositionRef.current
        const coreModule = coreRef.current
        if (!comp || !coreModule || !videoUrl) return

        let cancelled = false

        async function loadVideo() {
            setLoading(true)

            try {
                // Remove all existing layers before loading a new video
                for (const layer of [...comp!.layers]) {
                    await comp!.remove(layer)
                }

                const source = await coreModule!.Source.from<core.VideoSource>(videoUrl!)
                if (cancelled) return

                const layer = await comp!.add(new coreModule!.Layer())
                await layer.add(new coreModule!.VideoClip(source, {
                    position: 'center',
                    width: '100%',
                    keepAspectRatio: true,
                }))

                setDuration(comp!.duration)
                setCurrentTime(0)
            } catch (err) {
                console.error('Failed to load video:', err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        loadVideo()

        return () => { cancelled = true }
    }, [videoUrl])

    // Poll current time while playing
    useEffect(() => {
        if (!isPlaying || !composition) return

        const id = setInterval(() => {
            setCurrentTime(composition.currentTime)
            setDuration(composition.duration)
        }, 100)

        return () => clearInterval(id)
    }, [isPlaying, composition])

    const play = useCallback(async () => {
        if (!composition) return
        await composition.play()
        setIsPlaying(true)
    }, [composition])

    const pause = useCallback(async () => {
        if (!composition) return
        await composition.pause()
        setIsPlaying(false)
    }, [composition])

    const seek = useCallback(async (time: number) => {
        if (!composition) return
        await composition.seek(time)
        setCurrentTime(time)
    }, [composition])

    return (
        <CompositionContext.Provider value={{ composition, isPlaying, currentTime, duration, loading, play, pause, seek }}>
            {children}
        </CompositionContext.Provider>
    )
}
