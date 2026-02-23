"use client"

import { useId } from "react"
import { motion } from "framer-motion"
import type { ShotStatus } from "@/lib/storyboard-types"

interface ShotStatusDotProps {
  status: ShotStatus
  isLoading?: boolean
  size?: "sm" | "md"
}

export function ShotStatusDot({ status, isLoading = false, size = "md" }: ShotStatusDotProps) {
  const uid = useId()
  const clipId = `lh-${uid.replace(/:/g, "")}`
  const px = size === "sm" ? 10 : 14

  if (isLoading) {
    return (
      <motion.svg
        width={px}
        height={px}
        viewBox="0 0 14 14"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        aria-label="Loading"
      >
        <circle cx="7" cy="7" r="6" fill="#D9D9D9" />
      </motion.svg>
    )
  }

  if (status === "draft") {
    return (
      <svg width={px} height={px} viewBox="0 0 14 14" aria-label="Draft">
        <circle cx="7" cy="7" r="6" fill="none" stroke="#696969" strokeWidth="1.5" />
      </svg>
    )
  }

  if (status === "frames_ready") {
    return (
      <svg width={px} height={px} viewBox="0 0 14 14" aria-label="Frames ready">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="7" height="14" />
          </clipPath>
        </defs>
        <circle cx="7" cy="7" r="6" fill="none" stroke="#D9D9D9" strokeWidth="1.5" />
        <circle cx="7" cy="7" r="6" fill="#D9D9D9" clipPath={`url(#${clipId})`} />
      </svg>
    )
  }

  if (status === "video_ready") {
    return (
      <svg width={px} height={px} viewBox="0 0 14 14" aria-label="Video ready">
        <circle cx="7" cy="7" r="6" fill="#696969" />
      </svg>
    )
  }

  // approved
  return (
    <svg width={px} height={px} viewBox="0 0 14 14" aria-label="Approved">
      <circle cx="7" cy="7" r="6" fill="#F0F0F0" />
      <path
        d="M4.5 7 L6.5 9 L9.5 5.5"
        stroke="#000000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
