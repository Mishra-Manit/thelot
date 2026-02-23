import type {
  StoryboardShot,
  StoryboardScene,
  ShotStatus,
  ShotSimulationState,
} from "./storyboard-types"

const DEFAULT_SIM: ShotSimulationState = {
  frames: "idle",
  video: "idle",
  approved: false,
  voice: "idle",
  lipsync: "idle",
}

export function deriveShotStatus(sim: ShotSimulationState): ShotStatus {
  if (sim.approved) return "approved"
  if (sim.video === "ready") return "video_ready"
  if (sim.frames === "ready") return "frames_ready"
  return "draft"
}

// Returns the least-complete status across all shots in a scene
export function deriveSceneStatus(
  shots: StoryboardShot[],
  simulationByShot: Record<string, ShotSimulationState>
): ShotStatus {
  if (shots.length === 0) return "draft"
  const statuses = shots.map((s) => deriveShotStatus(simulationByShot[s.id] ?? DEFAULT_SIM))
  if (statuses.every((s) => s === "approved")) return "approved"
  if (statuses.every((s) => s === "video_ready" || s === "approved")) return "video_ready"
  if (statuses.some((s) => s !== "draft")) return "frames_ready"
  return "draft"
}

// Returns 0.0–1.0: fraction of shots at video_ready or approved
export function deriveSceneProgress(
  shots: StoryboardShot[],
  simulationByShot: Record<string, ShotSimulationState>
): number {
  if (shots.length === 0) return 0
  const ready = shots.filter((s) => {
    const sim = simulationByShot[s.id] ?? DEFAULT_SIM
    return sim.video === "ready" || sim.approved
  })
  return ready.length / shots.length
}

// Returns 0.0–1.0 overall movie progress
export function deriveMovieProgress(
  scenes: StoryboardScene[],
  simulationByShot: Record<string, ShotSimulationState>
): number {
  const allShots = scenes.flatMap((s) => s.shots)
  return deriveSceneProgress(allShots, simulationByShot)
}
