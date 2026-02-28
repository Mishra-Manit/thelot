"use client"

import { ShotStatusDot } from "./shot-status-dot"

interface LegendItemProps {
  status: "draft" | "frames_ready" | "video_ready"
  label: string
  size: "sm" | "md"
}

export function LegendItem({ status, label, size }: LegendItemProps) {
  return (
    <div className={`flex items-center justify-center text-center ${size === "sm" ? "gap-1.5 whitespace-nowrap" : "gap-2"}`}>
      <ShotStatusDot status={status} size={size} />
      <span style={{ fontSize: size === "sm" ? "10px" : "12px", color: "#D9D9D9", fontWeight: 500 }}>{label}</span>
    </div>
  )
}
