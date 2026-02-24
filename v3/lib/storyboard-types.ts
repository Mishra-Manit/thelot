export type SimulationPhase = "idle" | "loading" | "ready"

export interface ShotSimulationState {
  frames: SimulationPhase
  video: SimulationPhase
  approved: boolean
  voice: SimulationPhase
  lipsync: SimulationPhase
}

export type ShotStatus = "draft" | "frames_ready" | "video_ready" | "approved"

export type EditingLevel = "movie" | "scene" | "shot"

export type WorkflowStep = "script" | "video" | "polish"

export interface StoryboardShot {
  id: string
  number: number
  title: string
  duration: number
  framesStatus: SimulationPhase
  videoStatus: SimulationPhase
  voiceStatus: SimulationPhase
  lipsyncStatus: SimulationPhase
  approved: boolean
  action: string
  internalMonologue: string
  cameraNotes: string
  soundCues: string
  videoClipTitle: string
  videoUrl: string
  startFramePrompt: string
  endFramePrompt: string
  videoPrompt: string
  startFrameUrl: string
  voiceUrl: string
  lipsyncVideoUrl: string
}

export interface StoryboardScene {
  id: string
  number: number
  title: string
  shots: StoryboardShot[]
}

export type StoryboardShotUpdateInput = Partial<{
  title: string
  duration: number
  framesStatus: SimulationPhase
  videoStatus: SimulationPhase
  voiceStatus: SimulationPhase
  lipsyncStatus: SimulationPhase
  approved: boolean
  action: string
  internalMonologue: string
  cameraNotes: string
  soundCues: string
  videoClipTitle: string
  videoUrl: string
  startFramePrompt: string
  endFramePrompt: string
  videoPrompt: string
  startFrameUrl: string
  voiceUrl: string
  lipsyncVideoUrl: string
}>

// Input type for VideoPlayer multi-clip composition
export interface ShotInput {
  id: string
  videoUrl: string
  duration: number
}

// Represents a shot asset currently being generated (for nav bar render queue)
export interface RenderingShot {
  shotId: string
  shotNumber: number
  type: "frames" | "video"
  originStep: WorkflowStep
  startedAt: number   // Date.now() when generation began
  durationMs: number  // total expected duration in ms
}

// Layout info for timeline pill positioning
export interface ShotLayout {
  shot: StoryboardShot
  duration: number
  startSec: number
  leftPct: number
  widthPct: number
}
