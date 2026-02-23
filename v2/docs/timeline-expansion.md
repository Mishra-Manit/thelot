# Timeline Redesign Plan

> Complete specification for rebuilding `shot-timeline.tsx` into a proper two-track pill-based timeline with ruler and draggable playhead. No new libraries. No bloat. Pure React + DOM.

---

## What We're Building

A compact, fixed-height timeline sitting at the bottom of the editor. Two horizontal pill tracks stacked vertically — one for video, one for audio. A timecode ruler above both tracks. A thick, draggable playhead that spans ruler + both tracks. All shots for the active scene are rendered as pills simultaneously, and all playable ones are loaded into the composition at once.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  [SPLIT]          0:04 ▶ 0:32          [−] ══════ [+]  [FIT]                  │  ← control bar (28px)
├────────────────────────────────────────────────────────────────────────────────┤
│  0s       5s       10s       15s       20s       25s       30s                 │  ← ruler (20px)
│                    ▼ playhead handle (diamond, 8×8px)                          │
├──────────────────── │ ──────────────────────────────────────────────────────── │
│  ▐████████ Shot 1 ██▌  ▐██████████ Shot 2 ██████▌  ▐████ Shot 3 █▌            │  ← video track (48px)
├──────────────────── │ ──────────────────────────────────────────────────────── │
│  ▐░░░░░░░ audio 1 ░░▌  ▐░░░░░░░░░░ audio 2 ░░░░░▌  ▐░░░░ audio 3 ░▌          │  ← audio track (36px)
└──────────────────── │ ──────────────────────────────────────────────────────── │
                      └── playhead line (2px, full height, spans tracks)
```

**Total timeline height (compact):** ~160px fixed. The resize handle above already controls how much of the screen it takes.

---

## Current Problems to Solve

### 1. Pill ring bug

**Root cause:** The current code uses:
```ts
border: isSelected ? "2px solid #404556" : "2px solid transparent"
```
A transparent border still occupies layout space and, depending on the background rendering context, the browser interpolates the background color beneath it — creating a faint lighter-shade ring on unselected pills.

**Fix:** Replace border-based selection with inset `box-shadow`. Border stays `none` always. Selection ring is drawn entirely inside the pill with no effect on layout:
```ts
border: "none",
boxShadow: isSelected ? "inset 0 0 0 2px #404556" : "none",
```
This is the canonical approach for selection rings on elements with `overflow: hidden` (which pills have, for the thumbnail).

### 2. Single-video composition

Currently `VideoPlayer` accepts a single `videoUrl` and `FramePreview` only loads the selected shot's clip. The user wants all shots in the scene to be simultaneously loaded and playable end-to-end.

**Fix:** Refactor `VideoPlayer` to accept `shots: { id: string; videoUrl: string; duration: number }[]` and build a SEQUENTIAL layer with all shots that have a `videoUrl`. The composition's `duration` becomes the sum of all loaded clips.

### 3. No ruler

Currently there is no timecode display over the track area. Adding one makes the timeline feel like a proper NLE and makes the playhead position legible.

### 4. Playhead is too thin and not draggable

Current playhead is a `1px` line updated via DOM mutation. It has no handle and is not draggable. The new playhead needs to be thick (`2px` line), have a diamond handle in the ruler, and be draggable.

---

## Visual Design Spec

### Color palette (existing)
```
#0D0E14  — deepest background (ruler)
#252933  — track row background
#404556  — borders, inactive ticks
#60515C  — pill border when selected
#777076  — secondary labels, minor ticks
#597D7C  — teal accent (playhead)
#386775  — playhead handle fill
#20504E  — playhead handle border
#FFFFFF  — text on pills, major tick labels
```

### Control bar (28px tall)
- Background: `#000000`
- Left: SPLIT button (placeholder, disabled) — `#252933` bg, `#404556` border
- Center: `0:04 ▶ 0:32` — current time / play button (32px circle, white) / total duration
- Right: `−` slider `+` controls, `FIT` button

### Ruler (20px tall)
- Background: `#0D0E14`
- Major tick (every 5s): `height: 10px`, `color: #777076`, label in 9px font
- Minor tick (every 1s): `height: 5px`, `color: #404556`, no label
- When zoomed: adaptive — at 2x, major ticks every 2s; at 4x, every 1s
- Drawn on a `<canvas>` element for performance — one repaint on zoom change only

### Video track (48px tall)
- Background: `#252933`
- Track label: `V` — 8px, `#404556`, left-side gutter (12px wide)
- Pill height: 44px, `border-radius: 22px`
- Thumbnail background: `source.thumbnailsInRange()` single frame at clip midpoint, set as `backgroundImage`
- Dark gradient overlay: `linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 100%)`
- Shot title: bottom-left, 10px, weight 600, white
- Duration: bottom-right, 10px, `#777076`
- Selection: `boxShadow: "inset 0 0 0 2px #60515C"` + `opacity: 1`
- Unselected: `opacity: 0.60`, no box shadow

### Audio track (36px tall)
- Background: `#1A1C25` (slightly darker than video track)
- Track label: `A` — 8px, `#404556`, same left gutter
- Pill height: 32px, `border-radius: 16px`
- No thumbnail — solid background: `#252933`
- Subtle waveform bars: NOT drawn (too expensive for v1). Placeholder: a row of 2px-wide thin vertical bars at 40% opacity drawn on a canvas, representing amplitude peaks. Can be a static pattern based on clip index for now — or deferred entirely.
- Shot title: vertically centered, 9px, `#777076`
- Audio track shows the same shots as video track (same durations, same positions)
- Selection: `boxShadow: "inset 0 0 0 2px #404556"`

### Playhead
- Line: `2px` wide, `background: #597D7C` (teal)
- Handle: sits in the ruler. An 8×8px rotated square (CSS `transform: rotate(45deg)`) — a diamond — centered on the line. `background: #386775`, `border: 1.5px solid #20504E`
- The line extends through both track rows with a `z-index` above pills
- Draggable: mousedown on the diamond → mousemove tracks X → seeks composition

### Gap between pills
- `gap: 4px` between pills in the same track row

---

## Component Structure (Single File)

All internal to `shot-timeline.tsx`. No new files. No exported sub-components.

```
ShotTimeline (root)
├─ state: zoom, isDraggingPlayhead, thumbnailCache
├─ refs: containerRef, rulerCanvasRef, playheadRef, trackRef
│
├─ <ControlBar>          — local function, not exported
├─ <div ruler-row>
│   ├─ <canvas> rulerCanvas  — tick marks
│   └─ <PlayheadHandle>      — diamond, draggable
├─ <div tracks-area>
│   ├─ <TrackRow type="video">
│   │   └─ shots.map → <ShotPill>
│   └─ <TrackRow type="audio">
│       └─ shots.map → <ShotPill>
└─ <div playhead-line>   — absolute, full-height, translateX via ref
```

Target: **~350 lines** total (down from the current 530, despite more functionality, because the pill approach is cleaner and no inline `<style>` tag needed).

---

## Data Flow and Positioning

### Computing pill positions

Each shot is assigned a start offset equal to the sum of all preceding shots' durations:

```ts
// Computed once per shots array change
interface ShotLayout {
  shot: StoryboardShot
  startSec: number   // accumulated offset
  widthPct: number   // width as % of totalDuration
  leftPct: number    // left offset as % of totalDuration
}

function computeLayout(shots: StoryboardShot[]): ShotLayout[] {
  let cursor = 0
  return shots.map((shot) => {
    const layout = {
      shot,
      startSec: cursor,
      leftPct: totalDuration > 0 ? (cursor / totalDuration) * 100 : 0,
      widthPct: totalDuration > 0 ? (shot.duration / totalDuration) * 100 : 0,
    }
    cursor += shot.duration
    return layout
  })
}

const totalDuration = shots.reduce((sum, s) => sum + s.duration, 0)
```

Pills are rendered with `position: absolute`, `left: layout.leftPct + "%"`, `width: layout.widthPct + "%"`. The track row is `position: relative`.

### Zoom

Zoom multiplies the track width. At `zoom: 1`, track is `100%` of container. At `zoom: 2`, track is `200%` and the container scrolls horizontally.

```ts
// pill left
left: `${layout.leftPct}%`     // unchanged — percent of track width
// track width
width: `${zoom * 100}%`         // track div expands, container scrolls
```

The ruler canvas redraws when `zoom` changes using `requestAnimationFrame`.

### Playhead positioning

Playhead `translateX` maps `currentTime → pixels`:

```ts
// Called on every 'playback:time' event via direct DOM mutation (no re-render)
const offset = (currentTime / effectiveDuration) * trackScrollWidth
playheadRef.current.style.transform = `translateX(${offset}px)`
```

`trackScrollWidth = trackRef.current.scrollWidth` — accounts for zoom.

---

## Architecture Change: Multi-Clip VideoPlayer

### Current

`VideoPlayer` props:
```ts
{ videoUrl: string; onTimeUpdate; onPlayStateChange; playerRef }
```
Loads one `VideoClip` from one URL.

### New

`VideoPlayer` props:
```ts
{ shots: { id: string; videoUrl: string; duration: number }[]; ... }
```

Internal change inside `VideoPlayer`:
1. Create `new Composition(...)` with a SEQUENTIAL layer
2. For each shot where `videoUrl` is non-empty: `Source.from(videoUrl)` → `new VideoClip(source, { position: 'center', width: '100%' })`
3. Add all clips to the sequential layer
4. Fire `onTimeUpdate(time, composition.duration)` on `'playback:time'`

The composition's `duration` is now the sum of all loaded clips. Shots with no `videoUrl` are skipped.

### Seeking to a specific shot

From `StoryboardEditor`, clicking a pill calls `onSelectShot(shotId)` which:
1. Updates `selectedShot` state (for UI highlighting)
2. Also calls `framePreviewRef.current?.seek(shotStartSec)` where `shotStartSec` is the accumulated offset of that shot in the composition

`StoryboardEditor` already knows this offset because it computed the layout. We expose this via a new handler:
```ts
const handleSelectShot = useCallback((shotId: string) => {
  setSelectedShot(shotId)
  // Find layout offset for this shot
  const layout = computeLayout(activeScene.shots).find(l => l.shot.id === shotId)
  if (layout) framePreviewRef.current?.seek(layout.startSec)
}, [activeScene])
```

### Prop threading in StoryboardEditor

Change line 482 in `storyboard-editor.tsx`:
```ts
// Before
videoUrl={activeSimulation.video === "ready" ? activeShot.videoUrl : ""}

// After — pass all scene shots with their ready state
shots={activeScene.shots.map(s => ({
  id: s.id,
  videoUrl: simulationByShot[s.id]?.video === "ready" ? s.videoUrl : "",
  duration: s.duration,
}))}
```

---

## Playhead Drag Mechanics

The diamond handle sits in the ruler div. It is the sole drag target.

```ts
// On mousedown on the diamond handle:
const handlePlayheadDragStart = (e: React.MouseEvent) => {
  e.preventDefault()
  const trackEl = trackRef.current
  if (!trackEl) return

  const onMove = (ev: MouseEvent) => {
    const rect = trackEl.getBoundingClientRect()
    const scrollLeft = trackEl.scrollLeft
    const x = ev.clientX - rect.left + scrollLeft
    const clamped = Math.max(0, Math.min(x, trackEl.scrollWidth))
    const seekTime = (clamped / trackEl.scrollWidth) * effectiveDuration
    onSeek(seekTime)
    // Also update playhead immediately via DOM for smoothness
    if (playheadRef.current) {
      playheadRef.current.style.transform = `translateX(${clamped}px)`
    }
  }

  const onUp = () => {
    window.removeEventListener("mousemove", onMove)
    window.removeEventListener("mouseup", onUp)
  }

  window.addEventListener("mousemove", onMove)
  window.addEventListener("mouseup", onUp)
}
```

Click-to-seek on the ruler (not the diamond) also works — same math, no drag state needed.

---

## Ruler Drawing

The ruler is a `<canvas>` painted via a `useEffect` that reruns when `zoom` or `totalDuration` changes. Drawing happens with `requestAnimationFrame`.

```ts
function drawRuler(canvas: HTMLCanvasElement, totalDuration: number, zoom: number) {
  const ctx = canvas.getContext("2d")!
  const dpr = window.devicePixelRatio ?? 1
  const w = canvas.clientWidth * zoom
  const h = canvas.clientHeight

  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, w, h)

  // Adaptive tick interval based on zoom and totalDuration
  const pxPerSec = (canvas.clientWidth * zoom) / totalDuration
  const majorInterval = pxPerSec >= 80 ? 1 : pxPerSec >= 40 ? 2 : pxPerSec >= 20 ? 5 : 10
  const minorInterval = majorInterval / 5  // may be fractional — skip if < 1s

  ctx.fillStyle = "#0D0E14"
  ctx.fillRect(0, 0, w, h)

  for (let t = 0; t <= totalDuration; t += minorInterval) {
    const x = (t / totalDuration) * w
    const isMajor = Number.isInteger(t / majorInterval)

    ctx.beginPath()
    ctx.moveTo(x, h)
    ctx.lineTo(x, isMajor ? h - 10 : h - 5)
    ctx.strokeStyle = isMajor ? "#777076" : "#404556"
    ctx.lineWidth = 1
    ctx.stroke()

    if (isMajor) {
      ctx.fillStyle = "#777076"
      ctx.font = "9px system-ui, sans-serif"
      ctx.fillText(formatTime(t), x + 3, h - 12)
    }
  }
}
```

The canvas width is set to `containerWidth * zoom` and the container `overflow-x: auto` scrolls it. This keeps the ruler pixel-perfectly aligned with the track pills beneath it.

---

## Thumbnail Strategy

- Extract ONE thumbnail per pill (the midpoint frame of each shot)
- Use `source.thumbnailsInRange({ start: midpoint, end: midpoint + 0.1, count: 1, width: 200, height: 80 })`
- Cache by `shot.id` in a `useRef<Map<string, string>>` (same as current)
- Apply as `backgroundImage` on the pill via direct DOM update to avoid re-renders
- Only fire for shots with a `videoUrl` — skip the rest

This is exactly what the current implementation does. No change needed here, just the pill selection ring fix.

---

## Interaction Model

| Action | Result |
|--------|--------|
| Click a video pill | `onSelectShot(shotId)` → highlights pill, seeks composition to shot start |
| Click the audio pill | Same as clicking the corresponding video pill (same `shotId`) |
| Click ruler (not handle) | Seeks to clicked time position |
| Drag playhead diamond | Seeks continuously while dragging |
| Space key | Play / pause (wired in the control bar) |
| Zoom slider | Scales both ruler and track width, scrolls horizontally |
| FIT button | Resets zoom to 1 |

---

## Props Interface (unchanged from current, except VideoPlayer)

`ShotTimeline` props stay the same — this is important because `StoryboardEditor` already passes these:

```ts
interface ShotTimelineProps {
  shots: StoryboardShot[]          // all shots for active scene
  selectedShot: string | null      // highlighted pill
  sceneNumber: number
  onSelectShot: (shotId: string) => void
  currentTime: number              // from composition 'playback:time'
  totalDuration: number            // from composition.duration
  isPlaying: boolean
  onPlayPause: () => void
  onSeek: (seconds: number) => void
}
```

Only `VideoPlayer` changes its props (see architecture section above).

---

## Files to Touch

| File | Change |
|------|--------|
| `shot-timeline.tsx` | Full rewrite — ruler + two tracks + new playhead |
| `video-player.tsx` | Accept `shots[]` instead of single `videoUrl`, build sequential composition |
| `frame-preview.tsx` | Pass `shots[]` prop down to `VideoPlayer` instead of `videoUrl` |
| `storyboard-editor.tsx` | Pass all scene shots to `FramePreview`, update `handleSelectShot` to seek |
| `storyboard-types.ts` | No changes needed |

---

## Implementation Order

1. **Fix the pill ring bug first** — swap `border: transparent` for `boxShadow: inset` in the current code. One-line change, immediately visible.

2. **Rewrite `ShotTimeline`** — new two-track layout, ruler, playhead. Use `shot.duration` for pill widths. `currentTime` and `totalDuration` props stay the same — the component doesn't care if they come from a single-clip or multi-clip composition.

3. **Refactor `VideoPlayer`** — change `videoUrl: string` → `shots: ShotInput[]`. The SEQUENTIAL layer means the composition naturally plays all clips end-to-end. The `duration` emitted to `onTimeUpdate` is now the full scene duration.

4. **Thread the changes up** — update `FramePreview` → `StoryboardEditor`. Update `handleSelectShot` in the editor to also seek.

5. **Test** — with no videos, with some videos, with all videos. Verify the playhead tracks, pills highlight correctly, zoom works.

---

## What We Are NOT Building (Descoped)

| Feature | Reason |
|---------|--------|
| Audio waveforms | Requires `audioSource.decode()` which is async and expensive per clip. Static placeholder pattern for now. |
| Clip trimming | Drag handles on pill edges. Deferred — no `clip.trim()` integration yet. |
| Clip splitting | SPLIT button is already a placeholder. Wire up `clip.split()` separately. |
| Drag-to-reorder clips | Requires `layer.relocate()`. Deferred. |
| Undo / redo | Requires command stack. Deferred. |
| Speed control | Permanently descoped. WebCodecs does not support rate changes. |

---

## Line Count Target

| Section | Est. Lines |
|---------|-----------|
| Imports + types | 20 |
| `formatTime` util | 8 |
| `computeLayout` util | 15 |
| `drawRuler` function | 40 |
| `thumbnailExtract` function | 18 |
| `ShotTimeline` component state + refs + effects | 80 |
| `ControlBar` local component | 50 |
| Ruler + playhead render | 40 |
| Video track row render | 40 |
| Audio track row render | 30 |
| `ShotPill` local component | 45 |
| **Total** | **~386 lines** |

This is 30% shorter than the current 530-line implementation while delivering more functionality.
