"use client"

import { motion } from "framer-motion"
import type { WorkflowStep, ShotStatus } from "@/lib/storyboard-types"
import { cn } from "@/lib/utils"

interface WorkflowStepperProps {
  currentStep: WorkflowStep
  shotStatus: ShotStatus
  isLoading: boolean
  onStepClick: (step: WorkflowStep) => void
}

const STEPS: Array<{ key: WorkflowStep; label: string }> = [
  { key: "script", label: "Script" },
  { key: "frames", label: "Frame" },
  { key: "video", label: "Video" },
  { key: "polish", label: "Polish" },
]

function isStepClickable(step: WorkflowStep, shotStatus: ShotStatus): boolean {
  if (step === "script") return true
  if (step === "frames") return true
  if (step === "video") return shotStatus === "frames_ready" || shotStatus === "video_ready" || shotStatus === "approved"
  if (step === "polish") return shotStatus === "video_ready" || shotStatus === "approved"
  return false
}

function isStepComplete(step: WorkflowStep, shotStatus: ShotStatus, currentStepIndex: number, stepIndex: number): boolean {
  // A step is complete if we are past it in the sequence
  if (stepIndex < currentStepIndex) return true
  
  if (step === "script") return shotStatus !== "draft"
  if (step === "frames") return shotStatus === "video_ready" || shotStatus === "approved"
  if (step === "video") return shotStatus === "approved"
  return false
}

export function WorkflowStepper({ currentStep, shotStatus, isLoading, onStepClick }: WorkflowStepperProps) {
  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="w-full py-4 pb-6 border-b border-[#232323]">
      <div className="w-full max-w-sm mx-auto px-4">
        <div className="relative flex items-center justify-between w-full">
          {/* Background Track connecting the first and last dot */}
          <div className="absolute top-[28px] left-[32px] right-[32px] h-[1px] bg-[#232323] -z-10" />
          
          {/* Active Progress Fill */}
          <div 
            className="absolute top-[28px] left-[32px] h-[1px] bg-[#696969] -z-10 transition-all duration-300 ease-in-out" 
            style={{ 
              width: `calc(${(currentStepIndex / (STEPS.length - 1)) * 100}% - ${
                (currentStepIndex / (STEPS.length - 1)) * 64
              }px)`
            }} 
          />

          {STEPS.map((step, index) => {
            const isActive = currentStep === step.key
            const isComplete = isStepComplete(step.key, shotStatus, currentStepIndex, index)
            const isLoadingStep = isLoading && isActive
            const clickable = isStepClickable(step.key, shotStatus)

            const isSolid = isActive || isComplete;

            return (
              <div key={step.key} className="flex flex-col items-center gap-3 relative z-10 w-16">
                {/* Text Label */}
                <button
                  type="button"
                  onClick={() => clickable && onStepClick(step.key)}
                  disabled={!clickable}
                  className={cn(
                    "text-[12px] tracking-wide transition-colors duration-200 bg-black px-1",
                    isActive ? "text-[#ffffff] font-medium" : 
                    isComplete ? "text-[#D9D9D9] font-normal" : 
                    "text-[#575757] font-normal",
                    clickable ? "cursor-pointer hover:text-[#D9D9D9]" : "cursor-default"
                  )}
                >
                  {step.label}
                </button>

                {/* Node Dot */}
                <button
                  type="button"
                  onClick={() => clickable && onStepClick(step.key)}
                  disabled={!clickable}
                  className={cn(
                    "w-[12px] h-[12px] rounded-full flex items-center justify-center transition-all duration-300 bg-black",
                    "ring-[4px] ring-black", // Thick ring to cut out the background line
                    isSolid ? "border-none" : "border-[1px] border-[#575757]",
                    clickable ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  {isSolid && (
                    <motion.div
                      className={cn(
                        "rounded-full",
                        isActive ? "w-[6px] h-[6px] bg-[#ffffff]" : "w-[6px] h-[6px] bg-[#D9D9D9]"
                      )}
                      animate={
                        isLoadingStep
                          ? { opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }
                          : { opacity: 1, scale: 1 }
                      }
                      transition={
                        isLoadingStep
                          ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                          : { duration: 0.2 }
                      }
                    />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
