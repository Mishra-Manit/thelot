# Scene Panel Collapse Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to collapse the left `SceneOverview` panel at scene level, making the video player span the full width — mirroring the existing collapse behavior at shot level.

**Architecture:** Add `isCollapsed`/`onCollapsedChange` props to `SceneOverview`, wrap its root element in a `motion.aside` with an animated width (420px ↔ 44px). A separate `scenePanelCollapsed` state lives in `storyboard-editor.tsx` and is reset when navigating away from scene level. The collapsed strip mirrors the shot-level `SceneSidebar` collapsed panel: expand button + scrollable shot number icons.

**Tech Stack:** React, Framer Motion (`motion.aside`, `AnimatePresence`), Lucide icons (`ChevronLeft`, `ChevronRight`), Tailwind CSS, TypeScript.

---

### Task 1: Add `scenePanelCollapsed` state to `StoryboardEditor`

**Files:**
- Modify: `v3/components/storyboard/storyboard-editor.tsx`

**Context:**
`storyboard-editor.tsx` already has a `panelCollapsed` state for the shot-level `SceneSidebar`. We need a parallel state for the scene-level `SceneOverview`. It must reset to `false` when the user navigates back to movie level (not scene level, since scene level is where this panel lives).

**Step 1: Add the new state**

Find the existing state block around line 63:
```tsx
const [panelCollapsed, setPanelCollapsed] = useState(false)
```

Add directly below it:
```tsx
const [scenePanelCollapsed, setScenePanelCollapsed] = useState(false)
```

**Step 2: Reset on `handleBackToMovie`**

Find `handleBackToMovie` (around line 199). It already calls `setPanelCollapsed(false)`. Add a reset for the new state too:
```tsx
const handleBackToMovie = useCallback(() => {
  setSelectedScene(null)
  setSelectedShot(null)
  setEditingLevel("movie")
  setPanelCollapsed(false)
  setScenePanelCollapsed(false)  // add this line
}, [])
```

**Step 3: Pass props to `SceneOverview`**

Find the `SceneOverview` JSX block (around line 584). Change:
```tsx
<SceneOverview
  scene={activeScene}
  simulationByShot={simulation.simulationByShot}
  durationByShot={Object.fromEntries(activeScene.shots.map((shot) => [shot.id, shot.duration]))}
  onShotSelect={handleShotSelect}
  onBackToMovie={handleBackToMovie}
/>
```

To:
```tsx
<SceneOverview
  scene={activeScene}
  simulationByShot={simulation.simulationByShot}
  durationByShot={Object.fromEntries(activeScene.shots.map((shot) => [shot.id, shot.duration]))}
  onShotSelect={handleShotSelect}
  onBackToMovie={handleBackToMovie}
  isCollapsed={scenePanelCollapsed}
  onCollapsedChange={setScenePanelCollapsed}
/>
```

---

### Task 2: Update `SceneOverview` to support collapse

**Files:**
- Modify: `v3/components/storyboard/scene-overview.tsx`

**Context:**
`scene-overview.tsx` currently renders a plain `div` with `width: "420px"` and no collapse support. We need to:
1. Add `isCollapsed` / `onCollapsedChange` to its props interface
2. Wrap the root in `motion.aside` with animated width
3. Show the existing content (with a new collapse button) when expanded
4. Show a 44px collapsed strip (expand button + shot number icons) when collapsed

This mirrors `scene-sidebar.tsx` which uses `motion.aside` + `AnimatePresence` + `CollapsedPanel`/`ExpandedPanel` sub-components.

**Step 1: Update imports**

Replace the current import line at the top:
```tsx
import type { StoryboardScene, ShotSimulationState } from "@/lib/storyboard-types"
```

With:
```tsx
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { StoryboardScene, ShotSimulationState } from "@/lib/storyboard-types"
```

**Step 2: Update `SceneOverviewProps`**

Replace:
```tsx
interface SceneOverviewProps {
  scene: StoryboardScene
  simulationByShot: Record<string, ShotSimulationState>
  durationByShot: Record<string, number>
  onShotSelect: (shotId: string) => void
  onBackToMovie: () => void
}
```

With:
```tsx
interface SceneOverviewProps {
  scene: StoryboardScene
  simulationByShot: Record<string, ShotSimulationState>
  durationByShot: Record<string, number>
  onShotSelect: (shotId: string) => void
  onBackToMovie: () => void
  isCollapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}
```

**Step 3: Update the function signature and root element**

Replace the function signature and root `div` open tag:

Old signature:
```tsx
export function SceneOverview({
  scene,
  simulationByShot,
  durationByShot,
  onShotSelect,
  onBackToMovie,
}: SceneOverviewProps) {
```

New signature:
```tsx
export function SceneOverview({
  scene,
  simulationByShot,
  durationByShot,
  onShotSelect,
  onBackToMovie,
  isCollapsed,
  onCollapsedChange,
}: SceneOverviewProps) {
```

Replace the root `div` (the one with `width: "420px"`) with a `motion.aside` wrapper + `AnimatePresence`:

Old (lines 28–37 approximately):
```tsx
  return (
    <div
      className="flex flex-col h-full overflow-y-auto font-sans"
      style={{
        background: "#000000",
        borderRight: "1px solid #232323",
        width: "420px",
        flexShrink: 0,
      }}
    >
```

New:
```tsx
  return (
    <motion.aside
      className="flex flex-col shrink-0 overflow-hidden font-sans"
      style={{ background: "#000000", borderRight: "1px solid #232323" }}
      initial={false}
      animate={{ width: isCollapsed ? 44 : 420 }}
      transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.7 }}
      aria-label={isCollapsed ? "Scene panel (collapsed)" : "Scene panel"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isCollapsed ? (
          <CollapsedScenePanel
            scene={scene}
            onExpand={() => onCollapsedChange(false)}
            onShotSelect={onShotSelect}
          />
        ) : (
          <ExpandedScenePanel
            scene={scene}
            simulationByShot={simulationByShot}
            durationByShot={durationByShot}
            totalDuration={totalDuration}
            onShotSelect={onShotSelect}
            onBackToMovie={onBackToMovie}
            onCollapse={() => onCollapsedChange(true)}
          />
        )}
      </AnimatePresence>
```

Close with `</motion.aside>` instead of `</div>`.

**Step 4: Extract `ExpandedScenePanel` from existing content**

Move everything that was inside the root `div` (the back button, title, legend, shot list) into a new sub-component. Add a collapse button in the header row.

```tsx
function ExpandedScenePanel({
  scene,
  simulationByShot,
  durationByShot,
  totalDuration,
  onShotSelect,
  onBackToMovie,
  onCollapse,
}: {
  scene: StoryboardScene
  simulationByShot: Record<string, ShotSimulationState>
  durationByShot: Record<string, number>
  totalDuration: number
  onShotSelect: (shotId: string) => void
  onBackToMovie: () => void
  onCollapse: () => void
}) {
  return (
    <motion.div
      key="expanded-scene-panel"
      className="flex flex-col h-full overflow-y-auto"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {/* Back + title */}
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid #232323" }}>
        <div className="flex items-center justify-between mb-2">
          <button
            className="transition-colors duration-150"
            style={{ fontSize: "11px", color: "#696969" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#696969")}
            onClick={onBackToMovie}
          >
            ← All Scenes
          </button>
          <CollapseSceneButton onCollapse={onCollapse} />
        </div>
        <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginBottom: "4px" }}>
          {scene.number}. {scene.title}
        </h2>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "11px", color: "#696969" }}>
            {scene.shots.length} shots &middot; {totalDuration}s total
          </span>
        </div>
      </div>

      {/* Status legend */}
      <div
        className="px-4 py-4 flex items-center justify-center gap-6 flex-wrap"
        style={{ borderBottom: "1px solid #232323" }}
      >
        <LegendItem status="draft" label="No frames" size="md" />
        <LegendItem status="frames_ready" label="Frames ready" size="md" />
        <LegendItem status="video_ready" label="Video complete" size="md" />
      </div>

      {/* Shot breakdown */}
      <div className="flex flex-col px-4 pt-4 pb-3 gap-2">
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "#696969",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Shots
        </span>

        {scene.shots.map((shot) => {
          const sim = simulationByShot[shot.id] ?? { frames: "idle", video: "idle", approved: false, voice: "idle", lipsync: "idle" }
          const status = deriveShotStatus(sim)
          const duration = durationByShot[shot.id] ?? shot.duration
          const previewText = shot.action.slice(0, 60) + (shot.action.length > 60 ? "…" : "")
          return (
            <button
              key={shot.id}
              className="flex items-start gap-3 rounded-lg transition-colors duration-150 text-left px-3 py-2.5"
              style={{ background: "#111111", border: "1px solid #232323" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#232323")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#111111")}
              onClick={() => onShotSelect(shot.id)}
            >
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                <ShotStatusDot status={status} size="sm" />
                <span style={{ fontSize: "10px", color: "#696969", fontWeight: 600 }}>
                  {shot.number}
                </span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span
                  style={{ fontSize: "12px", color: "#D9D9D9", fontWeight: 500 }}
                  className="truncate"
                >
                  {shot.title}
                </span>
                {previewText && (
                  <span
                    style={{ fontSize: "11px", color: "#696969", lineHeight: 1.4, marginTop: "2px" }}
                  >
                    {previewText}
                  </span>
                )}
              </div>
              <span
                style={{ fontSize: "11px", color: "#696969", flexShrink: 0, paddingTop: "1px" }}
              >
                {duration}s
              </span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
```

**Step 5: Add `CollapsedScenePanel`**

```tsx
function CollapsedScenePanel({
  scene,
  onExpand,
  onShotSelect,
}: {
  scene: StoryboardScene
  onExpand: () => void
  onShotSelect: (shotId: string) => void
}) {
  return (
    <motion.div
      key="collapsed-scene-panel"
      className="flex flex-col h-full items-center"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <button
        onClick={onExpand}
        className="flex items-center justify-center transition-colors duration-150"
        style={{ width: "44px", height: "40px", color: "#696969" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#696969")}
        aria-label="Expand scene panel"
      >
        <ChevronRight size={16} />
      </button>

      <div style={{ width: "20px", height: "1px", background: "#232323", marginBottom: "8px" }} />

      <div className="flex flex-col items-center gap-2 overflow-y-auto flex-1 py-1">
        {scene.shots.map((shot) => (
          <button
            key={shot.id}
            onClick={() => onShotSelect(shot.id)}
            className="flex items-center justify-center rounded shrink-0 transition-all duration-150"
            style={{
              width: "30px",
              height: "26px",
              fontSize: "9px",
              fontWeight: 600,
              background: "transparent",
              color: "#696969",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#11111188"
              e.currentTarget.style.color = "#D9D9D9"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "#696969"
            }}
            aria-label={`Shot ${shot.number}: ${shot.title}`}
            title={`Shot ${shot.number}: ${shot.title}`}
          >
            {shot.number}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
```

**Step 6: Add `CollapseSceneButton`**

```tsx
function CollapseSceneButton({ onCollapse }: { onCollapse: () => void }) {
  return (
    <button
      onClick={onCollapse}
      className="flex items-center justify-center rounded transition-colors duration-150"
      style={{ width: "22px", height: "22px", color: "#696969" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#ffffff"
        e.currentTarget.style.background = "#232323"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#696969"
        e.currentTarget.style.background = "transparent"
      }}
      aria-label="Collapse scene panel"
    >
      <ChevronLeft size={14} />
    </button>
  )
}
```

**Step 7: Update the `SceneOverview` body**

The `totalDuration` computation stays in the main function body. Move it above the return, then pass it into `ExpandedScenePanel` as a prop. Final shape of the main function:

```tsx
export function SceneOverview({
  scene,
  simulationByShot,
  durationByShot,
  onShotSelect,
  onBackToMovie,
  isCollapsed,
  onCollapsedChange,
}: SceneOverviewProps) {
  const totalDuration = scene.shots.reduce(
    (sum, s) => sum + (durationByShot[s.id] ?? s.duration),
    0
  )

  return (
    <motion.aside
      className="flex flex-col shrink-0 overflow-hidden font-sans"
      style={{ background: "#000000", borderRight: "1px solid #232323" }}
      initial={false}
      animate={{ width: isCollapsed ? 44 : 420 }}
      transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.7 }}
      aria-label={isCollapsed ? "Scene panel (collapsed)" : "Scene panel"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isCollapsed ? (
          <CollapsedScenePanel
            scene={scene}
            onExpand={() => onCollapsedChange(false)}
            onShotSelect={onShotSelect}
          />
        ) : (
          <ExpandedScenePanel
            scene={scene}
            simulationByShot={simulationByShot}
            durationByShot={durationByShot}
            totalDuration={totalDuration}
            onShotSelect={onShotSelect}
            onBackToMovie={onBackToMovie}
            onCollapse={() => onCollapsedChange(true)}
          />
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
```

---

### Verification

After both tasks are complete, visually verify in the browser (`bun dev` in `v3/`):

1. Navigate to a scene (scene level) — left panel is visible (default open)
2. Click the ChevronLeft collapse button in the header — panel animates to 44px, video spans full width
3. Shot numbers appear in the collapsed strip
4. Click a shot number — navigates to that shot directly
5. Click ChevronRight expand button — panel animates back to 420px
6. Navigate back to movie level (`← All Scenes`) — panel resets to expanded next time a scene is entered
7. Navigate to shot level — existing shot sidebar collapse still works independently
