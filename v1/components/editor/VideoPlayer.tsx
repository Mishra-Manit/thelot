'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useComposition } from './CompositionProvider'

/**
 * Mounts the Composition canvas into a container div and
 * scales it to fit while preserving the 16:9 aspect ratio.
 */
export default function VideoPlayer() {
    const { composition } = useComposition()
    const containerRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<HTMLDivElement>(null)

    // Calculate and apply the scale transform so the
    // 1920×1080 canvas fits inside the container
    const rescale = useCallback(() => {
        const container = containerRef.current
        const player = playerRef.current
        if (!container || !player || !composition) return

        const scale = Math.min(
            container.clientWidth / composition.width,
            container.clientHeight / composition.height,
        )

        player.style.width = `${composition.width}px`
        player.style.height = `${composition.height}px`
        player.style.transform = `scale(${scale})`
        player.style.transformOrigin = 'center'
    }, [composition])

    // Mount the canvas and observe container resizes
    useEffect(() => {
        const player = playerRef.current
        if (!player || !composition) return

        composition.mount(player)
        rescale()

        const observer = new ResizeObserver(rescale)
        if (containerRef.current) observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
            composition.unmount()
        }
    }, [composition, rescale])

    return (
        <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center overflow-hidden"
        >
            <div ref={playerRef} />
        </div>
    )
}
