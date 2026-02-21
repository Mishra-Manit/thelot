# Living Script Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the `ShotDetail` component into a screenplay-style document UI by restyling existing components.

**Architecture:** CSS-only formatting updates to `EditorBlock` and `ShotDetail` sections to create an immersive reading and editing experience that visually distinguishes Action, Monologue, and Camera Notes.

**Tech Stack:** React, Tailwind CSS, Inline Styles

---

### Task 1: Refactor EditorBlock for Hover Discovery

**Files:**
- Modify: `v2/components/storyboard/shot-detail.tsx`

**Step 1: Update EditorBlock styling**
Modify `EditorBlock` to remove the default `group-hover:bg-[#ffffff04]` background and left accent border, making it a clean canvas. Update the drag handle and label to fade in on hover.

**Step 2: Verify changes**
Run the dev server and hover over blocks to ensure the background remains clean but the handle/label fades in.

**Step 3: Commit**
```bash
git add v2/components/storyboard/shot-detail.tsx
git commit -m "feat: refactor EditorBlock for clean canvas and hover discovery"
```

### Task 2: Style Action & Internal Monologue Blocks

**Files:**
- Modify: `v2/components/storyboard/shot-detail.tsx`

**Step 1: Update Action Block**
Ensure the Action block uses a standard readable font and full width, with no background.

**Step 2: Update Internal Monologue Block**
- Remove the grey background and left border.
- Add an un-editable `CHARACTER (V.O.)` label centered above the textarea.
- Indent the `AutoTextarea` by 20% on left and right (`margin: "0 20%"`).
- Make the text centered.

**Step 3: Verify changes**
Check the UI to ensure Action looks like standard screenplay action, and Monologue looks like centered screenplay dialogue.

**Step 4: Commit**
```bash
git add v2/components/storyboard/shot-detail.tsx
git commit -m "feat: style Action and Monologue blocks to match screenplay format"
```

### Task 3: Style Camera Notes & Director's Notes

**Files:**
- Modify: `v2/components/storyboard/shot-detail.tsx`

**Step 1: Update Camera Notes Block**
- Remove the dark background and border.
- Add a static `[CAMERA]` prefix before the textarea or as part of the styling.
- Make the text monospace or italic to distinguish it.

**Step 2: Rename AI Generation Prompts**
- Change the header text "AI Generation Prompts" to "🎬 DIRECTOR'S NOTES".
- Maintain its current subtle styling to separate it from the screenplay text.

**Step 3: Verify changes**
Check that Camera Notes look like technical directions and the Director's Notes section is clearly separated.

**Step 4: Commit**
```bash
git add v2/components/storyboard/shot-detail.tsx
git commit -m "feat: style Camera Notes and update Director's Notes header"
```