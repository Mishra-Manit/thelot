"use client"

import { motion } from "framer-motion"
import type { WorkflowStep, ShotStatus } from "@/lib/storyboard-types"

interface WorkflowStepperProps {
  currentStep: WorkflowStep
  shotStatus: ShotStatus
  isLoading: boolean
  onStepClick: (step: WorkflowStep) => void
}

const STEPS: Array<{ key: WorkflowStep; label: string }> = [
  { key: "script", label: "Frame" },
  { key: "video", label: "Video" },
  { key: "polish", label: "Polish" },
]

function isStepClickable(step: WorkflowStep, shotStatus: ShotStatus): boolean {
  if (step === "script") return true
  if (step === "video") return shotStatus === "frames_ready" || shotStatus === "video_ready" || shotStatus === "approved"
  if (step === "polish") return shotStatus === "video_ready" || shotStatus === "approved"
  return false
}

function isStepComplete(step: WorkflowStep, shotStatus: ShotStatus): boolean {
  if (step === "script") return shotStatus !== "draft"
  if (step === "video") return shotStatus === "approved"
  return false
}

export function WorkflowStepper({ currentStep, shotStatus, isLoading, onStepClick }: WorkflowStepperProps) {
  return (
    <div className="flex items-center gap-4" style={{ padding: "0 0 12px 0", borderBottom: "1px solid #232323" }}>
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.key
        const isLoadingStep = isLoading && isActive
        const clickable = isStepClickable(step.key, shotStatus)

        const textColor = isActive ? "#ffffff" : "#696969"

        return (
          <div key={step.key} className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => clickable && onStepClick(step.key)}
              disabled={!clickable}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: clickable ? "pointer" : "default",
                color: textColor,
                fontSize: "13px",
                fontWeight: isActive ? 500 : 400,
                letterSpacing: "0.01em",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (clickable && !isActive) e.currentTarget.style.color = "#D9D9D9"
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = textColor
              }}
            >
              {isLoadingStep ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {step.label}
                </motion.span>
              ) : (
                <span>{step.label}</span>
              )}
            </button>

            {index < STEPS.length - 1 && (
              <span style={{ color: "#575757", fontSize: "13px" }}>/</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
