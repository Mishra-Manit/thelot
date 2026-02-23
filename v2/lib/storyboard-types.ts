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
  startSec: number
  leftPct: number
  widthPct: number
}
