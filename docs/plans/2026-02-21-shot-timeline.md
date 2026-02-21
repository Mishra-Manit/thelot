# Shot Timeline

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade `ShotTimeline` from a row of labeled buttons into a rich timeline strip with video thumbnail backgrounds, shot metadata overlays, and a playhead cursor driven by diffusion-core playback.

**Architecture:** Two-pass rendering — synchronous pill paint, then async thumbnail injection via ref maps. Playhead via direct DOM mutation on `playback:time`. No changes to the data model or server layer.

**Tech Stack:** React, diffusion-core `VideoSource.thumbnailsInRange`, inline styles, `useRef` maps

---

## Current State

`shot-timeline.tsx` receives `shots: StoryboardShot[]` for the active scene and renders pills sized by `flex: shot.duration`. Pills show only a shot number. The pills already render all at once synchronously — that foundation is correct and stays.

---

## What Gets Added

**1. Metadata overlay** — shot number, title (truncated), and duration inside each pill.

**2. Video thumbnails** — one frame extracted from `shot.videoUrl` becomes the pill background image. Loaded async after initial paint so pills never wait on network.

**3. Playhead cursor** — a vertical line that moves across the pill strip in sync with video playback, updated via direct DOM mutation at 30fps.

---

## Pill Anatomy

```
┌──────────────────────────────────────────────────┐
│ [video frame — 25% opacity background]           │
│                                                  │
│  ①  Battle Scene                          4s     │
└──────────────────────────────────────────────────┘
```

- Background: video thumbnail at ~25% opacity, `backgroundSize: cover`
- Bottom-left: shot number + title, truncated with ellipsis
- Bottom-right: duration in seconds
- Selected: `border: 2px solid #404556`, thumbnail opacity raised to 50%, `boxShadow: 0 0 10px #40455644`
- No video: solid `#1A1C25` with gradient overlay, shot number only

`flex: shot.duration` remains the sizing mechanism. `minWidth: 50px` prevents very short shots becoming unreadable.

---

## Two-Pass Rendering

```
shots prop arrives
      │
      ▼
React render → all pills painted at once (fast, no async)
      │
      ▼
useEffect fires → thumbnailsInRange() per shot, all in parallel
      │
      ▼
per-shot resolves: pillRef.style.backgroundImage = dataUrl  (no re-render)
```

Thumbnails use a `useRef<Map<string, HTMLDivElement>>` to write directly to the DOM, bypassing React state entirely so there is no re-render cascade as thumbnails arrive.

---

## Playhead

```
composition 'playback:time' event (30fps)
      │
      ▼
offset = (time / sceneTotalDuration) * stripWidth
      │
      ▼
playheadRef.current.style.transform = `translateX(${offset}px)`
```

The playhead element is an absolutely-positioned 1px vertical line inside the pill strip container. `willChange: 'transform'` is set so the browser composites it on the GPU. React state is never touched during playback — `currentTime` is threaded down from `StoryboardEditor` as a plain number updated by the `onTimeUpdate` callback already wired in `VideoPlayer`.

---

## Props Interface

```typescript
interface ShotTimelineProps {
  shots: StoryboardShot[]
  selectedShot: string | null
  sceneNumber: number
  onSelectShot: (shotId: string) => void
  currentTime?: number    // seconds, from VideoPlayer onTimeUpdate
  totalDuration?: number  // sum of scene shot durations
}
```

---

## Performance

| Concern | Solution |
|---|---|
| Thumbnails blocking initial render | Async after mount — pills appear immediately without them |
| 30fps playback causing React re-renders | Playhead via `ref.style.transform`, never `setState` |
| Re-extracting thumbnails on scene switch | Cache data URLs in a `useRef<Map<string, string>>` keyed by `shot.id` |
| Large video decode for thumbnail | `thumbnailsInRange({ count: 1, width: 160, height: 44 })` — minimal cost |

---

## Out of Scope

- Drag-to-resize shot duration (future — duration changes go through `ShotDetail` `onUpdate`)
- Audio waveforms
- Multi-scene timeline view
- Thumbnails for shots without a `videoUrl`

---

## Tasks

### Task 1: Metadata Overlay

**Files:** `v2/components/storyboard/shot-timeline.tsx`

Replace the centered shot number with a bottom-aligned row: shot number + title on the left, duration on the right. Add a `useRef<Map<string, HTMLDivElement>>` called `pillRefs` and attach a ref callback to each pill that registers/unregisters by `shot.id`.

```bash
git add v2/components/storyboard/shot-timeline.tsx
git commit -m "feat: add metadata overlay to shot timeline pills"
```

---

### Task 2: Async Thumbnail Injection

**Files:** `v2/components/storyboard/shot-timeline.tsx`

Add `thumbnailCache = useRef<Map<string, string>>(new Map())`. Write a local async helper `extractThumbnail(videoUrl)` that dynamically imports diffusion-core, calls `Source.from<VideoSource>`, iterates `thumbnailsInRange({ start: 0, end: 1, count: 1, width: 160, height: 44 })`, and returns the first frame as a data URL.

In a `useEffect` keyed on `shots`, fire-and-forget one extraction per shot that has a `videoUrl` and is not already cached. On resolve, write to `pillRefs.current.get(shot.id).style.backgroundImage`. Include an `isCancelled` flag in the effect cleanup to avoid setting state on unmounted elements.

```bash
git add v2/components/storyboard/shot-timeline.tsx
git commit -m "feat: async thumbnail injection into shot pills via ref map"
```

---

### Task 3: Playhead Cursor

**Files:** `v2/components/storyboard/shot-timeline.tsx`, `v2/components/storyboard/storyboard-editor.tsx`

In `storyboard-editor.tsx`, add `currentTime` state and wire it to the existing `onTimeUpdate` callback from `VideoPlayer` (already threaded through `FramePreview`). Pass `currentTime` and `sceneTotalDuration` down to `ShotTimeline`.

In `shot-timeline.tsx`, wrap the pill strip in a `position: relative` container. Add a playhead div with `position: absolute; top: 0; bottom: 0; width: 1px; background: #777076; willChange: transform`. In a `useEffect` keyed on `currentTime`, compute `offset = (currentTime / totalDuration) * stripEl.clientWidth` and write to `playheadRef.current.style.transform`.

```bash
git add v2/components/storyboard/shot-timeline.tsx v2/components/storyboard/storyboard-editor.tsx
git commit -m "feat: add playhead cursor to shot timeline driven by video playback time"
```

---

### Task 4: Edge Cases

**Files:** `v2/components/storyboard/shot-timeline.tsx`

- Guard `totalDuration === 0` in the playhead offset calculation
- Show `"Untitled"` placeholder when `shot.title` is empty
- Confirm `minWidth: 50px` holds on very short shots in a long scene
- Verify zero re-renders from thumbnail loading in React DevTools Profiler


previously logs: Plan to implement                                                                                                                                │
│                                                                                                                                                  │
│ Shot Timeline Upgrade Implementation Plan                                                                                                        │
│                                                                                                                                                  │
│ For Claude: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.                                             │
│                                                                                                                                                  │
│ Goal: Upgrade ShotTimeline from a row of labeled buttons into a rich timeline strip with a control bar, video thumbnail backgrounds, shot        │
│ metadata overlays, and a playhead cursor driven by video playback time.                                                                          │
│                                                                                                                                                  │
│ Architecture: Four-part implementation — (1) lift video time state from FramePreview to StoryboardEditor via forwardRef, (2) pill metadata       │
│ overlay with ref map for direct DOM thumbnail injection, (3) async thumbnail extraction using diffusion-core VideoSource, (4) control bar with   │
│ time display, play/pause, zoom, and FIT. No new data model changes.                                                                              │
│                                                                                                                                                  │
│ Tech Stack: React 19, TypeScript, @diffusionstudio/core VideoSource.thumbnailsInRange, inline styles, forwardRef + useImperativeHandle, useRef   │
│ maps for direct DOM mutation.                                                                                                                    │
│                                                                                                                                                  │
│ Color Palette (must match codebase): #0D0E14, #252933, #404556, #60515C, #777076, #597D7C, #386775, #20504E                                      │
│                                                                                                                                                  │
│ ---                                                                                                                                              │
│ Context                                                                                                                                          │
│                                                                                                                                                  │
│ The current ShotTimeline renders pills with only a centered shot number. The spec calls for:                                                     │
│ - A control bar at the top: SPLIT button, current time / play-pause / total duration display, zoom slider, FIT button                            │
│ - Video thumbnail backgrounds on each pill (async, injected directly into DOM after paint)                                                       │
│ - Metadata overlay inside each pill: shot number + title (left), duration in seconds (right)                                                     │
│ - A playhead cursor — 1px vertical line + triangle indicator — that tracks video playback via direct DOM mutation (no React state)               │
│                                                                                                                                                  │
│ The playback time currently lives inside FramePreview as local state. It must be lifted to StoryboardEditor so ShotTimeline can read it.         │
│                                                                                                                                                  │
│ ---                                                                                                                                              │
│ Critical Files                                                                                                                                   │
│                                                                                                                                                  │
│ ┌────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────┐                   ││ │                      File                      │                                   Role                                    │                   │
│ ├────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤                   ││ │ v2/components/storyboard/shot-timeline.tsx     │ Primary work — control bar, pills, thumbnail injection, playhead          │                   │
│ ├────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤                   ││ │ v2/components/storyboard/frame-preview.tsx     │ Add forwardRef handle + onVideoTimeUpdate/onVideoPlayStateChange props    │                   │
│ ├────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤                   ││ │ v2/components/storyboard/storyboard-editor.tsx │ Lift currentTime state, wire FramePreview ref, pass props to ShotTimeline │                   │
│ ├────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤                   ││ │ v2/lib/storyboard-types.ts                     │ Read-only reference for StoryboardShot type                               │                   │
│ └────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────┘                   ││                                                                                                                                                  │
│ ---                                                                                                                                              ││ Task 1: Lift Video Time State — FramePreview + StoryboardEditor                                                                                  │
│                                                                                                                                                  ││ Files                                                                                                                                            │
│                                                                                                                                                  ││ - Modify: v2/components/storyboard/frame-preview.tsx (lines 27–70, ~259–270)                                                                     │
│ - Modify: v2/components/storyboard/storyboard-editor.tsx (lines 43–68, 449–465, 544–550)                                                         ││                                                                                                                                                  │
│ Step 1: Add handle type and forwardRef to FramePreview                                                                                           ││                                                                                                                                                  │
│ At the top of frame-preview.tsx, add the handle type and new callback props:                                                                     ││                                                                                                                                                  │
│ import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react"                                                ││                                                                                                                                                  │
│ export interface FramePreviewHandle {                                                                                                            ││   play: () => void                                                                                                                               │
│   pause: () => void                                                                                                                              ││ }                                                                                                                                                │
│                                                                                                                                                  ││ interface FramePreviewProps {                                                                                                                    │
│   // ...existing props unchanged...                                                                                                              ││   onVideoTimeUpdate?: (time: number, duration: number) => void                                                                                   │
│   onVideoPlayStateChange?: (playing: boolean) => void                                                                                            ││ }                                                                                                                                                │
│                                                                                                                                                  ││ Convert the function signature to use forwardRef:                                                                                                │
│                                                                                                                                                  ││ export const FramePreview = forwardRef<FramePreviewHandle, FramePreviewProps>(                                                                   │
│   function FramePreview({ ...allProps, onVideoTimeUpdate, onVideoPlayStateChange }, ref) {                                                       ││     // ...existing body...                                                                                                                       │
│                                                                                                                                                  ││     useImperativeHandle(ref, () => ({                                                                                                            │
│       play: () => playerRef.current?.play(),                                                                                                     ││       pause: () => playerRef.current?.pause(),                                                                                                   │
│     }))                                                                                                                                          ││                                                                                                                                                  │
│ In the onTimeUpdate handler at the VideoPlayer call site (line ~261), also call the new callback:                                                ││                                                                                                                                                  │
│ onTimeUpdate={(cur, dur) => {                                                                                                                    ││   setCurrentTime(cur)                                                                                                                            │
│   setTotalDuration(dur)                                                                                                                          ││   onVideoTimeUpdate?.(cur, dur)                                                                                                                  │
│ }}                                                                                                                                               ││ onPlayStateChange={(playing) => {                                                                                                                │
│   setIsPlaying(playing)                                                                                                                          ││   onVideoPlayStateChange?.(playing)                                                                                                              │
│ }}                                                                                                                                               ││                                                                                                                                                  │
│ Step 2: Wire state in StoryboardEditor                                                                                                           ││                                                                                                                                                  │
│ In storyboard-editor.tsx, add three new state variables (after line 67):                                                                         ││                                                                                                                                                  │
│ const [videoCurrentTime, setVideoCurrentTime] = useState(0)                                                                                      ││ const [videoTotalDuration, setVideoTotalDuration] = useState(0)                                                                                  │
│ const [isVideoPlaying, setIsVideoPlaying] = useState(false)                                                                                      │
│ const framePreviewRef = useRef<FramePreviewHandle>(null)                                                                                         │
│                                                                                                                                                  │
│ Add import for FramePreviewHandle:                                                                                                               │
│ import { FramePreview, type FramePreviewHandle } from "./frame-preview"                                                                          │
│                                                                                                                                                  │
│ Add play/pause callback:                                                                                                                         │
│ const handleTimelinePlayPause = useCallback(() => {                                                                                              │
│   if (isVideoPlaying) {                                                                                                                          │
│     framePreviewRef.current?.pause()                                                                                                             │
│   } else {                                                                                                                                       │
│     framePreviewRef.current?.play()                                                                                                              │
│   }                                                                                                                                              │
│ }, [isVideoPlaying])                                                                                                                             │
│                                                                                                                                                  │
│ Update the <FramePreview> JSX to pass the ref and new callbacks:                                                                                 │
│                                                                                                                                                  │
│ <FramePreview                                                                                                                                    │
│   ref={framePreviewRef}                                                                                                                          │
│   onVideoTimeUpdate={(time, dur) => {                                                                                                            ││     setVideoCurrentTime(time)                                                                                                                    │
│     setVideoTotalDuration(dur)                                                                                                                   │
│   }}                                                                                                                                             │
│   onVideoPlayStateChange={setIsVideoPlaying}                                                                                                     │
│   // ...all existing props unchanged...                                                                                                          │
│ />                                                                                                                                               │
│                                                                                                                                                  │
│ Update the <ShotTimeline> JSX to pass time props:                                                                                                │
│                                                                                                                                                  │
│ <ShotTimeline                                                                                                                                    │
│   shots={activeScene.shots}                                                                                                                      ││   selectedShot={selectedShot}                                                                                                                    │
│   sceneNumber={activeScene.number}                                                                                                               │
│   onSelectShot={handleSelectShot}                                                                                                                │
│   currentTime={videoCurrentTime}                                                                                                                 │
│   totalDuration={videoTotalDuration}                                                                                                             │
│   isPlaying={isVideoPlaying}                                                                                                                     │
│   onPlayPause={handleTimelinePlayPause}                                                                                                          │
│ />                                                                                                                                               │
│                                                                                                                                                  │
│ Step 3: Commit                                                                                                                                   │
│                                                                                                                                                  ││ git add v2/components/storyboard/frame-preview.tsx v2/components/storyboard/storyboard-editor.tsx                                                │
│ git commit -m "feat: lift video time state to StoryboardEditor, expose FramePreview play/pause handle"                                           │
│                                                                                                                                                  │
│ ---                                                                                                                                              │
│ Task 2: Pill Metadata Overlay + Ref Map                                                                                                          │
│                                                                                                                                                  │
│ Files                                                                                                                                            │
│                                                                                                                                                  │
│ - Modify: v2/components/storyboard/shot-timeline.tsx                                                                                             │
│                                                                                                                                                  │
│ Step 1: Update the props interface                                                                                                               │
│                                                                                                                                                  │
│ Replace the existing ShotTimelineProps with:                                                                                                     │
│                                                                                                                                                  │
│ interface ShotTimelineProps {                                                                                                                    │
│   shots: StoryboardShot[]                                                                                                                        │
│   selectedShot: string | null                                                                                                                    │
│   sceneNumber: number                                                                                                                            │
│   onSelectShot: (shotId: string) => void                                                                                                         │
│   currentTime?: number                                                                                                                           │
│   totalDuration?: number                                                                                                                         │
│   isPlaying?: boolean                                                                                                                            │
│   onPlayPause?: () => void                                                                                                                       │
│ }                                                                                                                                                │
│                                                                                                                                                  ││ Step 2: Add pillRefs inside the component                                                                                                        │
│                                                                                                                                                  ││ Add this at the top of the component function body (before the return):                                                                          │
│                                                                                                                                                  │
│ const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map())                                                                               ││                                                                                                                                                  │
│ Step 3: Update each pill's JSX                                                                                                                   ││                                                                                                                                                  │
│ Replace the pill's inner content (currently just shot number centered) with bottom-aligned metadata. The pill button gets a ref callback and     ││ different inner layout:                                                                                                                          │
│                                                                                                                                                  ││ <button                                                                                                                                          │
│   key={shot.id}                                                                                                                                  ││   ref={(el) => {                                                                                                                                 │
│     if (el) pillRefs.current.set(shot.id, el)                                                                                                    ││     else pillRefs.current.delete(shot.id)                                                                                                        │
│   }}                                                                                                                                             ││   className="relative overflow-hidden transition-all duration-150 shrink-0"                                                                      │
│   style={{                                                                                                                                       ││     flex: shot.duration,                                                                                                                         │
│     minWidth: "50px",                                                                                                                            ││     height: "60px",                                                                                                                              │
│     borderRadius: "20px",                                                                                                                        ││     backgroundSize: "cover",                                                                                                                     │
│     backgroundPosition: "center",                                                                                                                ││     backgroundColor: "#1A1C25",                                                                                                                  │
│     border: isSelected ? "2px solid #404556" : "2px solid transparent",                                                                          ││     boxShadow: isSelected ? "0 0 10px #40455644" : "none",                                                                                       │
│     opacity: isSelected ? 1 : 0.65,                                                                                                              ││   }}                                                                                                                                             │
│   onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.opacity = "0.9" }}                                                               ││   onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.opacity = "0.65" }}                                                              │
│   onClick={() => onSelectShot(shot.id)}                                                                                                          ││ >                                                                                                                                                │
│   {/* Dark gradient overlay — improves text legibility over thumbnail */}                                                                        ││   <div                                                                                                                                           │
│     className="absolute inset-0 pointer-events-none"                                                                                             ││     style={{                                                                                                                                     │
│       background: isSelected                                                                                                                     ││         ? "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 100%)"                                                                   │
│         : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 100%)",                                                                 ││     }}                                                                                                                                           │
│   />                                                                                                                                             ││                                                                                                                                                  │
│   {/* Bottom-aligned metadata row */}                                                                                                            │
│   <div                                                                                                                                           │
│     className="absolute bottom-0 left-0 right-0 flex items-end justify-between pointer-events-none"                                              │
│     style={{ padding: "0 8px 6px" }}                                                                                                             │
│   >                                                                                                                                              │
│     {/* Shot number + title */}                                                                                                                  │
│     <span                                                                                                                                        │
│       style={{                                                                                                                                   │
│         fontSize: "9px",                                                                                                                         │
│         fontWeight: 600,                                                                                                                         │
│         color: isSelected ? "#FFFFFF" : "#D9D9D9",                                                                                               │
│         whiteSpace: "nowrap",                                                                                                                    │
│         overflow: "hidden",                                                                                                                      │
│         textOverflow: "ellipsis",                                                                                                                │
│         maxWidth: "70%",                                                                                                                         │
│         lineHeight: 1.2,                                                                                                                         │
│       }}                                                                                                                                         │
│     >                                                                                                                                            │
│       {shot.number}  {shot.title || "Untitled"}                                                                                                  │
│     </span>                                                                                                                                      │
│                                                                                                                                                  │
│     {/* Duration */}                                                                                                                             │
│     <span                                                                                                                                        │
│       style={{                                                                                                                                   │
│         fontSize: "9px",                                                                                                                         │
│         color: isSelected ? "#D9D9D9" : "#777076",                                                                                               │
│         fontVariantNumeric: "tabular-nums",                                                                                                      │
│         lineHeight: 1.2,                                                                                                                         │
│         flexShrink: 0,                                                                                                                           │
│       }}                                                                                                                                         │
│     >                                                                                                                                            │
│       {shot.duration}s                                                                                                                           │
│     </span>                                                                                                                                      │
│   </div>                                                                                                                                         │
│ </button>                                                                                                                                        │
│                                                                                                                                                  │
│ Step 4: Commit                                                                                                                                   │
│                                                                                                                                                  │
│ git add v2/components/storyboard/shot-timeline.tsx                                                                                               │
│ git commit -m "feat: add metadata overlay and pillRefs ref map to shot timeline pills"                                                           │
│                                                                                                                                                  │
│ ---                                                                                                                                              │
│ Task 3: Async Thumbnail Injection                                                                                                                │
│                                                                                                                                                  │
│ Files                                                                                                                                            │
│                                                                                                                                                  │
│ - Modify: v2/components/storyboard/shot-timeline.tsx                                                                                             │
│                                                                                                                                                  │
│ Step 1: Add thumbnailCache ref and extractThumbnail helper                                                                                       │
│                                                                                                                                                  │
│ Add inside the component function (after pillRefs):                                                                                              │
│                                                                                                                                                  │
│ const thumbnailCache = useRef<Map<string, string>>(new Map())                                                                                    │
│                                                                                                                                                  │
│ Add a standalone async helper function outside the component (top of file, after imports):                                                       │
│                                                                                                                                                  │
│ async function extractThumbnail(videoUrl: string): Promise<string | null> {                                                                      │
│   try {                                                                                                                                          │
│     const core = await import("@diffusionstudio/core")                                                                                           │
│     const source = await core.Source.from<core.VideoSource>(videoUrl)                                                                            │
│     for await (const frame of source.thumbnailsInRange({                                                                                         │
│       start: 0,                                                                                                                                  │
│       end: 1,                                                                                                                                    │
│       count: 1,                                                                                                                                  │
│       width: 160,                                                                                                                                │
│       height: 44,                                                                                                                                │
│     })) {                                                                                                                                        │
│       if (frame) return frame.canvas.toDataURL()                                                                                                 │
│     }                                                                                                                                            │
│     return null                                                                                                                                  │
│   } catch {                                                                                                                                      │
│     return null                                                                                                                                  │
│   }                                                                                                                                              │
│ }                                                                                                                                                │
│                                                                                                                                                  │
│ Step 2: Add useEffect for thumbnail injection                                                                                                    │
│                                                                                                                                                  │
│ Add inside the component, after the pillRefs declaration:                                                                                        │
│                                                                                                                                                  │
│ useEffect(() => {                                                                                                                                │
│   let isCancelled = false                                                                                                                        │
│                                                                                                                                                  │
│   for (const shot of shots) {                                                                                                                    │
│     if (!shot.videoUrl) continue                                                                                                                 │
│     if (thumbnailCache.current.has(shot.id)) {                                                                                                   │
│       // Already cached — apply immediately                                                                                                      │
│       const el = pillRefs.current.get(shot.id)                                                                                                   │
│       if (el) {                                                                                                                                  │
│         el.style.backgroundImage = `url(${thumbnailCache.current.get(shot.id)})`                                                                 │
│       }                                                                                                                                          │
│       continue                                                                                                                                   │
│     }                                                                                                                                            │
│                                                                                                                                                  │
│     extractThumbnail(shot.videoUrl).then((dataUrl) => {                                                                                          │
│       if (isCancelled || !dataUrl) return                                                                                                        │
│       thumbnailCache.current.set(shot.id, dataUrl)                                                                                               │
│       const el = pillRefs.current.get(shot.id)                                                                                                   │
│       if (el) {                                                                                                                                  │
│         el.style.backgroundImage = `url(${dataUrl})`                                                                                             │
│       }                                                                                                                                          │
│     })                                                                                                                                           │
│   }                                                                                                                                              │
│                                                                                                                                                  │
│   return () => {                                                                                                                                 │
│     isCancelled = true                                                                                                                           │
│   }                                                                                                                                              │
│ }, [shots])                                                                                                                                      │
│                                                                                                                                                  │
│ Step 3: Commit                                                                                                                                   │
│                                                                                                                                                  │
│ git add v2/components/storyboard/shot-timeline.tsx                                                                                               │
│ git commit -m "feat: async thumbnail injection into shot pills via ref map, no re-render"                                                        │
│                                                                                                                                                  │
│ ---                                                                                                                                              │
│ Task 4: Playhead Cursor                                                                                                                          │
│                                                                                                                                                  │
│ Files                                                                                                                                            │
│                                                                                                                                                  │
│ - Modify: v2/components/storyboard/shot-timeline.tsx                                                                                             │
│                                                                                                                                                  │
│ Step 1: Add refs for the strip and playhead                                                                                                      │
│                                                                                                                                                  │
│ Add inside the component (after thumbnailCache):                                                                                                 │
│                                                                                                                                                  │
│ const stripRef = useRef<HTMLDivElement>(null)                                                                                                    │
│ const playheadRef = useRef<HTMLDivElement>(null)                                                                                                 │
│                                                                                                                                                  │
│ Step 2: Add useEffect for playhead position                                                                                                      │
│                                                                                                                                                  │
│ Add inside the component:                                                                                                                        │
│                                                                                                                                                  │
│ useEffect(() => {                                                                                                                                │
│   if (!playheadRef.current || !stripRef.current) return                                                                                          │
│   const duration = totalDuration ?? 0                                                                                                            │
│   const time = currentTime ?? 0                                                                                                                  │
│   if (duration === 0) return                                                                                                                     │
│   const offset = (time / duration) * stripRef.current.scrollWidth                                                                                │
│   playheadRef.current.style.transform = `translateX(${offset}px)`                                                                                │
│ }, [currentTime, totalDuration])                                                                                                                 │
│                                                                                                                                                  │
│ Step 3: Wrap the pill strip in a relative container with the playhead element                                                                    │
│                                                                                                                                                  │
│ Wrap the existing pill strip <div className="flex items-center gap-1"> inside a position-relative container. Replace the pill strip section      │
│ with:                                                                                                                                            │
│                                                                                                                                                  │
│ {/* Pill strip + playhead */}                                                                                                                    │
│ <div                                                                                                                                             │
│   ref={stripRef}                                                                                                                                 │
│   className="relative overflow-x-auto"                                                                                                           │
│   style={{ flex: 1 }}                                                                                                                            │
│ >                                                                                                                                                │
│   {/* Playhead — positioned at left:0, moved via transform */}                                                                                   │
│   <div                                                                                                                                           │
│     ref={playheadRef}                                                                                                                            │
│     className="absolute top-0 bottom-0 pointer-events-none z-20"                                                                                 │
│     style={{                                                                                                                                     │
│       left: 0,                                                                                                                                   │
│       width: "1px",                                                                                                                              │
│       transform: "translateX(0px)",                                                                                                              │
│       willChange: "transform",                                                                                                                   │
│     }}                                                                                                                                           │
│   >                                                                                                                                              │
│     {/* Triangle indicator at the top */}                                                                                                        │
│     <div                                                                                                                                         │
│       style={{                                                                                                                                   │
│         position: "absolute",                                                                                                                    │
│         top: 0,                                                                                                                                  │
│         left: "50%",                                                                                                                             │
│         transform: "translateX(-50%)",                                                                                                           │
│         width: 0,                                                                                                                                │
│         height: 0,                                                                                                                               │
│         borderLeft: "5px solid transparent",                                                                                                     │
│         borderRight: "5px solid transparent",                                                                                                    │
│         borderTop: "6px solid #777076",                                                                                                          │
│       }}                                                                                                                                         │
│     />                                                                                                                                           │
│     {/* Vertical line */}                                                                                                                        │
│     <div                                                                                                                                         │
│       style={{                                                                                                                                   │
│         position: "absolute",                                                                                                                    │
│         top: "6px",                                                                                                                              │
│         bottom: 0,                                                                                                                               │
│         left: 0,                                                                                                                                 │
│         width: "1px",                                                                                                                            │
│         background: "#777076",                                                                                                                   │
│       }}                                                                                                                                         │
│     />                                                                                                                                           │
│   </div>                                                                                                                                         │
│                                                                                                                                                  │
│   {/* Pill strip */}                                                                                                                             │
│   <div className="flex items-center gap-1">                                                                                                      │
│     {/* ...existing pill map and add button... */}                                                                                               │
│   </div>                                                                                                                                         │
│ </div>                                                                                                                                           │
│                                                                                                                                                  │
│ Step 4: Commit                                                                                                                                   │
│                                                                                                                                                  │
│ git add v2/components/storyboard/shot-timeline.tsx                                                                                               │
│ git commit -m "feat: playhead cursor on shot timeline driven by video playback time via direct DOM mutation"                                     │
│                                                                                                                                                  │
│ ---                                                                                                                                              │
│ Task 5: Control Bar                                                                                                                              │
│                                                                                                                                                  │
│ Files                                                                                                                                            │
│                                                                                                                                                  │
│ - Modify: v2/components/storyboard/shot-timeline.tsx                                                                                             │
│                                                                                                                                                  │
│ Step 1: Add formatTime helper and zoom state                                                                                                     │
│                                                                                                                                                  │
│ Add formatTime helper at the top of the file (outside the component, below extractThumbnail):                                                    │
│                                                                                                                                                  │
│ function formatTime(seconds: number): string {                                                                                                   │
│   const m = Math.floor(seconds / 60)                                                                                                             │
│   const s = Math.floor(seconds % 60)                                                                                                             │
│   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`                                                                           │
│ }                                                                                                                                                │
│                                                                                                                                                  │
│ Add zoom state inside the component:                                                                                                             │
│                                                                                                                                                  │
│ const [zoom, setZoom] = useState(1)                                                                                                              │
│ const MIN_ZOOM = 1                                                                                                                               │
│ const MAX_ZOOM = 4                                                                                                                               │
│                                                                                                                                                  │
│ Step 2: Replace the label row with the control bar                                                                                               │
│                                                                                                                                                  │
│ Replace the current label row JSX (the <div className="flex items-center gap-3 mb-3">) with this control bar:                                    │
│                                                                                                                                                  │
│ {/* Control bar */}                                                                                                                              │
│ <div className="flex items-center gap-3 mb-3">                                                                                                   │
│                                                                                                                                                  │
│   {/* SPLIT button */}                                                                                                                           │
│   <button                                                                                                                                        │
│     className="shrink-0"                                                                                                                         │
│     style={{                                                                                                                                     │
│       padding: "4px 10px",                                                                                                                       │
│       borderRadius: "6px",                                                                                                                       │
│       border: "1px solid #404556",                                                                                                               │
│       background: "transparent",                                                                                                                 │
│       color: "#777076",                                                                                                                          │
│       fontSize: "10px",                                                                                                                          │
│       fontWeight: 600,                                                                                                                           │
│       letterSpacing: "0.06em",                                                                                                                   │
│       cursor: "pointer",                                                                                                                         │
│     }}                                                                                                                                           │
│     onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#777076")}                                                                        │
│     onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#404556")}                                                                        │
│     aria-label="Split shot at playhead"                                                                                                          │
│   >                                                                                                                                              │
│     SPLIT                                                                                                                                        │
│   </button>                                                                                                                                      │
│                                                                                                                                                  │
│   {/* Spacer */}                                                                                                                                 │
│   <div className="flex-1" />                                                                                                                     │
│                                                                                                                                                  │
│   {/* Time display + play/pause */}                                                                                                              │
│   <div                                                                                                                                           │
│     className="flex items-center gap-2 shrink-0"                                                                                                 │
│     style={{ fontVariantNumeric: "tabular-nums" }}                                                                                               │
│   >                                                                                                                                              │
│     <span style={{ fontSize: "11px", color: "#777076" }}>                                                                                        │
│       {formatTime(currentTime ?? 0)}                                                                                                             │
│     </span>                                                                                                                                      │
│                                                                                                                                                  │
│     <button                                                                                                                                      │
│       onClick={onPlayPause}                                                                                                                      │
│       style={{                                                                                                                                   │
│         width: "22px",                                                                                                                           │
│         height: "22px",                                                                                                                          │
│         borderRadius: "50%",                                                                                                                     │
│         border: "1px solid #404556",                                                                                                             │
│         background: "transparent",                                                                                                               │
│         color: "#D9D9D9",                                                                                                                        │
│         display: "flex",                                                                                                                         │
│         alignItems: "center",                                                                                                                    │
│         justifyContent: "center",                                                                                                                │
│         cursor: "pointer",                                                                                                                       │
│         padding: 0,                                                                                                                              │
│       }}                                                                                                                                         │
│       aria-label={isPlaying ? "Pause" : "Play"}                                                                                                  │
│     >                                                                                                                                            │
│       {isPlaying ? <Pause size={10} /> : <Play size={10} />}                                                                                     │
│     </button>                                                                                                                                    │
│                                                                                                                                                  │
│     <span style={{ fontSize: "11px", color: "#777076" }}>                                                                                        │
│       {formatTime(totalDuration ?? 0)}                                                                                                           │
│     </span>                                                                                                                                      │
│   </div>                                                                                                                                         │
│                                                                                                                                                  │
│   {/* Spacer */}                                                                                                                                 │
│   <div className="flex-1" />                                                                                                                     │
│                                                                                                                                                  │
│   {/* Zoom controls */}                                                                                                                          │
│   <div className="flex items-center gap-1.5 shrink-0">                                                                                           │
│     <button                                                                                                                                      │
│       onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.5))}                                                                                │
│       style={{                                                                                                                                   │
│         color: "#777076",                                                                                                                        │
│         background: "transparent",                                                                                                               │
│         border: "none",                                                                                                                          │
│         cursor: "pointer",                                                                                                                       │
│         padding: "2px",                                                                                                                          │
│         lineHeight: 1,                                                                                                                           │
│       }}                                                                                                                                         │
│       aria-label="Zoom out"                                                                                                                      │
│     >                                                                                                                                            │
│       <Minus size={12} />                                                                                                                        │
│     </button>                                                                                                                                    │
│                                                                                                                                                  │
│     <input                                                                                                                                       │
│       type="range"                                                                                                                               │
│       min={MIN_ZOOM}                                                                                                                             │
│       max={MAX_ZOOM}                                                                                                                             │
│       step={0.25}                                                                                                                                │
│       value={zoom}                                                                                                                               │
│       onChange={(e) => setZoom(Number(e.target.value))}                                                                                          │
│       style={{ width: "60px", accentColor: "#404556", cursor: "pointer" }}                                                                       │
│       aria-label="Zoom level"                                                                                                                    │
│     />                                                                                                                                           │
│                                                                                                                                                  │
│     <button                                                                                                                                      │
│       onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.5))}                                                                                │
│       style={{                                                                                                                                   │
│         color: "#777076",                                                                                                                        │
│         background: "transparent",                                                                                                               │
│         border: "none",                                                                                                                          │
│         cursor: "pointer",                                                                                                                       │
│         padding: "2px",                                                                                                                          │
│         lineHeight: 1,                                                                                                                           │
│       }}                                                                                                                                         │
│       aria-label="Zoom in"                                                                                                                       │
│     >                                                                                                                                            │
│       <Plus size={12} />                                                                                                                         │
│     </button>                                                                                                                                    │
│                                                                                                                                                  │
│     <button                                                                                                                                      │
│       onClick={() => setZoom(1)}                                                                                                                 │
│       style={{                                                                                                                                   │
│         padding: "4px 8px",                                                                                                                      │
│         borderRadius: "6px",                                                                                                                     │
│         border: "1px solid #404556",                                                                                                             │
│         background: "transparent",                                                                                                               │
│         color: "#777076",                                                                                                                        │
│         fontSize: "10px",                                                                                                                        │
│         fontWeight: 600,                                                                                                                         │
│         letterSpacing: "0.06em",                                                                                                                 │
│         cursor: "pointer",                                                                                                                       │
│       }}                                                                                                                                         │
│       onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#777076")}                                                                      │
│       onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#404556")}                                                                      │
│       aria-label="Fit all shots"                                                                                                                 │
│     >                                                                                                                                            │
│       FIT                                                                                                                                        │
│     </button>                                                                                                                                    │
│   </div>                                                                                                                                         │
│ </div>                                                                                                                                           │
│                                                                                                                                                  │
│ Step 3: Apply zoom to the pill strip inner container                                                                                             │
│                                                                                                                                                  │
│ Inside the scrollable stripRef container, wrap the pill flex row in a zoomed inner div:                                                          │
│                                                                                                                                                  │
│ <div                                                                                                                                             │
│   ref={stripRef}                                                                                                                                 │
│   className="relative overflow-x-auto"                                                                                                           │
│   style={{ flex: 1 }}                                                                                                                            │
│ >                                                                                                                                                │
│   {/* Playhead (unchanged) */}                                                                                                                   │
│   ...                                                                                                                                            │
│                                                                                                                                                  │
│   {/* Zoomed pill strip */}                                                                                                                      │
│   <div                                                                                                                                           │
│     className="flex items-center gap-1"                                                                                                          │
│     style={{ width: zoom === 1 ? "100%" : `${zoom * 100}%`, minWidth: "100%" }}                                                                  │
│   >                                                                                                                                              │
│     {/* ...pill map and add button... */}                                                                                                        │
│   </div>                                                                                                                                         │
│ </div>                                                                                                                                           │
│                                                                                                                                                  │
│ Step 4: Add Minus and Play/Pause imports to the lucide-react import line                                                                         │
│                                                                                                                                                  │
│ import { Plus, Minus, Play, Pause } from "lucide-react"                                                                                          │
│                                                                                                                                                  │
│ Step 5: Commit                                                                                                                                   │
│                                                                                                                                                  │
│ git add v2/components/storyboard/shot-timeline.tsx                                                                                               │
│ git commit -m "feat: add control bar with time display, play/pause, zoom, and FIT to shot timeline"                                              │
│                                                                                                                                                  │
│ ---                                                                                                                                              │
│ Task 6: Edge Cases                                                                                                                               │
│                                                                                                                                                  │
│ Files                                                                                                                                            │
│                                                                                                                                                  │
│ - Modify: v2/components/storyboard/shot-timeline.tsx                                                                                             │
│                                                                                                                                                  │
│ Checklist                                                                                                                                        │
│                                                                                                                                                  │
│ 1. totalDuration === 0 → playhead stays at translateX(0) — already guarded in Task 4 step 2.                                                     │
│ 2. shot.title === "" → shows "Untitled" — already handled by shot.title || "Untitled" in Task 2 step 3.                                          │
│ 3. Very short shots → minWidth: "50px" is already set on the pill — confirm it holds at zoom = 1 with many shots.                                │
│ 4. Thumbnail fails to load → extractThumbnail returns null, background stays #1A1C25 — already handled by the if (!dataUrl) return guard in Task │
│  3.                                                                                                                                              │
│ 5. Shot without videoUrl → skip extraction entirely — already guarded by if (!shot.videoUrl) continue in Task 3.                                 │
│                                                                                                                                                  │
│ Commit                                                                                                                                           │
│                                                                                                                                                  │
│ git add v2/components/storyboard/shot-timeline.tsx                                                                                               │
│ git commit -m "fix: timeline edge cases — zero duration, empty title, missing video URL guards"                                                  │
│                                                                                                                                                  │
│ ---                                                                                                                                              │
│ Verification                                                                                                                                     │
│                                                                                                                                                  │
│ Manual verification steps                                                                                                                        │
│                                                                                                                                                  │
│ 1. Run the dev server: bun dev                                                                                                                   │
│ 2. Open the storyboard editor. The shot timeline panel at the bottom should show:                                                                │
│   - Control bar with SPLIT / time / play-pause / zoom-slider / FIT                                                                               │
│   - Pills with shot number + title + duration in the bottom row                                                                                  │
│   - Thumbnail backgrounds appearing async as images load (no layout shift)                                                                       │
│ 3. If a shot has a videoUrl and the video is ready in FramePreview, click play in FramePreview — the playhead in the timeline should slide       │
│ across the pill strip.                                                                                                                           │
│ 4. Click the play button in the timeline control bar — it should also toggle playback.                                                           │
│ 5. Drag the zoom slider right — the pills should grow and the strip should scroll horizontally.                                                  │
│ 6. Click FIT — zoom resets to 1 and all pills are visible.                                                                                       │
│ 7. Select a shot with a very short duration — confirm minWidth: 50px prevents it from becoming unreadable.                                       │
│                                                                                                                                                  │
│ TypeScript check (runs automatically via hook after edits)                                                                                       │
│                                                                                                                                                  │
│ cd /Users/manitmishra/Desktop/thelot && bun tsc --noEmit                                                                                         │
│                                                                                                                                                  │
│ Expected: no type errors.                                                                                                                        │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

⏺ Skill(superpowers:executing-plans)
  ⎿  Successfully loaded skill

⏺ I'm using the executing-plans skill to implement this plan.

  Let me start by reading the critical files to understand the current state before executing.

⏺ Read 3 files (ctrl+o to expand)

⏺ Now I have a clear picture of all files. Let me create the task list and execute the first batch.

⏺ Now executing Task 1 — updating frame-preview.tsx to add forwardRef, FramePreviewHandle, and callback props:

⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Added 1 line, removed 1 line
      1  "use client"
      2
      3 -import { useState, useCallback, useRef, useEffect } from "react"
      3 +import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
      4  import {
      5    Play,
      6    Pause,



⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Added 27 lines, removed 17 lines
      24  const MIN_TOP_PCT = 20
      25  const MAX_TOP_PCT = 70
      26
      27 +export interface FramePreviewHandle {
      28 +  play: () => void
      29 +  pause: () => void
      30 +}
      31 +
      32  interface FramePreviewProps {
      33    sceneNumber: number | null
      34    shotNumber: number | null
     ...
      45    areFramesReady: boolean
      46    isVideoLoading: boolean
      47    onGenerateFrames: () => void
      48 +  onVideoTimeUpdate?: (time: number, duration: number) => void
      49 +  onVideoPlayStateChange?: (playing: boolean) => void
      50  }
      51
      45 -export function FramePreview({
      46 -  sceneNumber,
      47 -  shotNumber,
      48 -  totalShots,
      49 -  duration,
      50 -  startFramePrompt,
      51 -  shotTitle,
      52 -  videoUrl,
      53 -  isSaving = false,
      54 -  startFrameImageUrl,
      55 -  endFrameImageUrl,
      56 -  endFrameFallbackImageUrl,
      57 -  isFramesLoading,
      58 -  areFramesReady,
      59 -  isVideoLoading,
      60 -  onGenerateFrames,
      61 -}: FramePreviewProps) {
      52 +export const FramePreview = forwardRef<FramePreviewHandle, FramePreviewProps>(
      53 +  function FramePreview({
      54 +    sceneNumber,
      55 +    shotNumber,
      56 +    totalShots,
      57 +    duration,
      58 +    startFramePrompt,
      59 +    shotTitle,
      60 +    videoUrl,
      61 +    isSaving = false,
      62 +    startFrameImageUrl,
      63 +    endFrameImageUrl,
      64 +    endFrameFallbackImageUrl,
      65 +    isFramesLoading,
      66 +    areFramesReady,
      67 +    isVideoLoading,
      68 +    onGenerateFrames,
      69 +    onVideoTimeUpdate,
      70 +    onVideoPlayStateChange,
      71 +  }: FramePreviewProps, ref) {
      72    const hasShot = sceneNumber !== null && shotNumber !== null
      73    const [startHover, setStartHover] = useState(false)
      74    const [endHover, setEndHover] = useState(false)

⏺ Now add useImperativeHandle after the playerRef declaration and update the VideoPlayer callbacks:

⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Added 5 lines
      80    const playerRef = useRef<VideoPlayerHandle | null>(null)
      81    const canControlPlayback = Boolean(videoUrl) && !isVideoLoading
      82
      83 +  useImperativeHandle(ref, () => ({
      84 +    play: () => playerRef.current?.play(),
      85 +    pause: () => playerRef.current?.pause(),
      86 +  }))
      87 +
      88    useEffect(() => {
      89      if (!videoUrl) setIsPlaying(false)
      90    }, [videoUrl])


⏺ Now update the VideoPlayer's onTimeUpdate and onPlayStateChange to also call the new callbacks:

⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Added 5 lines, removed 1 line
      276                    onTimeUpdate={(cur, dur) => {
      277                      setCurrentTime(cur)
      278                      setTotalDuration(dur)
      279 +                    onVideoTimeUpdate?.(cur, dur)
      280                    }}
      280 -                  onPlayStateChange={setIsPlaying}
      281 +                  onPlayStateChange={(playing) => {
      282 +                    setIsPlaying(playing)
      283 +                    onVideoPlayStateChange?.(playing)
      284 +                  }}
      285                    playerRef={playerRef}
      286                  />
      287                  {isVideoLoading && (

⏺ Now I need to close the forwardRef wrapper — the component function body needs a closing } for the inner function and then ) for forwardRef. Let
  me check the end of the file:

⏺ Read 1 file (ctrl+o to expand)

⏺ The forwardRef wrapper needs the closing ) after the inner function's }. Let me fix that:

⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Added 1 line, removed 1 line
      427        )}
      428      </div>
      429    )
      430 -}
      430 +})
      431
      432  /* ── Frame Card ─────────────────────────── */
      433

⏺ Now update storyboard-editor.tsx to wire the ref, new state, and pass props:

⏺ Update(components/storyboard/storyboard-editor.tsx)
  ⎿  Added 1 line, removed 1 line
       5  import { HeaderBar } from "./header-bar"
       6  import { SceneList } from "./scene-list"
       7  import { ShotDetail } from "./shot-detail"
       8 -import { FramePreview } from "./frame-preview"
       8 +import { FramePreview, type FramePreviewHandle } from "./frame-preview"
       9  import { ShotTimeline } from "./shot-timeline"
      10  import { updateShotAction } from "@/app/storyboard/actions"
      11  import type { StoryboardScene, StoryboardShotUpdateInput } from "@/lib/storyboard-types"



⏺ Update(components/storyboard/storyboard-editor.tsx)
  ⎿  Added 5 lines
      65    const [isTimelineHandleHovered, setIsTimelineHandleHovered] = useState(false)
      66    const bodyRef = useRef<HTMLDivElement>(null)
      67    const contentRef = useRef<HTMLDivElement>(null)
      68 +  const framePreviewRef = useRef<FramePreviewHandle>(null)
      69 +
      70 +  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
      71 +  const [videoTotalDuration, setVideoTotalDuration] = useState(0)
      72 +  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
      73    const simulationTimersRef = useRef<Record<string, Partial<Record<SimulationTimerKey, number>>>>(
      74      {}
      75    )




⏺ Now add the handleTimelinePlayPause callback. I'll add it after handleUpdateShot:

⏺ Update(components/storyboard/storyboard-editor.tsx)
  ⎿  Added 8 lines
      320      [selectedShot, startTransition]
      321    )
      322
      323 +  const handleTimelinePlayPause = useCallback(() => {
      324 +    if (isVideoPlaying) {
      325 +      framePreviewRef.current?.pause()
      326 +    } else {
      327 +      framePreviewRef.current?.play()
      328 +    }
      329 +  }, [isVideoPlaying])
      330 +
      331    return (
      332      <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: "#000000" }}>
      333        <HeaderBar


⏺ Now update the <FramePreview> JSX to pass ref and new callbacks:

⏺ Update(components/storyboard/storyboard-editor.tsx)
  ⎿  Added 6 lines
      462                  </motion.div>
      463
      464                  <FramePreview
      465 +                  ref={framePreviewRef}
      466                    sceneNumber={activeScene.number}
      467                    shotNumber={activeShot.number}
      468                    totalShots={activeScene.shots.length}
     ...
      478                    areFramesReady={activeSimulation.frames === "ready"}
      479                    isVideoLoading={activeSimulation.video === "loading"}
      480                    onGenerateFrames={() => handleGenerateFrames(activeShot.id)}
      481 +                  onVideoTimeUpdate={(time, dur) => {
      482 +                    setVideoCurrentTime(time)
      483 +                    setVideoTotalDuration(dur)
      484 +                  }}
      485 +                  onVideoPlayStateChange={setIsVideoPlaying}
      486                  />
      487                </>
      488              ) : (

⏺ Now update the <ShotTimeline> JSX to pass time props:

⏺ Update(components/storyboard/storyboard-editor.tsx)
  ⎿  Added 4 lines
      567                selectedShot={selectedShot}
      568                sceneNumber={activeScene.number}
      569                onSelectShot={handleSelectShot}
      570 +              currentTime={videoCurrentTime}
      571 +              totalDuration={videoTotalDuration}
      572 +              isPlaying={isVideoPlaying}
      573 +              onPlayPause={handleTimelinePlayPause}
      574              />
      575            </div>
      576          )}

⏺ Now let me commit Task 1:

⏺ Bash(git add v2/components/storyboard/frame-preview.tsx v2/components/storyboard/storyboard-editor.tsx && git commit -m "feat: lift video time
      state to StoryboardEdi…)
  ⎿  Interrupted · What should Claude do instead?

❯ dont make any changes to git for any of the agents, i want all changes in main

⏺ Got it — no git commits, all changes go directly to main. Let me continue with Task 2.

⏺ Task 2: Pill Metadata Overlay + Ref Map — rewriting shot-timeline.tsx with the updated props interface, pillRefs map, and bottom-aligned metadata:

⏺ Write(components/storyboard/shot-timeline.tsx)
  ⎿  Added 345 lines, removed 86 lines
      1  "use client"
      2
      3 -import { Plus } from "lucide-react"
      3 +import { useState, useRef, useEffect } from "react"
      4 +import { Plus, Minus, Play, Pause } from "lucide-react"
      5  import type { StoryboardShot } from "@/lib/storyboard-types"
      6
      7  interface ShotTimelineProps {
     ...
        9    selectedShot: string | null
       10    sceneNumber: number
       11    onSelectShot: (shotId: string) => void
       12 +  currentTime?: number
       13 +  totalDuration?: number
       14 +  isPlaying?: boolean
       15 +  onPlayPause?: () => void
       16  }
       17
       18 +async function extractThumbnail(videoUrl: string): Promise<string | null> {
       19 +  try {
       20 +    const core = await import("@diffusionstudio/core")
       21 +    const source = await core.Source.from<core.VideoSource>(videoUrl)
       22 +    for await (const frame of source.thumbnailsInRange({
       23 +      start: 0,
       24 +      end: 1,
       25 +      count: 1,
       26 +      width: 160,
       27 +      height: 44,
       28 +    })) {
       29 +      if (frame) return frame.canvas.toDataURL()
       30 +    }
       31 +    return null
       32 +  } catch {
       33 +    return null
       34 +  }
       35 +}
       36 +
       37 +function formatTime(seconds: number): string {
       38 +  const m = Math.floor(seconds / 60)
       39 +  const s = Math.floor(seconds % 60)
       40 +  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
       41 +}
       42 +
       43 +const MIN_ZOOM = 1
       44 +const MAX_ZOOM = 4
       45 +
       46  export function ShotTimeline({
       47    shots,
       48    selectedShot,
       49    sceneNumber,
       50    onSelectShot,
       51 +  currentTime,
       52 +  totalDuration,
       53 +  isPlaying,
       54 +  onPlayPause,
       55  }: ShotTimelineProps) {
       19 -  const totalDuration = shots.reduce((s, sh) => s + sh.duration, 0)
       56 +  const [zoom, setZoom] = useState(1)
       57
       58 +  // Ref map: shot id → pill button element, for direct DOM thumbnail injection
       59 +  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
       60 +  const thumbnailCache = useRef<Map<string, string>>(new Map())
       61 +
       62 +  // Refs for playhead positioning via direct DOM mutation
       63 +  const stripRef = useRef<HTMLDivElement>(null)
       64 +  const playheadRef = useRef<HTMLDivElement>(null)
       65 +
       66 +  // Async thumbnail injection — runs after shots change, no re-render on inject
       67 +  useEffect(() => {
       68 +    let isCancelled = false
       69 +
       70 +    for (const shot of shots) {
       71 +      if (!shot.videoUrl) continue
       72 +
       73 +      if (thumbnailCache.current.has(shot.id)) {
       74 +        const el = pillRefs.current.get(shot.id)
       75 +        if (el) {
       76 +          el.style.backgroundImage = `url(${thumbnailCache.current.get(shot.id)})`
       77 +        }
       78 +        continue
       79 +      }
       80 +
       81 +      extractThumbnail(shot.videoUrl).then((dataUrl) => {
       82 +        if (isCancelled || !dataUrl) return
       83 +        thumbnailCache.current.set(shot.id, dataUrl)
       84 +        const el = pillRefs.current.get(shot.id)
       85 +        if (el) {
       86 +          el.style.backgroundImage = `url(${dataUrl})`
       87 +        }
       88 +      })
       89 +    }
       90 +
       91 +    return () => {
       92 +      isCancelled = true
       93 +    }
       94 +  }, [shots])
       95 +
       96 +  // Playhead position — direct DOM mutation, no React state
       97 +  useEffect(() => {
       98 +    if (!playheadRef.current || !stripRef.current) return
       99 +    const dur = totalDuration ?? 0
      100 +    const time = currentTime ?? 0
      101 +    if (dur === 0) return
      102 +    const offset = (time / dur) * stripRef.current.scrollWidth
      103 +    playheadRef.current.style.transform = `translateX(${offset}px)`
      104 +  }, [currentTime, totalDuration])
      105 +
      106    return (
      107      <div
      108        className="h-full min-h-0 shrink-0 rounded-xl"
       24 -      style={{
       25 -        background: "#000000",
       26 -        padding: "16px 20px",
       27 -      }}
      109 +      style={{ background: "#000000", padding: "16px 20px" }}
      110      >
       29 -      {/* Label row */}
      111 +      {/* Control bar */}
      112        <div className="flex items-center gap-3 mb-3">
       31 -        <span
      113 +
      114 +        {/* SPLIT button */}
      115 +        <button
      116            className="shrink-0"
      117            style={{
      118 +            padding: "4px 10px",
      119 +            borderRadius: "6px",
      120 +            border: "1px solid #404556",
      121 +            background: "transparent",
      122 +            color: "#777076",
      123              fontSize: "10px",
       35 -            color: "#696969",
       36 -            textTransform: "uppercase",
       37 -            letterSpacing: "0.08em",
      124 +            fontWeight: 600,
      125 +            letterSpacing: "0.06em",
      126 +            cursor: "pointer",
      127            }}
      128 +          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#777076")}
      129 +          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#404556")}
      130 +          aria-label="Split shot at playhead"
      131          >
       40 -          Scene {sceneNumber} — Shot Timeline
       41 -        </span>
      132 +          SPLIT
      133 +        </button>
      134 +
      135 +        <div className="flex-1" />
      136 +
      137 +        {/* Time display + play/pause */}
      138          <div
       43 -          className="flex-1"
       44 -          style={{ height: "1px", background: "#232323" }}
       45 -        />
       46 -        <span
       47 -          className="shrink-0"
      139 +          className="flex items-center gap-2 shrink-0"
      140 +          style={{ fontVariantNumeric: "tabular-nums" }}
      141 +        >
      142 +          <span style={{ fontSize: "11px", color: "#777076" }}>
      143 +            {formatTime(currentTime ?? 0)}
      144 +          </span>
      145 +
      146 +          <button
      147 +            onClick={onPlayPause}
      148 +            style={{
      149 +              width: "22px",
      150 +              height: "22px",
      151 +              borderRadius: "50%",
      152 +              border: "1px solid #404556",
      153 +              background: "transparent",
      154 +              color: "#D9D9D9",
      155 +              display: "flex",
      156 +              alignItems: "center",
      157 +              justifyContent: "center",
      158 +              cursor: "pointer",
      159 +              padding: 0,
      160 +            }}
      161 +            aria-label={isPlaying ? "Pause" : "Play"}
      162 +          >
      163 +            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
      164 +          </button>
      165 +
      166 +          <span style={{ fontSize: "11px", color: "#777076" }}>
      167 +            {formatTime(totalDuration ?? 0)}
      168 +          </span>
      169 +        </div>
      170 +
      171 +        <div className="flex-1" />
      172 +
      173 +        {/* Zoom controls */}
      174 +        <div className="flex items-center gap-1.5 shrink-0">
      175 +          <button
      176 +            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.5))}
      177 +            style={{
      178 +              color: "#777076",
      179 +              background: "transparent",
      180 +              border: "none",
      181 +              cursor: "pointer",
      182 +              padding: "2px",
      183 +              lineHeight: 1,
      184 +            }}
      185 +            aria-label="Zoom out"
      186 +          >
      187 +            <Minus size={12} />
      188 +          </button>
      189 +
      190 +          <input
      191 +            type="range"
      192 +            min={MIN_ZOOM}
      193 +            max={MAX_ZOOM}
      194 +            step={0.25}
      195 +            value={zoom}
      196 +            onChange={(e) => setZoom(Number(e.target.value))}
      197 +            style={{ width: "60px", accentColor: "#404556", cursor: "pointer" }}
      198 +            aria-label="Zoom level"
      199 +          />
      200 +
      201 +          <button
      202 +            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.5))}
      203 +            style={{
      204 +              color: "#777076",
      205 +              background: "transparent",
      206 +              border: "none",
      207 +              cursor: "pointer",
      208 +              padding: "2px",
      209 +              lineHeight: 1,
      210 +            }}
      211 +            aria-label="Zoom in"
      212 +          >
      213 +            <Plus size={12} />
      214 +          </button>
      215 +
      216 +          <button
      217 +            onClick={() => setZoom(1)}
      218 +            style={{
      219 +              padding: "4px 8px",
      220 +              borderRadius: "6px",
      221 +              border: "1px solid #404556",
      222 +              background: "transparent",
      223 +              color: "#777076",
      224 +              fontSize: "10px",
      225 +              fontWeight: 600,
      226 +              letterSpacing: "0.06em",
      227 +              cursor: "pointer",
      228 +            }}
      229 +            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#777076")}
      230 +            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#404556")}
      231 +            aria-label="Fit all shots"
      232 +          >
      233 +            FIT
      234 +          </button>
      235 +        </div>
      236 +      </div>
      237 +
      238 +      {/* Pill strip + playhead */}
      239 +      <div
      240 +        ref={stripRef}
      241 +        className="relative overflow-x-auto"
      242 +        style={{ flex: 1 }}
      243 +      >
      244 +        {/* Playhead — translated horizontally via direct DOM mutation */}
      245 +        <div
      246 +          ref={playheadRef}
      247 +          className="absolute top-0 bottom-0 pointer-events-none z-20"
      248            style={{
       49 -            fontSize: "10px",
       50 -            color: "#696969",
       51 -            fontVariantNumeric: "tabular-nums",
      249 +            left: 0,
      250 +            width: "1px",
      251 +            transform: "translateX(0px)",
      252 +            willChange: "transform",
      253            }}
      254          >
       54 -          {shots.length} shots &middot; {totalDuration}s
       55 -        </span>
       56 -      </div>
      255 +          {/* Triangle indicator */}
      256 +          <div
      257 +            style={{
      258 +              position: "absolute",
      259 +              top: 0,
      260 +              left: "50%",
      261 +              transform: "translateX(-50%)",
      262 +              width: 0,
      263 +              height: 0,
      264 +              borderLeft: "5px solid transparent",
      265 +              borderRight: "5px solid transparent",
      266 +              borderTop: "6px solid #777076",
      267 +            }}
      268 +          />
      269 +          {/* Vertical line */}
      270 +          <div
      271 +            style={{
      272 +              position: "absolute",
      273 +              top: "6px",
      274 +              bottom: 0,
      275 +              left: 0,
      276 +              width: "1px",
      277 +              background: "#777076",
      278 +            }}
      279 +          />
      280 +        </div>
      281
       58 -      {/* Pill strip */}
       59 -      <div className="flex items-center gap-1">
       60 -        {shots.map((shot) => {
       61 -          const isSelected = selectedShot === shot.id
       62 -          return (
       63 -            <button
       64 -              key={shot.id}
       65 -              className="relative flex items-center justify-center overflow-hidden transition-all duration-150"
       66 -              style={{
       67 -                flex: shot.duration,
       68 -                minWidth: "50px",
       69 -                height: "60px",
       70 -                borderRadius: "20px",
       71 -                background: "#111111",
       72 -                border: isSelected
       73 -                  ? "2px solid #696969"
       74 -                  : "2px solid transparent",
       75 -                boxShadow: isSelected ? "0 0 10px #69696944" : "none",
       76 -                opacity: isSelected ? 1 : 0.65,
       77 -              }}
       78 -              onMouseEnter={(e) => {
       79 -                if (!isSelected) e.currentTarget.style.opacity = "0.9"
       80 -              }}
       81 -              onMouseLeave={(e) => {
       82 -                if (!isSelected) e.currentTarget.style.opacity = "0.65"
       83 -              }}
       84 -              onClick={() => onSelectShot(shot.id)}
       85 -            >
       86 -              {/* Gradient overlay */}
       87 -              <div
       88 -                className="absolute inset-0 pointer-events-none"
       89 -                style={{
       90 -                  background:
       91 -                    "linear-gradient(to right, rgba(17,17,17,0.6), rgba(17,17,17,0.25))",
      282 +        {/* Zoomed pill strip */}
      283 +        <div
      284 +          className="flex items-center gap-1"
      285 +          style={{ width: zoom === 1 ? "100%" : `${zoom * 100}%`, minWidth: "100%" }}
      286 +        >
      287 +          {shots.map((shot) => {
      288 +            const isSelected = selectedShot === shot.id
      289 +            return (
      290 +              <button
      291 +                key={shot.id}
      292 +                ref={(el) => {
      293 +                  if (el) pillRefs.current.set(shot.id, el)
      294 +                  else pillRefs.current.delete(shot.id)
      295                  }}
       93 -              />
       94 -              <span
       95 -                className="relative z-10"
      296 +                className="relative overflow-hidden transition-all duration-150 shrink-0"
      297                  style={{
       97 -                  fontSize: "10px",
       98 -                  fontWeight: 600,
       99 -                  color: isSelected ? "#FFFFFF" : "#D9D9D9",
      298 +                  flex: shot.duration,
      299 +                  minWidth: "50px",
      300 +                  height: "60px",
      301 +                  borderRadius: "20px",
      302 +                  backgroundSize: "cover",
      303 +                  backgroundPosition: "center",
      304 +                  backgroundColor: "#1A1C25",
      305 +                  border: isSelected ? "2px solid #404556" : "2px solid transparent",
      306 +                  boxShadow: isSelected ? "0 0 10px #40455644" : "none",
      307 +                  opacity: isSelected ? 1 : 0.65,
      308                  }}
      309 +                onMouseEnter={(e) => {
      310 +                  if (!isSelected) e.currentTarget.style.opacity = "0.9"
      311 +                }}
      312 +                onMouseLeave={(e) => {
      313 +                  if (!isSelected) e.currentTarget.style.opacity = "0.65"
      314 +                }}
      315 +                onClick={() => onSelectShot(shot.id)}
      316                >
      102 -                {shot.number}
      103 -              </span>
      104 -            </button>
      105 -          )
      106 -        })}
      107 -        {/* Add shot button */}
      108 -        <button
      109 -          className="flex items-center justify-center shrink-0 transition-colors duration-150"
      110 -          style={{
      111 -            width: "60px",
      112 -            height: "60px",
      113 -            borderRadius: "20px",
      114 -            background: "#111111",
      115 -            border: "1px dashed #696969",
      116 -            color: "#696969",
      117 -          }}
      118 -          onMouseEnter={(e) => (e.currentTarget.style.background = "#343434")}
      119 -          onMouseLeave={(e) => (e.currentTarget.style.background = "#111111")}
      120 -          aria-label="Add shot"
      121 -        >
      122 -          <Plus size={16} />
      123 -        </button>
      317 +                {/* Dark gradient overlay — improves text legibility over thumbnail */}
      318 +                <div
      319 +                  className="absolute inset-0 pointer-events-none"
      320 +                  style={{
      321 +                    background: isSelected
      322 +                      ? "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 100%)"
      323 +                      : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 100%)",
      324 +                  }}
      325 +                />
      326 +
      327 +                {/* Bottom-aligned metadata row */}
      328 +                <div
      329 +                  className="absolute bottom-0 left-0 right-0 flex items-end justify-between pointer-events-none"
      330 +                  style={{ padding: "0 8px 6px" }}
      331 +                >
      332 +                  {/* Shot number + title */}
      333 +                  <span
      334 +                    style={{
      335 +                      fontSize: "9px",
      336 +                      fontWeight: 600,
      337 +                      color: isSelected ? "#FFFFFF" : "#D9D9D9",
      338 +                      whiteSpace: "nowrap",
      339 +                      overflow: "hidden",
      340 +                      textOverflow: "ellipsis",
      341 +                      maxWidth: "70%",
      342 +                      lineHeight: 1.2,
      343 +                    }}
      344 +                  >
      345 +                    {shot.number}&nbsp;&nbsp;{shot.title || "Untitled"}
      346 +                  </span>
      347 +
      348 +                  {/* Duration */}
      349 +                  <span
      350 +                    style={{
      351 +                      fontSize: "9px",
      352 +                      color: isSelected ? "#D9D9D9" : "#777076",
      353 +                      fontVariantNumeric: "tabular-nums",
      354 +                      lineHeight: 1.2,
      355 +                      flexShrink: 0,
      356 +                    }}
      357 +                  >
      358 +                    {shot.duration}s
      359 +                  </span>
      360 +                </div>
      361 +              </button>
      362 +            )
      363 +          })}
      364 +
      365 +          {/* Add shot button */}
      366 +          <button
      367 +            className="flex items-center justify-center shrink-0 transition-colors duration-150"
      368 +            style={{
      369 +              width: "60px",
      370 +              height: "60px",
      371 +              borderRadius: "20px",
      372 +              background: "#111111",
      373 +              border: "1px dashed #404556",
      374 +              color: "#404556",
      375 +            }}
      376 +            onMouseEnter={(e) => (e.currentTarget.style.background = "#252933")}
      377 +            onMouseLeave={(e) => (e.currentTarget.style.background = "#111111")}
      378 +            aria-label="Add shot"
      379 +          >
      380 +            <Plus size={16} />
      381 +          </button>
      382 +        </div>
      383        </div>
      384      </div>
      385    )

⏺ Tasks 2–5 are all implemented in that single file (metadata overlay, thumbnail injection, playhead, control bar). Let me mark them complete and
  run the TypeScript check:

⏺ Bash(bun tsc --noEmit 2>&1 | head -60)
  ⎿  error: Script not found "tsc"

⏺ Bash(cd /Users/manitmishra/Desktop/thelot/v2 && bunx tsc --noEmit 2>&1 | head -80)
  ⎿  components/storyboard/shot-timeline.tsx(21,43): error TS2503: Cannot find namespace 'core'.


⏺ One TS error in the dynamic import. Let me fix the core namespace reference:

⏺ Update(components/storyboard/shot-timeline.tsx)
  ⎿  Added 4 lines, removed 2 lines
      17
      18  async function extractThumbnail(videoUrl: string): Promise<string | null> {
      19    try {
      20 -    const core = await import("@diffusionstudio/core")
      21 -    const source = await core.Source.from<core.VideoSource>(videoUrl)
      20 +    const { Source } = await import("@diffusionstudio/core")
      21 +    // Source.from returns the concrete source type based on the URL
      22 +    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      23 +    const source = await (Source as any).from(videoUrl)
      24      for await (const frame of source.thumbnailsInRange({
      25        start: 0,
      26        end: 1,





⏺ Bash(bunx tsc --noEmit 2>&1 | head -80)
  ⎿  (No output)

⏺ Clean. Now let me verify all edge case guards are in place (Task 6):

⏺ Searched for 3 patterns (ctrl+o to expand)

⏺ All six edge case guards confirmed:

  1. shot.title || "Untitled" — empty title fallback
  2. if (!shot.videoUrl) continue — skip shots without video
  3. if (dur === 0) return — playhead stays at 0 when no duration
  4. if (isCancelled || !dataUrl) return — thumbnail failure handled gracefully (background stays #1A1C25)
  5. minWidth: "50px" — short shots remain readable
  6. thumbnailCache — already-extracted thumbnails injected immediately without re-fetching

❯ Now i want you to remove the video player control from the video preview section and instead make it work with the timeline at the bottom of
  the page

⏺ All 6 tasks complete. TypeScript is clean.

  ---
  Ready for feedback — here's what was implemented:

  Task 1 — Lifted video time state:
  - FramePreview converted to forwardRef, exposes play()/pause() via FramePreviewHandle
  - New props: onVideoTimeUpdate, onVideoPlayStateChange bubble up to StoryboardEditor
  - StoryboardEditor now holds videoCurrentTime, videoTotalDuration, isVideoPlaying state and passes them down to ShotTimeline

  Tasks 2–5 — ShotTimeline rewrite:
  - Control bar: SPLIT · 00:00 / play-pause button / 00:00 · zoom -/slider/+ · FIT
  - Pill metadata: shot number + title (truncated) bottom-left, duration bottom-right, dark gradient overlay
  - Async thumbnails: extracted after paint via pillRefs ref map → direct backgroundImage DOM injection, cached, no re-render
  - Playhead: 1px line + triangle tracked via useEffect → transform: translateX() on a ref, no state updates

  ---
  Now addressing your new request — removing the video player controls from FramePreview and making them work exclusively from the timeline.

  Let me read the current FramePreview to see exactly what to remove:

⏺ Read 1 file (ctrl+o to expand)

⏺ I need to remove the entire playback controls bar from FramePreview and clean up the now-unused state, imports, and canControlPlayback. Let me
  update the file:

⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Removed 4 lines
       2
       3  import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
       4  import {
       5 -  Play,
       6 -  Pause,
       7 -  SkipBack,
       8 -  SkipForward,
       5    ImageIcon,
       6    RefreshCw,
       7    Sparkles,


⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Removed 6 lines
      11  import { SimpsonLoading } from "./loading/simpson-loading"
      12  import { PrincessLoading } from "./loading/princess-loading"
      13
      14 -function formatTime(seconds: number): string {
      15 -  const m = Math.floor(seconds / 60)
      16 -  const s = Math.floor(seconds % 60)
      17 -  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      18 -}
      19 -
      14  const MIN_TOP_PCT = 20
      15  const MAX_TOP_PCT = 70
      16


⏺ Now remove the local playback state that's no longer needed in the JSX, and keep only the callback forwarding:

⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Removed 9 lines
      63    const [startHover, setStartHover] = useState(false)
      64    const [endHover, setEndHover] = useState(false)
      65
      66 -  // Playback state driven by the VideoPlayer composition
      67 -  const [currentTime, setCurrentTime] = useState(0)
      68 -  const [totalDuration, setTotalDuration] = useState(0)
      69 -  const [isPlaying, setIsPlaying] = useState(false)
      66    const playerRef = useRef<VideoPlayerHandle | null>(null)
      71 -  const canControlPlayback = Boolean(videoUrl) && !isVideoLoading
      67
      68    useImperativeHandle(ref, () => ({
      69      play: () => playerRef.current?.play(),
      70      pause: () => playerRef.current?.pause(),
      71    }))
      72
      78 -  useEffect(() => {
      79 -    if (!videoUrl) setIsPlaying(false)
      80 -  }, [videoUrl])
      81 -
      73    /* ── Vertical resize state ─── */
      74    const [topPct, setTopPct] = useState(30)
      75    const [isVDragging, setIsVDragging] = useState(false)

⏺ Now update the VideoPlayer callbacks (no more local state setters, just forward to parent):

⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Added 2 lines, removed 9 lines
      254                <div className="flex-1 relative">
      255                  <VideoPlayer
      256                    videoUrl={videoUrl}
      257 -                  onTimeUpdate={(cur, dur) => {
      258 -                    setCurrentTime(cur)
      259 -                    setTotalDuration(dur)
      260 -                    onVideoTimeUpdate?.(cur, dur)
      261 -                  }}
      262 -                  onPlayStateChange={(playing) => {
      263 -                    setIsPlaying(playing)
      264 -                    onVideoPlayStateChange?.(playing)
      265 -                  }}
      257 +                  onTimeUpdate={(cur, dur) => onVideoTimeUpdate?.(cur, dur)}
      258 +                  onPlayStateChange={(playing) => onVideoPlayStateChange?.(playing)}
      259                    playerRef={playerRef}
      260                  />
      261                  {isVideoLoading && (



⏺ Now remove the entire "Playback controls" div:

⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Removed 124 lines
      265                  )}
      266                </div>
      267
      268 -              {/* Playback controls */}
      269 -              <div
      270 -                className="flex items-center justify-center gap-4"
      271 -                style={{
      272 -                  padding: "10px 12px",
      273 -                  borderTop: "1px solid #232323",
      274 -                }}
      275 -              >
      276 -                <span
      277 -                  style={{
      278 -                    fontSize: "10px",
      279 -                    color: "#696969",
      280 -                    fontVariantNumeric: "tabular-nums",
      281 -                  }}
      282 -                >
      283 -                  {formatTime(currentTime)}
      284 -                </span>
      285 -
      286 -                {/* Progress bar */}
      287 -                <div className="flex-1 relative" style={{ height: "3px" }}>
      288 -                  <div
      289 -                    className="absolute inset-0 rounded-full"
      290 -                    style={{ background: "#232323" }}
      291 -                  />
      292 -                  <div
      293 -                    className="absolute left-0 top-0 h-full rounded-full"
      294 -                    style={{
      295 -                      background: "#696969",
      296 -                      width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
      297 -                    }}
      298 -                  />
      299 -                </div>
      300 -
      301 -                <div className="flex items-center gap-3">
      302 -                  <button
      303 -                    className="transition-colors duration-150"
      304 -                    style={{
      305 -                      color: canControlPlayback ? "#696969" : "#232323",
      306 -                      cursor: canControlPlayback ? "pointer" : "not-allowed",
      307 -                    }}
      308 -                    onMouseEnter={(e) =>
      309 -                      canControlPlayback && (e.currentTarget.style.color = "#ffffff")
      310 -                    }
      311 -                    onMouseLeave={(e) =>
      312 -                      canControlPlayback && (e.currentTarget.style.color = "#696969")
      313 -                    }
      314 -                    onClick={() => {
      315 -                      if (!canControlPlayback) return
      316 -                      playerRef.current?.seek(0)
      317 -                    }}
      318 -                    disabled={!canControlPlayback}
      319 -                    aria-label="Skip back"
      320 -                  >
      321 -                    <SkipBack size={13} />
      322 -                  </button>
      323 -                  <button
      324 -                    className="flex items-center justify-center rounded-full transition-colors duration-150"
      325 -                    style={{
      326 -                      width: "28px",
      327 -                      height: "28px",
      328 -                      background: canControlPlayback ? "#696969" : "#232323",
      329 -                      cursor: canControlPlayback ? "pointer" : "not-allowed",
      330 -                    }}
      331 -                    onMouseEnter={(e) =>
      332 -                      canControlPlayback && (e.currentTarget.style.background = "#7A7A7A")
      333 -                    }
      334 -                    onMouseLeave={(e) =>
      335 -                      canControlPlayback && (e.currentTarget.style.background = "#696969")
      336 -                    }
      337 -                    onClick={() => {
      338 -                      if (!canControlPlayback || !playerRef.current) return
      339 -                      if (isPlaying) {
      340 -                        playerRef.current.pause()
      341 -                        setIsPlaying(false)
      342 -                      } else {
      343 -                        playerRef.current.play()
      344 -                        setIsPlaying(true)
      345 -                      }
      346 -                    }}
      347 -                    disabled={!canControlPlayback}
      348 -                    aria-label={isPlaying ? "Pause" : "Play"}
      349 -                  >
      350 -                    {isPlaying ? (
      351 -                      <Pause size={12} style={{ color: "#000000" }} />
      352 -                    ) : (
      353 -                      <Play
      354 -                        size={12}
      355 -                        style={{ color: "#000000", marginLeft: "1px" }}
      356 -                      />
      357 -                    )}
      358 -                  </button>
      359 -                  <button
      360 -                    className="transition-colors duration-150"
      361 -                    style={{
      362 -                      color: canControlPlayback ? "#696969" : "#232323",
      363 -                      cursor: canControlPlayback ? "pointer" : "not-allowed",
      364 -                    }}
      365 -                    onMouseEnter={(e) =>
      366 -                      canControlPlayback && (e.currentTarget.style.color = "#ffffff")
      367 -                    }
      368 -                    onMouseLeave={(e) =>
      369 -                      canControlPlayback && (e.currentTarget.style.color = "#696969")
      370 -                    }
      371 -                    onClick={() => {
      372 -                      if (!canControlPlayback) return
      373 -                      playerRef.current?.seek(totalDuration)
      374 -                    }}
      375 -                    disabled={!canControlPlayback}
      376 -                    aria-label="Skip forward"
      377 -                  >
      378 -                    <SkipForward size={13} />
      379 -                  </button>
      380 -                </div>
      381 -
      382 -                <span
      383 -                  style={{
      384 -                    fontSize: "10px",
      385 -                    color: "#696969",
      386 -                    fontVariantNumeric: "tabular-nums",
      387 -                  }}
      388 -                >
      389 -                  {isSaving ? "Saving..." : formatTime(totalDuration)}
      390 -                </span>
      391 -              </div>
      268              </div>
      269            </div>
      270          </div>

⏺ Now isSaving prop is no longer used in JSX. Let me also check whether useState and useEffect are still needed in FramePreview:

⏺ Searched for 1 pattern, read 1 file (ctrl+o to expand)

⏺ useEffect is still needed for FrameCard in the same file. But I need to check if isSaving prop usage elsewhere needs cleaning:

⏺ Searched for 1 pattern (ctrl+o to expand)

⏺ isSaving is declared but never used anymore. Let me remove it cleanly from FramePreview and StoryboardEditor:

⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Removed 1 line
      27    startFramePrompt: string
      28    shotTitle: string
      29    videoUrl: string
      30 -  isSaving?: boolean
      30    startFrameImageUrl: string
      31    endFrameImageUrl: string
      32    endFrameFallbackImageUrl: string

⏺ Update(components/storyboard/frame-preview.tsx)
  ⎿  Removed 1 line
      47      startFramePrompt,
      48      shotTitle,
      49      videoUrl,
      50 -    isSaving = false,
      50      startFrameImageUrl,
      51      endFrameImageUrl,
      52      endFrameFallbackImageUrl,

⏺ Update(components/storyboard/storyboard-editor.tsx)
  ⎿  Removed 1 line
      470                    startFramePrompt={activeShot.startFramePrompt}
      471                    shotTitle={activeShot.title}
      472                    videoUrl={activeSimulation.video === "ready" ? activeShot.videoUrl : ""}
      473 -                  isSaving={isPending}
      473                    startFrameImageUrl={startFrameImageUrl}
      474                    endFrameImageUrl={endFrameImageUrl}
      475                    endFrameFallbackImageUrl={startFrameImageUrl}

⏺ Now run TypeScript to verify everything is clean:

⏺ Bash(bunx tsc --noEmit 2>&1)
  ⎿  (No output)

⏺ Clean — no errors. Let me also verify isPending is still used somewhere in StoryboardEditor (since we removed the only place it was passed):

⏺ Searched for 1 pattern (ctrl+o to expand)

⏺ isPending is now unused. Let me remove it from the destructuring:

⏺ Update(components/storyboard/storyboard-editor.tsx)
  ⎿  Added 1 line, removed 1 line
      42
      43  export function StoryboardEditor({ initialScenes }: StoryboardEditorProps) {
      44    const [scenes, setScenes] = useState(initialScenes)
      45 -  const [isPending, startTransition] = useTransition()
      45 +  const [, startTransition] = useTransition()
      46    const [simulationByShot, setSimulationByShot] = useState<Record<string, ShotSimulationState>>({})
      47    const [frameVersionByShot, setFrameVersionByShot] = useState<Record<string, number>>({})
      48    const [selectedScene, setSelectedScene] = useState<string | null>(() => {

⏺ Bash(bunx tsc --noEmit 2>&1)
  ⎿  (No output)

⏺ All clean. Here's a summary of what was done:

  ---
  Video controls moved to timeline — changes:

  frame-preview.tsx:
  - Removed Play, Pause, SkipBack, SkipForward imports
  - Removed formatTime helper (no longer needed)
  - Removed local currentTime, totalDuration, isPlaying state and canControlPlayback
  - Removed the useEffect that reset play state on videoUrl change
  - Removed the entire "Playback controls" bar (skip back / play-pause / skip forward / progress bar / timestamps)
  - Removed isSaving prop entirely
  - VideoPlayer callbacks now forward directly to parent via onVideoTimeUpdate / onVideoPlayStateChange

  storyboard-editor.tsx:
  - Removed isSaving={isPending} from <FramePreview>
  - Changed const [isPending, startTransition] → const [, startTransition]

  The video player area in FramePreview now shows only the video itself (full height, no bottom bar). All playback control lives in the timeline's
  control bar at the bottom of the page.

✻ Brewed for 3m 23s