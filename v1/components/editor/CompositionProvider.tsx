'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type * as core from '@diffusionstudio/core'

type CompositionContextValue = {
    composition: core.Composition | null
    isPlaying: boolean
    currentTime: number
    duration: number
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

type Props = { children: ReactNode }

export default function CompositionProvider({ children }: Props) {
    const compositionRef = useRef<core.Composition | null>(null)
    const [composition, setComposition] = useState<core.Composition | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    // Create the Composition once on mount
    useEffect(() => {
        let cancelled = false

        async function init() {
            const coreModule = await import('@diffusionstudio/core')
            if (cancelled) return

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
            // Unmount canvas if attached
            compositionRef.current?.unmount()
        }
    }, [])

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
        <CompositionContext.Provider value={{ composition, isPlaying, currentTime, duration, play, pause, seek }}>
            {children}
        </CompositionContext.Provider>
    )
}
