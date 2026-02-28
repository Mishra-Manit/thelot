"use client"

import { useState, useCallback, type RefObject } from "react"

interface UseResizablePanelOptions {
  /** Initial percentage for the resizable dimension */
  initialPct: number
  /** Minimum allowed percentage */
  minPct: number
  /** Maximum allowed percentage */
  maxPct: number
  /** Container ref used to calculate percentage deltas */
  containerRef: RefObject<HTMLElement | null>
  /** "horizontal" measures clientX deltas; "vertical" measures clientY deltas (inverted: dragging up increases pct) */
  orientation: "horizontal" | "vertical"
}

interface UseResizablePanelReturn {
  pct: number
  setPct: (value: number | ((prev: number) => number)) => void
  isDragging: boolean
  isHovered: boolean
  setIsHovered: (value: boolean) => void
  onMouseDown: (e: React.MouseEvent) => void
}

/**
 * Encapsulates the drag-to-resize pattern used for split panels.
 * Attaches mousemove/mouseup to window during drag and clamps to min/max bounds.
 */
export function useResizablePanel({
  initialPct,
  minPct,
  maxPct,
  containerRef,
  orientation,
}: UseResizablePanelOptions): UseResizablePanelReturn {
  const [pct, setPct] = useState(initialPct)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const startPos = orientation === "horizontal" ? e.clientX : e.clientY
      const containerSize = orientation === "horizontal" ? rect.width : rect.height
      const startPct = pct

      const onMove = (ev: MouseEvent) => {
        const currentPos = orientation === "horizontal" ? ev.clientX : ev.clientY
        const delta = currentPos - startPos
        const deltaPct = (delta / containerSize) * 100
        // Vertical orientation: dragging up (negative delta) should increase pct
        const adjusted = orientation === "vertical" ? -deltaPct : deltaPct
        const next = Math.min(maxPct, Math.max(minPct, startPct + adjusted))
        setPct(next)
      }

      const onUp = () => {
        setIsDragging(false)
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }

      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    },
    [containerRef, maxPct, minPct, orientation, pct]
  )

  return { pct, setPct, isDragging, isHovered, setIsHovered, onMouseDown }
}
