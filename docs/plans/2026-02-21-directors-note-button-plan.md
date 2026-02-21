# Generate Button Director's Note Implementation Plan

**Goal:** Redesign the Generate Frames/Video button to match the screenplay aesthetic using a "Director's Note" styling.

**Architecture:** Update `ShotDetail` component in `v2/components/storyboard/shot-detail.tsx` to replace the generic pill button with a dashed, monospace, script-annotated style button.

**Tech Stack:** React, Tailwind CSS, inline styles.

---

### Task 1: Update the Generate Button

**Files:**
- Modify: `v2/components/storyboard/shot-detail.tsx`

**Step 1: Write minimal implementation**
Replace the `<button>` element that says "Generate Frames with AI" with the new Director's Note style button that uses dashed borders, `SCREENPLAY_FONT_FAMILY`, and `[ ACTION: ... ]` text formatting.

**Step 2: Commit**
```bash
git add v2/components/storyboard/shot-detail.tsx
git commit -m "feat: redesign generate button to director note style"
```