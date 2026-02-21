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

```bash
git add v2/components/storyboard/shot-timeline.tsx
git commit -m "fix: timeline edge cases — zero duration, empty title, profiler verification"
```
