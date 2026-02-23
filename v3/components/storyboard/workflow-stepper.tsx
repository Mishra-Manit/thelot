"use client"

import { motion } from "framer-motion"
import type { WorkflowStep, ShotStatus } from "@/lib/storyboard-types"

interface WorkflowStepperProps {
  currentStep: WorkflowStep
  shotStatus: ShotStatus
  isLoading: boolean
  onStepClick: (step: WorkflowStep) => void
}

const STEPS: Array<{ key: WorkflowStep; label: string; number: string }> = [
  { key: "script", label: "Script", number: "①" },
  { key: "frames", label: "Frame", number: "②" },
  { key: "video", label: "Video", number: "③" },
  { key: "polish", label: "Polish", number: "④" },
]

function isStepClickable(step: WorkflowStep, shotStatus: ShotStatus): boolean {
  if (step === "script") return true
  if (step === "frames") return true
  if (step === "video") return shotStatus === "frames_ready" || shotStatus === "video_ready" || shotStatus === "approved"
  if (step === "polish") return shotStatus === "video_ready" || shotStatus === "approved"
  return false
}

function isStepComplete(step: WorkflowStep, shotStatus: ShotStatus): boolean {
  if (step === "script") return shotStatus !== "draft"
  if (step === "frames") return shotStatus === "video_ready" || shotStatus === "approved"
  if (step === "video") return shotStatus === "approved"
  return false
}

export function WorkflowStepper({ currentStep, shotStatus, isLoading, onStepClick }: WorkflowStepperProps) {
  return (
    <div className="flex items-center gap-6" style={{ padding: "0 0 12px 0", borderBottom: "1px solid #232323" }}>
      {STEPS.map((step) => {
        const isActive = currentStep === step.key
        const isComplete = isStepComplete(step.key, shotStatus)
        const isLoadingStep = isLoading && isActive
        const clickable = isStepClickable(step.key, shotStatus)

        const textColor = isActive ? "#ffffff" : isComplete ? "#696969" : "#575757"

        return (
          <div key={step.key} className="relative flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => clickable && onStepClick(step.key)}
              disabled={!clickable}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: clickable ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                color: textColor,
                fontSize: "13px",
                fontWeight: isActive ? 500 : 400,
                letterSpacing: "0.01em",
              }}
            >
              <span>{step.number}</span>
              <span>{step.label}</span>
              {isComplete && !isActive && (
                <span style={{ color: "#696969", fontSize: "10px" }}>✓</span>
              )}
            </button>

            {/* Active underline with shared layout animation */}
            <div style={{ height: "2px", width: "100%", position: "relative" }}>
              {isActive && (
                <motion.div
                  layoutId="stepper-underline"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "1px",
                  }}
                  animate={
                    isLoadingStep
                      ? { opacity: [0.3, 1, 0.3], background: "#D9D9D9" }
                      : { opacity: 1, background: "#D9D9D9" }
                  }
                  transition={
                    isLoadingStep
                      ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.2, ease: "easeOut" }
                  }
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
