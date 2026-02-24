"use client"

import { AnimatePresence, motion } from "framer-motion"
import { WorkflowStepper } from "./workflow-stepper"
import { StepScript } from "./step-script"
import { StepVideo } from "./step-video"
import { StepPolish } from "./step-polish"
import type { FramePreviewHandle } from "./frame-preview"
import { deriveShotStatus } from "@/lib/storyboard-utils"
import type { StoryboardShot, StoryboardShotUpdateInput, ShotSimulationState, WorkflowStep } from "@/lib/storyboard-types"

interface ProductionPanelProps {
  shot: StoryboardShot
  simulation: ShotSimulationState
  currentStep: WorkflowStep
  startFrameImageUrl: string
  widthPct?: number
  videoPlayerRef: React.RefObject<FramePreviewHandle | null>
  onTimeUpdate: (time: number, duration: number) => void
  onPlayStateChange: (playing: boolean) => void
  onStepChange: (step: WorkflowStep) => void
  onUpdate: (field: keyof StoryboardShotUpdateInput, value: string | number) => void
  onGenerateFrames: (originStep?: WorkflowStep) => void
  onGenerateVideo: (originStep?: WorkflowStep) => void
  onApproveShot: () => void
  onRegenerateVideo: () => void
  onGenerateVoice: () => void
  onApplyLipsync: () => void
}

export function ProductionPanel({
  shot,
  simulation,
  currentStep,
  startFrameImageUrl,
  widthPct = 50,
  videoPlayerRef,
  onTimeUpdate,
  onPlayStateChange,
  onStepChange,
  onUpdate,
  onGenerateFrames,
  onGenerateVideo,
  onApproveShot,
  onRegenerateVideo,
  onGenerateVoice,
  onApplyLipsync,
}: ProductionPanelProps) {
  const shotStatus = deriveShotStatus(simulation)
  const isLoading =
    simulation.frames === "loading" ||
    simulation.video === "loading" ||
    simulation.voice === "loading" ||
    simulation.lipsync === "loading"

  return (
    <div
      className="flex flex-col flex-1 min-w-0"
      style={{ background: "#000000", width: `${widthPct}%`, flexShrink: 0 }}
    >
      <div style={{ padding: "16px 16px 0 16px" }}>
        <WorkflowStepper
          currentStep={currentStep}
          shotStatus={shotStatus}
          isLoading={isLoading}
          onStepClick={onStepChange}
        />
      </div>

      <AnimatePresence mode="wait">
        {currentStep === "script" && (
          <motion.div
            key="step-script"
            className="flex flex-col flex-1 min-h-0"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <StepScript
              startFramePrompt={shot.startFramePrompt}
              isFramesLoading={simulation.frames === "loading"}
              isFramesReady={simulation.frames === "ready"}
              startFrameImageUrl={startFrameImageUrl}
              onUpdatePrompt={(v) => onUpdate("startFramePrompt", v)}
              onGenerateFrames={() => onGenerateFrames("script")}
              onMoveToVideo={() => {
                onStepChange("video")
                onGenerateVideo("video")
              }}
            />
          </motion.div>
        )}

        {currentStep === "video" && (
          <motion.div
            key="step-video"
            className="flex flex-col flex-1 min-h-0"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <StepVideo
              videoUrl={shot.videoUrl}
              isVideoLoading={simulation.video === "loading"}
              isApproved={simulation.approved}
              videoPlayerRef={videoPlayerRef}
              onTimeUpdate={onTimeUpdate}
              onPlayStateChange={onPlayStateChange}
              onRegenerateVideo={onRegenerateVideo}
              onApproveShot={onApproveShot}
            />
          </motion.div>
        )}

        {currentStep === "polish" && (
          <motion.div
            key="step-polish"
            className="flex flex-col flex-1 min-h-0"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <StepPolish
              internalMonologue={shot.internalMonologue}
              isVoiceLoading={simulation.voice === "loading"}
              isVoiceReady={simulation.voice === "ready"}
              isLipsyncLoading={simulation.lipsync === "loading"}
              isLipsyncReady={simulation.lipsync === "ready"}
              onGenerateVoice={onGenerateVoice}
              onApplyLipsync={onApplyLipsync}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
