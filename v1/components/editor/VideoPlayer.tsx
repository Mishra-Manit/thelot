'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useComposition } from './CompositionProvider'

/**
 * Fills its positioned parent and scales the Composition canvas to fit
 * while preserving the 16:9 aspect ratio.
 */
export default function VideoPlayer() {
  const { composition } = useComposition()
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  const rescale = useCallback(() => {
    const container = containerRef.current
    const player = playerRef.current
    if (!container || !player || !composition) return

    const fitScale = Math.min(
      container.clientWidth / composition.width,
      container.clientHeight / composition.height,
    )

    const fittedWidth = Math.floor(composition.width * fitScale)
    const fittedHeight = Math.floor(composition.height * fitScale)

    // Use explicit fitted box size instead of CSS transform.
    // Transform scaling keeps the original layout box and can cause
    // corner-clipping/unused space in flex layouts.
    player.style.width = `${fittedWidth}px`
    player.style.height = `${fittedHeight}px`
    player.style.transform = ''
    player.style.transformOrigin = ''
  }, [composition])

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
    // absolute inset-0 ensures this fills the positioned parent in FramePreview
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <div ref={playerRef} />
    </div>
  )
}
