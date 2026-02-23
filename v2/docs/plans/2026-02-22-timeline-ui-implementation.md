# Timeline UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the approved minimalist, full-width timeline design with black theme and integrated controls.

**Architecture:** Refactor `ShotTimeline` to include a header bar and use full-width layout. Update `StoryboardEditor` to remove container padding.

**Tech Stack:** React, Tailwind CSS, Lucide Icons.

---

### Task 1: Update Editor Layout

**Files:**
- Modify: `v2/components/storyboard/storyboard-editor.tsx`

**Step 1: Remove padding from timeline container**

In `v2/components/storyboard/storyboard-editor.tsx`, locate the div wrapping `ShotTimeline`.

```typescript:v2/components/storyboard/storyboard-editor.tsx
// ...
        {/* Full-width timeline spanning entire bottom */}
        {activeScene && (
          <div
            className="min-h-0"
            style={{
              flex: `0 0 ${timelinePct}%`,
              padding: "0", // Changed from "0 12px 12px"
            }}
          >
            <ShotTimeline
// ...
```

**Step 2: Verify layout**
- Run the app and check that the timeline container spans the full width of the pane.

**Step 3: Commit**
```bash
git add v2/components/storyboard/storyboard-editor.tsx
git commit -m "style(storyboard): remove padding from timeline container"
```

### Task 2: Refactor Timeline Structure & Styling

**Files:**
- Modify: `v2/components/storyboard/shot-timeline.tsx`

**Step 1: Update Container Styles**

In `ShotTimeline` component:
- Remove `rounded-xl` class.
- Change background to `#000000`.
- Remove padding.

```typescript:v2/components/storyboard/shot-timeline.tsx
    <div
      ref={containerRef}
      className="h-full min-h-0 flex flex-col" // Removed rounded-xl
      style={{ background: "#000000", padding: "0" }} // Removed padding
    >
```

**Step 2: Update Header Bar**

- Change `mb-2` to `border-b border-[#252933]`.
- Adjust height if needed (keep `h-10` or similar).
- Ensure padding `px-4` for the header content.

```typescript:v2/components/storyboard/shot-timeline.tsx
      {/* Control Bar */}
      <div className="flex items-center gap-4 h-10 px-4 border-b border-[#252933] shrink-0 bg-black">
        {/* ... existing buttons ... */}
```

**Step 3: Update Timeline Area**

- Ensure `flex-1` and `overflow-hidden`.
- Background `#000000`.

```typescript:v2/components/storyboard/shot-timeline.tsx
      {/* Timeline Area */}
      {shots.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-black" style={{ color: "#404556", fontSize: "12px" }}>
          No shots in this scene
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-black">
          {/* Ruler Row */}
          <div className="flex shrink-0 border-b border-[#252933]" style={{ height: "24px", background: "#000000" }}>
             {/* ... */}
          </div>

          {/* Tracks Container */}
          <div
            ref={trackRef}
            className="flex-1 min-h-0 flex flex-col relative overflow-x-auto bg-black"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#404556 #000000" }}
            onClick={handleSeekClick}
          >
            {/* Video Track */}
            <div className="flex shrink-0 border-b border-[#252933]" style={{ height: "64px", background: "#000000" }}>
              {/* ... */}
            </div>

            {/* Audio Track */}
            <div className="flex shrink-0" style={{ height: "40px", background: "#000000" }}>
              {/* ... */}
            </div>
             {/* ... */}
          </div>
        </div>
      )}
```

**Step 4: Update Ruler Drawing**

- In `drawRuler` function:
    - Change background `ctx.fillStyle` to `#000000` (or transparent).
    - Update height to match new ruler height (24px).

```typescript:v2/components/storyboard/shot-timeline.tsx
// ...
  const h = 24 // Updated height
// ...
  // Background
  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, w, h)
// ...
```

**Step 5: Verify**
- Check that the timeline looks correct: black background, full width, integrated header.

**Step 6: Commit**
```bash
git add v2/components/storyboard/shot-timeline.tsx
git commit -m "feat(timeline): implement minimalist full-width design with black theme"
```

### Task 3: Polish Controls & Tracks

**Files:**
- Modify: `v2/components/storyboard/shot-timeline.tsx`

**Step 1: Update Track Labels**
- Ensure "V" and "A" labels have correct background/color.

**Step 2: Update Shot Pills**
- Ensure they contrast well against the black background.
- Current styling should work, but verify `backgroundColor` is appropriate.

**Step 3: Commit**
```bash
git add v2/components/storyboard/shot-timeline.tsx
git commit -m "style(timeline): polish track labels and shot pills"
```
