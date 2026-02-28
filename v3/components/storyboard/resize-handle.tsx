"use client"

import { motion } from "framer-motion"

interface ResizeHandleProps {
  /** "vertical" renders a vertical bar (for horizontal splits); "horizontal" renders a horizontal bar (for timeline split) */
  orientation: "vertical" | "horizontal"
  isDragging: boolean
  isHovered: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onHoverStart: () => void
  onHoverEnd: () => void
  /** Keyboard step handler for arrow key accessibility */
  onStep: (direction: -1 | 1) => void
  /** Accessible label */
  label: string
  /** Current value for aria-valuenow */
  valueNow: number
  /** Min value for aria-valuemin */
  valueMin: number
  /** Max value for aria-valuemax */
  valueMax: number
}

/**
 * Reusable drag handle for resizable panels.
 * Renders either a vertical divider (col-resize) or horizontal divider (row-resize)
 * with animated width/height feedback on hover and drag.
 */
export function ResizeHandle({
  orientation,
  isDragging,
  isHovered,
  onMouseDown,
  onHoverStart,
  onHoverEnd,
  onStep,
  label,
  valueNow,
  valueMin,
  valueMax,
}: ResizeHandleProps) {
  const isVertical = orientation === "vertical"

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const decreaseKey = isVertical ? "ArrowLeft" : "ArrowDown"
    const increaseKey = isVertical ? "ArrowRight" : "ArrowUp"
    if (e.key === decreaseKey) onStep(-1)
    else if (e.key === increaseKey) onStep(1)
  }

  // Track size: the moving dimension of the indicator line
  const trackSize = isDragging ? 3 : isHovered ? 2 : 1
  const trackColor = isDragging ? "#7A7A7A" : isHovered ? "#696969" : "#232323"

  // Grip pill: the small oval shown on hover/drag
  const gripOpacity = isDragging ? 1 : isHovered ? 0.6 : 0
  const gripScale = isDragging ? 1 : 0.92

  return (
    <motion.div
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      aria-label={label}
      aria-valuenow={Math.round(valueNow)}
      aria-valuemin={valueMin}
      aria-valuemax={valueMax}
      tabIndex={0}
      className="relative shrink-0"
      style={
        isVertical
          ? { width: "7px", cursor: "col-resize", zIndex: 10 }
          : { height: "24px", cursor: "row-resize", zIndex: 10 }
      }
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      animate={{ scale: isDragging ? (isVertical ? 1.03 : 1.02) : 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      onKeyDown={handleKeyDown}
    >
      {/* Track line */}
      <motion.div
        className={
          isVertical
            ? "absolute inset-y-0 left-1/2 -translate-x-1/2"
            : "absolute inset-x-3 top-1/2 -translate-y-1/2"
        }
        animate={
          isVertical
            ? { width: trackSize, backgroundColor: trackColor }
            : { height: trackSize, backgroundColor: trackColor }
        }
        transition={{ duration: 0.12, ease: "easeOut" }}
      />

      {/* Grip pill */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          opacity: gripOpacity,
          ...(isVertical ? { scaleY: gripScale } : { scaleX: gripScale }),
        }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      >
        <div
          className="rounded-full"
          style={
            isVertical
              ? { width: "5px", height: "32px", background: "#7A7A7A" }
              : { width: "32px", height: "5px", background: "#7A7A7A" }
          }
        />
      </motion.div>

      {/* Expanded hit area */}
      <div
        className={
          isVertical
            ? "absolute inset-y-0 -left-2 -right-2"
            : "absolute inset-x-0 -top-2 -bottom-2"
        }
      />
    </motion.div>
  )
}
