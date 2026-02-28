"use client"

import { useRef, useEffect, useCallback } from "react"

interface AutoTextareaProps {
  value: string
  onChange: (v: string) => void
  style?: React.CSSProperties
  className?: string
  rows?: number
  placeholder?: string
}

export function AutoTextarea({ value, onChange, style, className, rows = 1, placeholder }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (el) {
      el.style.height = "0"
      el.style.height = el.scrollHeight + "px"
    }
  }, [])

  useEffect(() => { resize() }, [value, resize])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      rows={rows}
      placeholder={placeholder}
      className={className}
      style={{
        resize: "none",
        overflow: "hidden",
        border: "none",
        background: "transparent",
        outline: "none",
        width: "100%",
        padding: 0,
        margin: 0,
        ...style,
      }}
    />
  )
}
