# Toast System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a "Generating frames..." / "Generating video..." toast (top-right, auto-dismiss 3s) when generation starts in the storyboard editor.

**Architecture:** Wire up the existing Sonner wrapper into the root layout, restyle it to the monochrome palette, and add a `toast()` call inside the two generation handlers in `storyboard-editor.tsx`.

**Tech Stack:** `sonner` v1.7.1, Tailwind CSS v4, React 19

---

### Task 1: Restyle `components/ui/sonner.tsx`

The current file uses `useTheme` from `next-themes`, but there is no `ThemeProvider` in the layout. The app sets `className="dark"` on `<html>` directly, so we hardcode `theme="dark"`.

**Files:**
- Modify: `v3/components/ui/sonner.tsx`

**Step 1: Replace the file contents**

```tsx
'use client'

import { Toaster as Sonner } from 'sonner'

const Toaster = () => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      duration={3000}
      style={
        {
          '--normal-bg': '#111111',
          '--normal-border': '#232323',
          '--normal-text': '#ffffff',
        } as React.CSSProperties
      }
    />
  )
}

export { Toaster }
```

**Step 2: Verify TypeScript passes**

Run: `cd v3 && bunx tsc --noEmit`
Expected: no errors on `sonner.tsx`

**Step 3: Commit**

```bash
git add v3/components/ui/sonner.tsx
git commit -m "feat: restyle Sonner toaster to monochrome palette"
```

---

### Task 2: Add `<Toaster />` to root layout

**Files:**
- Modify: `v3/app/layout.tsx`

**Step 1: Add the import and component**

Add `import { Toaster } from '@/components/ui/sonner'` to the imports block (after the Analytics import).

Add `<Toaster />` inside `<body>`, after `{children}` and before `<Analytics />`:

```tsx
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Inter, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

// ... font config unchanged ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
```

**Step 2: Verify TypeScript passes**

Run: `cd v3 && bunx tsc --noEmit`
Expected: no errors on `layout.tsx`

**Step 3: Commit**

```bash
git add v3/app/layout.tsx
git commit -m "feat: add Toaster to root layout"
```

---

### Task 3: Add `toast()` calls to generation handlers

**Files:**
- Modify: `v3/components/storyboard/storyboard-editor.tsx`

**Step 1: Add the `toast` import**

The imports block starts at line 3. Add `toast` from `sonner` after the existing imports:

```ts
import { toast } from 'sonner'
```

**Step 2: Add toast call inside `handleGenerateFrames`**

`handleGenerateFrames` starts at line 190. Add `toast('Generating frames...')` as the first line of the function body, right after the early return guard:

```ts
const handleGenerateFrames = useCallback(
  (shotId?: string) => {
    const targetShotId = shotId ?? selectedShot
    if (!targetShotId) return

    toast('Generating frames...')   // <-- add this line

    setFrameVersionByShot((prev) => ({ ...prev, [targetShotId]: Date.now() }))
    // ... rest unchanged
  },
  [clearSimulationTimer, selectedShot, updateSimulationState]
)
```

**Step 3: Add toast call inside `handleGenerateVideo`**

`handleGenerateVideo` starts at line 221. Add `toast('Generating video...')` after the two early-return guards:

```ts
const handleGenerateVideo = useCallback(
  (shotId?: string) => {
    const targetShotId = shotId ?? selectedShot
    if (!targetShotId) return
    const shotSimulation = simulationByShot[targetShotId] ?? DEFAULT_SIMULATION_STATE
    if (shotSimulation.frames !== 'ready') return

    toast('Generating video...')   // <-- add this line

    clearSimulationTimer(targetShotId, 'video')
    // ... rest unchanged
  },
  [clearSimulationTimer, selectedShot, simulationByShot, updateSimulationState]
)
```

**Step 4: Verify TypeScript passes**

Run: `cd v3 && bunx tsc --noEmit`
Expected: no errors

**Step 5: Commit**

```bash
git add v3/components/storyboard/storyboard-editor.tsx
git commit -m "feat: trigger toast on frame and video generation"
```

---

## Verification

After all tasks are complete:

1. Run `cd v3 && bun dev`
2. Open the storyboard editor
3. Click a "Generate frames" button — expect `"Generating frames..."` toast top-right, auto-dismisses after 3s
4. Once frames are ready, click "Generate video" — expect `"Generating video..."` toast
5. Confirm the toast background is `#111111` with white text and `#232323` border
