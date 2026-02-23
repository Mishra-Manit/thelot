export type SimulationPhase = "idle" | "loading" | "ready"

export interface ShotSimulationState {
  frames: SimulationPhase
  video: SimulationPhase
}

export type ShotStatus = "draft" | "frames_ready" | "video_ready" | "approved"

export type EditingLevel = "movie" | "scene" | "shot"

export interface StoryboardShot {
  id: string
  number: number
  title: string
  duration: number
  action: string
  internalMonologue: string
  cameraNotes: string
  soundCues: string
  videoClipTitle: string
  videoUrl: string
  startFramePrompt: string
  endFramePrompt: string
  videoPrompt: string
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
  action: string
  internalMonologue: string
  cameraNotes: string
  soundCues: string
  videoClipTitle: string
  videoUrl: string
  startFramePrompt: string
  endFramePrompt: string
  videoPrompt: string
}>

// Input type for VideoPlayer multi-clip composition
export interface ShotInput {
  id: string
  videoUrl: string
  duration: number
}

// Layout info for timeline pill positioning
export interface ShotLayout {
  shot: StoryboardShot
  duration: number
  startSec: number
  leftPct: number
  widthPct: number
}
