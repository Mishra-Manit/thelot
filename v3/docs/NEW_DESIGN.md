# NEW DESIGN: Guided Storyboard + Video Editor

## Context

This document defines the complete UI/UX redesign for The Lot's storyboard and video editor. The goal is to transform the current "power-user filmmaker tool" into a **guided, intuitive production pipeline** that non-technical, creative users can navigate without prior filmmaking knowledge.

**Target user:** Authors, screenwriters, and creative people who have a written story and want to turn it into a movie. They are artistic but not technical. They need the interface to tell them what to do next.

**Core insight from feedback:** Users cannot tell the structured workflow of `script → start frame → video generation`. They don't know they can regenerate frames. The page doesn't communicate sequence or progress.

---

## Design Principles

1. **Every screen answers "what do I do next?" within 2 seconds**
2. **Left = Story (writing), Right = Production (visuals/actions)** — consistent across every state
3. **One primary CTA per state** — never more than one big action button visible
4. **Progressive disclosure** — simple by default, advanced on toggle
5. **Progress is always visible** — status dots, progress bars, step indicators

---

## Color System

Inherited from `globals.css` theme tokens. Key additions for the new design:

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg-base` | `#000000` | Page background |
| `--color-surface` | `#111111` | Cards, panels |
| `--color-surface-hover` | `#232323` | Hover states |
| `--color-lot-border` | `#232323` | Default borders |
| `--color-border-hover` | `#696969` | Active/hover borders |
| `--color-text-primary` | `#ffffff` | Headings, active text |
| `--color-text-secondary` | `#D9D9D9` | Body text |
| `--color-text-tertiary` | `#696969` | Labels, muted text |
| `--color-step-active` | `#386775` | Active workflow step (Teal) |
| `--color-step-complete` | `#20504E` | Completed workflow step (Deep Teal) |
| `--color-step-idle` | `#696969` | Inactive workflow step |

---

## Typography

From `layout.tsx`:
- **Inter** (`--font-inter`) — body text, labels, descriptions
- **Outfit** (`--font-outfit`) — headings, buttons, CTAs
- **IBM Plex Mono** (`--font-ibm-plex-mono`) — screenplay text, code-like elements, prompts

---

## Tech Stack (already in v3)

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **tw-animate-css**
- **Framer Motion** for animations
- **Radix UI** primitives (already installed: tabs, progress, tooltip, dialog, etc.)
- **Lucide React** for icons
- **@diffusionstudio/core** for browser-based video compositing
- **Drizzle ORM** + **PostgreSQL** for persistence
- **Bun** as runtime and package manager

---

## Information Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Project Title  |  Global Actions               Share  │
├──────────┬──────────────────────────────────────────────────────┤
│ Sidebar  │  Left Panel (Script)  │  Right Panel (Production)   │
│          │                       │                              │
│ Scenes   │  Screenplay-style     │  Workflow Stepper ① ② ③ ④  │
│ + Shots  │  text editor for      │  + Context-dependent content │
│ + Status │  narrative content    │  based on active step        │
│          │                       │                              │
├──────────┴──────────────┴────────┴──────────────────────────────┤
│  Timeline: Shot pills with thumbnails + playback controls       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### New / Rewritten Components

```
components/storyboard/
├── storyboard-editor.tsx      # Root orchestrator (rewrite)
├── header-bar.tsx             # Top bar (minor updates)
├── scene-sidebar.tsx          # Left sidebar: scenes + shots + status dots (rewrite of scene-list.tsx)
├── script-panel.tsx           # Left panel: screenplay editor (rewrite of shot-detail.tsx)
├── production-panel.tsx       # Right panel: workflow stepper + step content (rewrite of frame-preview.tsx)
├── workflow-stepper.tsx       # NEW: horizontal ① ② ③ ④ step indicator
├── step-script.tsx            # NEW: Step 1 content — script summary view
├── step-frames.tsx            # NEW: Step 2 content — frame generation + preview
├── step-video.tsx             # NEW: Step 3 content — video generation + playback
├── step-polish.tsx            # NEW: Step 4 content — voice gen + lip sync
├── shot-timeline.tsx          # Bottom timeline (simplify + add simple/advanced toggle)
├── video-player.tsx           # Keep as-is (wraps @diffusionstudio/core)
├── empty-states.tsx           # NEW: onboarding empty states for each context
├── shot-status-dot.tsx        # NEW: ○ ◐ ● status indicator
└── loading/
    ├── spongebob-loading.tsx  # Keep
    ├── simpson-loading.tsx    # Keep
    └── princess-loading.tsx   # Keep
```

### Shared UI Components (already available via shadcn)

Use existing Radix-based components from `components/ui/`:
- `tabs.tsx` — for the workflow stepper
- `progress.tsx` — for scene/project progress bars
- `tooltip.tsx` — for contextual hints
- `dialog.tsx` — for media library overlay
- `button.tsx` — for CTAs
- `separator.tsx` — for visual dividers

---

## Detailed Wireframes & Specifications

### Three-Level Editing Hierarchy

The UI supports three distinct editing levels, each with its own context and controls:

1. **Movie Level (State 1)** — Edit the entire movie
   - View: All scenes stitched together
   - Timeline: Scene-level pills
   - Controls: Soundtrack, color grading, export
   - Video Preview: Full movie composite
   - Navigation: Select a scene → drill down to Scene Level

2. **Scene Level (State 2)** — Edit a specific scene
   - View: All shots within the selected scene
   - Timeline: Shot-level pills (for this scene only)
   - Controls: Scene audio mix, timing, shot reordering
   - Video Preview: Scene composite (all shots in scene)
   - Navigation: Select a shot → drill down to Shot Level, or ← back to Movie Level

3. **Shot Level (States 3-6)** — Edit an individual shot
   - View: Single shot with workflow steps (Script → Frame → Video → Polish)
   - Timeline: Shot-level pills (all shots in scene, with current shot highlighted)
   - Controls: Shot-specific generation and editing (frames, video, polish)
   - Video Preview: Individual shot video
   - Navigation: Select another shot, or ← back to Scene Level

**Key Design Principle:** Each level uses a **split panel layout** with the left panel showing metadata/content and the right panel showing video preview + level-specific controls. This consistency makes the hierarchy intuitive.

---

### State 1: Movie-Level Editing — Full Movie Overview

**Editing Level:** Movie (all scenes, all shots)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← The Lot                                          ⚙  👤  Share     │
├────────┬──────────────────────────┬──────────────────────────────────┤
│        │                          │                                  │
│ SCENES │   MOVIE OVERVIEW         │   FULL MOVIE PREVIEW             │
│        │                          │                                  │
│ ┌────┐ │   "Desert Awakening"     │  ┌─────────────────────────────┐ │
│ │ 1  │ │   5 scenes · 12 shots    │  │                             │ │
│ │Dune│ │   Total: 2m 34s          │  │    ░░░░░░░░░░░░░░░░░░░░     │ │
│ └────┘ │                          │  │    ░░  🎬 FULL MOVIE ░░     │ │
│ ┌────┐ │   Scene Breakdown:       │  │    ░░    PREVIEW     ░░     │ │
│ │ 2  │ │                          │  │    ░░░░░░░░░░░░░░░░░░░░     │ │
│ │Cave│ │   1. Dunes      ●● 32s   │  │                             │ │
│ └────┘ │   2. Cave       ◐○ 28s   │  │  ▶ 0:00 ━━━━●━━━━━━━ 2:34   │ │
│ ┌────┐ │   3. City       ●●● 45s  │  └─────────────────────────────┘ │
│ │ 3  │ │   4. Flight     ○○ 38s   │                                  │
│ │City│ │   5. Battle     ○ 11s    │  Movie-level controls:           │
│ └────┘ │                          │  ┌─────────────────────────────┐ │
│ ┌────┐ │   Overall Progress:      │  │ 🎵 Add Soundtrack           │ │
│ │ 4  │ │   ████████░░░░░░ 58%     │  │ 🎨 Color Grading            │ │
│ │Fly │ │                          │  │ 📤 Export Full Movie        │ │
│ └────┘ │   ┌──────────────────┐   │  └─────────────────────────────┘ │
│ ┌────┐ │   │ Select a scene   │   │                                  │
│ │ 5  │ │   │ to edit →        │   │  ← Select a scene to drill down  │
│ │War │ │   └──────────────────┘   │     into scene-level editing     │
│ └────┘ │                          │                                  │
│ [+ Add │                          │                                  │
│ Scene] │                          │                                  │
├────────┴──────────────────────────┴──────────────────────────────────┤
│  ▶  [Scene 1 ████][Scene 2 ███][Scene 3 █████][Scene 4 ████][S5 ██]  │
│     0:00          0:32         1:00          1:45       2:23   2:34  │
└──────────────────────────────────────────────────────────────────────┘
```

**Component:** `empty-states.tsx` → `<MovieOverviewState />`

**Behavior:**
- **Left Panel:** Movie-level metadata and scene list with aggregate status
  - Shows total duration, scene count, shot count
  - Lists all scenes with their status dots (aggregated from shots) and duration
  - Overall progress bar shows completion percentage
  - Call-to-action to select a scene
- **Right Panel:** Full movie video preview
  - Composite video player showing all scenes stitched together
  - Movie-level editing controls (soundtrack, color grading, export)
  - Prompts user to select a scene for detailed editing
- **Timeline:** Shows scene-level pills (not individual shots)
  - Each pill represents an entire scene
  - Clicking a scene pill OR sidebar scene transitions to State 2
- **Sidebar:** All scenes visible with status indicators

---

### State 2: Scene-Level Editing — Scene Overview with Shots

**Editing Level:** Scene (all shots within selected scene)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← The Lot                                          ⚙  👤  Share     │
├────────┬──────────────────────────┬──────────────────────────────────┤
│        │                          │                                  │
│ ← All  │   SCENE 3: "CITY"        │   SCENE PREVIEW                  │
│        │                          │                                  │
│ Scene 3│   4 shots · 32s total    │  ┌─────────────────────────────┐ │
│ "City" │   Status: ◐ In Progress  │  │                             │ │
│ 4 shots│                          │  │    ░░░░░░░░░░░░░░░░░░░░     │ │
│ 32s    │   Shot Breakdown:        │  │    ░░  🎬 SCENE 3    ░░     │ │
│────────│                          │  │    ░░  ALL SHOTS     ░░     │ │
│        │   ┌──────────────────┐   │  │    ░░░░░░░░░░░░░░░░░░░░     │ │
│ ○ 1.   │   │  Shot 1   ○ 8s   │   │  │                             │ │
│ Dunes  │   │  Wide establishing   │  │  ▶ 0:00 ━━━━●━━━━━━━ 0:32   │ │
│        │   └──────────────────┘   │  └─────────────────────────────┘ │
│ ◐ 2.   │   ┌──────────────────┐   │                                  │
│ Close  │   │  Shot 2   ◐ 6s   │   │  Scene-level controls:           │
│        │   │  Character close │  │  ┌──────────────────────────────┐ │
│ ● 3.   │   └──────────────────┘   │  │ 🎵 Scene Audio Mix          │ │
│ Flight │   ┌──────────────────┐   │  │ ⏱️  Adjust Scene Timing     │ │
│        │   │  Shot 3   ● 10s │   │  │ 🔄 Reorder Shots             │ │
│ ○ 4.   │   │  Action sequence │  │  └──────────────────────────────┘ │
│ Worm   │   └──────────────────┘   │                                  │
│        │   ┌──────────────────┐   │  Status Legend:                  │
│[+ Shot]│   │  Shot 4   ○ 8s  │   │  ○ = No frames yet                │
│        │   │  Reaction shot   │  │  ◐ = Frames ready, no video       │
│        │   └──────────────────┘   │  ● = Video complete              │
│        │                          │                                  │
│        │   ┌──────────────────┐   │  ← Select a shot to drill down   │
│        │   │ Select a shot    │   │     into shot-level editing      │
│        │   │ to edit →        │   │                                  │
│        │   └──────────────────┘   │                                  │
├────────┴──────────────────────────┴──────────────────────────────────┤
│  ▶  [ Shot 1 ████ ][ Shot 2 ███ ][ Shot 3 █████ ][ Shot 4 ████ ]     │
│     0:00           0:08         0:14            0:24       0:32      │
└──────────────────────────────────────────────────────────────────────┘
```

**Component:** `empty-states.tsx` → `<SceneOverviewState />`

**Behavior:**
- **Left Panel:** Scene-level metadata and shot list
  - Shows scene title, total duration, shot count, and aggregate status
  - Lists all shots in the scene as expandable cards with status dots
  - Each shot card shows title/description, status, and duration
  - Call-to-action to select a shot
- **Right Panel:** Scene video preview
  - Composite video player showing all shots in the scene stitched together
  - Scene-level editing controls (audio mix, timing adjustments, shot reordering)
  - Status legend to teach the visual language
  - Prompts user to select a shot for detailed editing
- **Timeline:** Shows shot-level pills (all shots in this scene)
  - Each pill represents an individual shot
  - Clicking a shot pill OR sidebar shot card transitions to State 3
- **Sidebar:** Shows "← All" back button to return to movie view, plus shot list for current scene

---

### State 3: Shot-Level Editing — Step 1: Script

**Editing Level:** Shot (individual shot with workflow steps)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← The Lot                                          ⚙  👤  Share   │
├────┬─────────────────────────┬───────────────────────────────────────┤
│    │ S3, Shot 1  · 8s  [−+] │  ① Script  ② Frame  ③ Video  ④ Polish│
│ ←  │                         │  ━━━━━━━                              │
│    │                         │                                       │
│ ○1 │ EXT. Cinematic Dunes   │  ┌───────────────────────────────┐   │
│ ◐2 │                         │  │                               │   │
│ ●3 │ A sweeping wide shot    │  │      No frames generated      │   │
│ ○4 │ establishes the endless │  │                               │   │
│    │ desert dunes of Arrakis.│  │    ┌─────────────────────┐   │   │
│    │                         │  │    │                     │   │   │
│    │    CHARACTER (V.O.)     │  │    │   ✨ Generate       │   │   │
│    │    "This world feels    │  │    │   Start Frame       │   │   │
│    │     ancient..."         │  │    │                     │   │   │
│    │                         │  │    └─────────────────────┘   │   │
│    │ [CAMERA] Ultra-wide     │  │                               │   │
│    │ lens, low angle, slow   │  │  Edit your prompt below:     │   │
│    │ push-in, heat haze      │  │  ┌─────────────────────────┐ │   │
│    │                         │  │  │ Endless sand dunes at   │ │   │
│    │                         │  │  │ golden hour, cinematic  │ │   │
│    │                         │  │  │ scale, atmospheric haze │ │   │
│    │                         │  │  └─────────────────────────┘ │   │
│    │                         │  └───────────────────────────────┘   │
├────┴─────────────────────────┴───────────────────────────────────────┤
│  ▶  [▓Shot 1▓▓▓▓][ Shot 2    ][ Shot 3        ][ Shot 4    ]  0:32 │
└──────────────────────────────────────────────────────────────────────┘
```

**Left panel component:** `script-panel.tsx`
**Right panel component:** `production-panel.tsx` → renders `step-script.tsx`

**Left panel — Script Editor:**
- Screenplay-formatted text editor (carried over from v2's "Living Script" design)
- Only narrative content: title (slugline), action, internal monologue, camera notes
- No prompts, no generation buttons — those live on the right
- Uses `--font-ibm-plex-mono` for screenplay feel
- Blocks are editable `AutoTextarea` components with hover-reveal labels

**Right panel — Production (Step 1: Script):**
- Workflow stepper at top: `① Script  ② Frame  ③ Video  ④ Polish`
- Step 1 is active (underlined with `--color-step-active`)
- Below stepper: shows the start frame prompt as an editable textarea
- Below prompt: empty frame placeholder with a centered "Generate Start Frame" CTA
- The CTA is the single primary action — large, prominent, uses `--color-step-active` border

---

### State 4: Shot-Level Editing — Step 2: Frames Generated

**Editing Level:** Shot (individual shot with workflow steps)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← The Lot                                          ⚙  👤  Share   │
├────┬─────────────────────────┬───────────────────────────────────────┤
│    │ S3, Shot 1  · 8s  [−+] │  ① Script  ② Frame  ③ Video  ④ Polish│
│ ←  │                         │             ━━━━━━━                   │
│    │                         │                                       │
│ ◐1 │ EXT. Cinematic Dunes   │  ┌─ START FRAME ──┐ ┌─ END FRAME ──┐│
│ ◐2 │                         │  │ ░░░░░░░░░░░░░░ │ │ ░░░░░░░░░░░░ ││
│ ●3 │ A sweeping wide shot    │  │ ░░  🏜️ image ░░ │ │ ░░  🌅 img ░░ ││
│ ○4 │ establishes the endless │  │ ░░░░░░░░░░░░░░ │ │ ░░░░░░░░░░░░ ││
│    │ desert dunes of Arrakis.│  │  [🔄 Regen]    │ │  [🔄 Regen]  ││
│    │                         │  └────────────────┘ └──────────────┘│
│    │    CHARACTER (V.O.)     │                                       │
│    │    "This world feels    │  Start Frame Prompt:                  │
│    │     ancient..."         │  ┌─────────────────────────────────┐ │
│    │                         │  │ Endless sand dunes at golden hr │ │
│    │ [CAMERA] Ultra-wide     │  └─────────────────────────────────┘ │
│    │ lens, low angle, slow   │  End Frame Prompt:                    │
│    │ push-in, heat haze      │  ┌─────────────────────────────────┐ │
│    │                         │  │ Sun descending behind dune ridge│ │
│    │                         │  └─────────────────────────────────┘ │
│    │                         │                                       │
│    │                         │  ┌═══════════════════════════════════┐│
│    │                         │  ║   ▶  GENERATE VIDEO              ║│
│    │                         │  ╚═══════════════════════════════════╝│
├────┴─────────────────────────┴───────────────────────────────────────┤
│  ▶  [▓Shot 1▓▓▓▓][ Shot 2    ][ Shot 3        ][ Shot 4    ]  0:32 │
└──────────────────────────────────────────────────────────────────────┘
```

**Right panel component:** `production-panel.tsx` → renders `step-frames.tsx`

**Behavior:**
- Stepper auto-advances to Step 2 when frames finish generating
- Start and end frames shown side-by-side with individual "Regenerate" buttons
- Each frame card shows its prompt below it (editable)
- Regenerate button on each frame lets user re-roll individual frames
- Primary CTA at bottom: "Generate Video" — only enabled when both frames exist
- Sidebar dot for this shot changes from `○` to `◐`

---

### State 5: Shot-Level Editing — Step 3: Video Ready

**Editing Level:** Shot (individual shot with workflow steps)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← The Lot                                          ⚙  👤  Share   │
├────┬─────────────────────────┬───────────────────────────────────────┤
│    │ S3, Shot 1  · 8s  [−+] │  ① Script  ② Frame  ③ Video  ④ Polish│
│ ←  │                         │                      ━━━━━━━          │
│    │                         │                                       │
│ ●1 │ EXT. Cinematic Dunes   │  ┌─ VIDEO PREVIEW ─────────────────┐ │
│ ◐2 │                         │  │                                 │ │
│ ●3 │ A sweeping wide shot    │  │                                 │ │
│ ○4 │ establishes the endless │  │         ░░░░░░░░░░░░░░░         │ │
│    │ desert dunes of Arrakis.│  │         ░░  🎬 VIDEO  ░░        │ │
│    │                         │  │         ░░  PLAYING   ░░        │ │
│    │    CHARACTER (V.O.)     │  │         ░░░░░░░░░░░░░░░         │ │
│    │    "This world feels    │  │                                 │ │
│    │     ancient..."         │  │                                 │ │
│    │                         │  │  ▶ 0:03 ━━━━━━━●━━━━━━━━ 0:08  │ │
│    │ [CAMERA] Ultra-wide     │  └─────────────────────────────────┘ │
│    │ lens, low angle, slow   │                                       │
│    │ push-in, heat haze      │  ┌──────────────┐  ┌──────────────┐  │
│    │                         │  │ 🔄 Regenerate │  │ ✅ Approve   │  │
│    │                         │  │    Video      │  │    Shot      │  │
│    │                         │  └──────────────┘  └──────────────┘  │
├────┴─────────────────────────┴───────────────────────────────────────┤
│  ▶  [▓Shot 1▓▓▓▓][ Shot 2    ][ Shot 3        ][ Shot 4    ]  0:32 │
└──────────────────────────────────────────────────────────────────────┘
```

**Right panel component:** `production-panel.tsx` → renders `step-video.tsx`

**Behavior:**
- Video player takes up most of the right panel (uses existing `video-player.tsx` / `@diffusionstudio/core`)
- Inline playback controls within the video preview area
- Two action buttons below: "Regenerate Video" (secondary) and "Approve Shot" (primary)
- "Approve" marks the shot as complete → sidebar dot changes to `●`
- "Regenerate" sends user back to loading state, keeps frames
- Sidebar dot for this shot changes from `◐` to `●` on approval

---

### State 6: Shot-Level Editing — Step 4: Polish

**Editing Level:** Shot (individual shot with workflow steps)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← The Lot                                          ⚙  👤  Share   │
├────┬─────────────────────────┬───────────────────────────────────────┤
│    │ S3, Shot 1  · 8s  [−+] │  ① Script  ② Frame  ③ Video  ④ Polish│
│ ←  │                         │                               ━━━━━━━│
│    │                         │                                       │
│ ●1 │ EXT. Cinematic Dunes   │  ┌─ POLISH YOUR SHOT ──────────────┐ │
│ ◐2 │                         │  │                                 │ │
│ ●3 │ A sweeping wide shot    │  │  🎙 Voice Generation            │ │
│ ○4 │ establishes the endless │  │  ┌───────────────────────────┐  │ │
│    │ desert dunes of Arrakis.│  │  │ Generate V.O. from the    │  │ │
│    │                         │  │  │ monologue text, or record │  │ │
│    │    CHARACTER (V.O.)     │  │  │ your own voice.           │  │ │
│    │    "This world feels    │  │  │                           │  │ │
│    │     ancient..."         │  │  │  [🎙 Generate] [⬆ Upload] │  │ │
│    │                         │  │  └───────────────────────────┘  │ │
│    │ [CAMERA] Ultra-wide     │  │                                 │ │
│    │ lens, low angle, slow   │  │  👄 Lip Sync                    │ │
│    │ push-in, heat haze      │  │  ┌───────────────────────────┐  │ │
│    │                         │  │  │ Sync video to audio with  │  │ │
│    │                         │  │  │ AI lip movement.          │  │ │
│    │                         │  │  │                           │  │ │
│    │                         │  │  │  [👄 Apply Lip Sync]      │  │ │
│    │                         │  │  └───────────────────────────┘  │ │
│    │                         │  └─────────────────────────────────┘ │
├────┴─────────────────────────┴───────────────────────────────────────┤
│  ▶  [▓Shot 1▓▓▓▓][ Shot 2    ][ Shot 3        ][ Shot 4    ]  0:32 │
└──────────────────────────────────────────────────────────────────────┘
```

**Right panel component:** `production-panel.tsx` → renders `step-polish.tsx`

**Behavior:**
- Only accessible after video is generated (Step 3 complete)
- Voice Generation section: pulls monologue text from the shot, offers "Generate V.O." and "Upload" buttons
- Lip Sync section: takes the generated video + audio and applies AI lip sync
- These are optional polish steps — the shot is already "complete" at Step 3

---

### State 7: Loading States

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← The Lot                                          ⚙  👤  Share   │
├────┬─────────────────────────┬───────────────────────────────────────┤
│    │ S3, Shot 1  · 8s  [−+] │  ① Script  ② Frame  ③ Video  ④ Polish│
│ ←  │                         │  ━━━━━━━━━━                           │
│    │                         │  (pulsing underline)                  │
│ ◌1 │ EXT. Cinematic Dunes   │                                       │
│ ◐2 │                         │  ┌─────────────────────────────────┐ │
│ ●3 │ A sweeping wide shot    │  │                                 │ │
│ ○4 │ establishes the endless │  │                                 │ │
│    │ desert dunes of Arrakis.│  │        ┌──────────────┐         │ │
│    │                         │  │        │              │         │ │
│    │    CHARACTER (V.O.)     │  │        │  Loading     │         │ │
│    │    "This world feels    │  │        │  Animation   │         │ │
│    │     ancient..."         │  │        │              │         │ │
│    │                         │  │        └──────────────┘         │ │
│    │ [CAMERA] Ultra-wide     │  │                                 │ │
│    │ lens, low angle, slow   │  │  Generating your start frame... │ │
│    │ push-in, heat haze      │  │  This usually takes ~15 seconds │ │
│    │                         │  │                                 │ │
│    │                         │  └─────────────────────────────────┘ │
│    │                         │                                       │
│    │                         │  Tip: You can edit your script while  │
│    │                         │  frames generate. We'll notify you!   │
├────┴─────────────────────────┴───────────────────────────────────────┤
│  ▶  [◌Shot 1▒▒▒▒][ Shot 2    ][ Shot 3        ][ Shot 4    ]  0:32 │
└──────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Loading animations reuse existing `spongebob-loading.tsx`, `simpson-loading.tsx`, `princess-loading.tsx`
- Stepper underline pulses/animates during generation
- Sidebar dot shows a spinning/pulsing `◌` state
- Helpful tip text below the loading area tells user they can keep editing
- Timeline pill for the loading shot shows a shimmer/pulse effect

---

### State 8: Simple Timeline (Default) vs Advanced Timeline

#### Simple Mode (default):

```
┌──────────────────────────────────────────────────────────────────────┐
│  ▶  │ Shot 1       │ Shot 2     │ Shot 3          │ Shot 4      │   │
│     │ Dunes  ●     │ Close  ◐   │ Flight  ●       │ Worm  ○     │   │
│     │ 8s           │ 6s         │ 10s             │ 8s          │   │
│     0:00           0:08         0:14              0:24       0:32    │
│                                                        [Advanced ▸] │
└──────────────────────────────────────────────────────────────────────┘
```

#### Advanced Mode (toggled):

```
┌──────────────────────────────────────────────────────────────────────┐
│ SPLIT │  ▶  0:03 / 0:32                    ─● zoom ●─     ⤢ FIT    │
│───────┼──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────│
│  3    │  │  5   │      │  10  │      │  15  │      │  20  │  25  30 │
│───────┼──┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴─────────│
│  +    │ [▓▓ 1. Dunes Wide ▓▓▓] [2. Paul Close] [3. Ornithopter   ] │
│       │ [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] [▓▓▓▓▓▓▓▓▓▓▓▓] [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] │
│       │    ▲ playhead                                    [◁ Simple] │
└──────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Default to Simple Mode — shows shot pills with title, status dot, and duration
- Simple Mode: play button, shot pills, total time. No split, no zoom, no ruler.
- Advanced Mode: full timeline with split tool, zoom slider, ruler marks, playhead, add-track button
- Toggle button in bottom-right corner switches between modes
- Mode preference persisted in local state (not DB)

---

### State 9: Media Library (Slide-over Panel)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← The Lot                                          ⚙  👤  Share   │
├────┬──────────────────────┬──────────────────────────────────────────┤
│    │ S3, Shot 1  · 8s     │  MEDIA LIBRARY                     ✕   │
│ ←  │                       │                                        │
│    │ (script content       │  🔍 Search media...                     │
│ ●1 │  visible but dimmed   │                                        │
│ ◐2 │  behind the panel)    │  ┌─ YOUR UPLOADS ──────────────────┐  │
│ ●3 │                       │  │ ┌──────┐ ┌──────┐ ┌──────┐     │  │
│ ○4 │                       │  │ │ img1 │ │ img2 │ │ vid1 │     │  │
│    │                       │  │ │ .png │ │ .jpg │ │ .mp4 │     │  │
│    │                       │  │ └──────┘ └──────┘ └──────┘     │  │
│    │                       │  └──────────────────────────────────┘  │
│    │                       │                                        │
│    │                       │  ┌─ GENERATED FRAMES ───────────────┐  │
│    │                       │  │ ┌──────┐ ┌──────┐ ┌──────┐      │  │
│    │                       │  │ │ S1.1 │ │ S1.2 │ │ S2.1 │      │  │
│    │                       │  │ └──────┘ └──────┘ └──────┘      │  │
│    │                       │  └──────────────────────────────────┘  │
│    │                       │                                        │
│    │                       │  ┌─ GENERATED VIDEOS ───────────────┐  │
│    │                       │  │ ┌──────┐ ┌──────┐                │  │
│    │                       │  │ │ S1.1 │ │ S1.3 │                │  │
│    │                       │  │ └──────┘ └──────┘                │  │
│    │                       │  └──────────────────────────────────┘  │
│    │                       │                                        │
│    │                       │  [⬆ Upload New Media]                  │
├────┴──────────────────────┴──────────────────────────────────────────┤
│  ▶  [▓Shot 1▓▓▓▓][ Shot 2    ][ Shot 3        ][ Shot 4    ]  0:32 │
└──────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Opens as a slide-over panel from the right (replaces production panel temporarily)
- Accessible from header bar or from a "Media" button in the stepper area
- Organized into sections: Uploads, Generated Frames, Generated Videos
- Search bar at top filters across all sections
- Drag-and-drop from library onto timeline (Advanced Mode)
- Close button returns to the production panel

---

## Data Model Changes

### New field on `StoryboardShot`: `status`

Add to `lib/storyboard-types.ts`:

```typescript
export type ShotStatus = "draft" | "frames_ready" | "video_ready" | "approved"
```

This can be derived from existing simulation state in the client, or persisted to DB for cross-session state. For v3, derive it client-side from `simulationByShot`:

```typescript
function deriveShotStatus(sim: ShotSimulationState): ShotStatus {
  if (sim.video === "ready") return "video_ready"
  if (sim.frames === "ready") return "frames_ready"
  return "draft"
}
```

### New field: `activeStep`

Track which workflow step the user is viewing per-shot. Client-side only:

```typescript
export type WorkflowStep = "script" | "frames" | "video" | "polish"
```

Auto-advance logic:
- When frames finish generating → auto-switch to `"frames"` step
- When video finishes generating → auto-switch to `"video"` step
- User can manually click any completed or current step

---

## Workflow Stepper Component Spec

**File:** `components/storyboard/workflow-stepper.tsx`

```typescript
interface WorkflowStepperProps {
  currentStep: WorkflowStep
  shotStatus: ShotStatus
  isLoading: boolean
  onStepClick: (step: WorkflowStep) => void
}
```

**Visual states per step:**

| Step | Idle | Active | Complete | Loading |
|------|------|--------|----------|---------|
| ① Script | `#696969` text, no underline | `#386775` text, teal underline | `#20504E` text, checkmark | — |
| ② Frame | `#696969` text, no underline | `#386775` text, teal underline | `#20504E` text, checkmark | Pulsing underline |
| ③ Video | `#696969` text, no underline | `#386775` text, teal underline | `#20504E` text, checkmark | Pulsing underline |
| ④ Polish | `#696969` text, no underline | `#386775` text, teal underline | `#20504E` text, checkmark | — |

**Clickability rules:**
- Script: always clickable
- Frame: clickable if status >= `"draft"` (always, since you can generate from draft)
- Video: clickable only if status >= `"frames_ready"`
- Polish: clickable only if status >= `"video_ready"`

Use Radix `Tabs` component as the base, styled to match the stepper design.

---

## Shot Status Dot Component Spec

**File:** `components/storyboard/shot-status-dot.tsx`

```typescript
interface ShotStatusDotProps {
  status: ShotStatus
  isLoading?: boolean
  size?: "sm" | "md"
}
```

| Status | Visual | Color |
|--------|--------|-------|
| `"draft"` | Empty circle `○` | `#696969` |
| `"frames_ready"` | Half-filled circle `◐` | `#386775` |
| `"video_ready"` | Filled circle `●` | `#20504E` |
| `"approved"` | Filled circle with check `✓` | `#193D31` |
| Loading | Pulsing/spinning circle `◌` | `#386775` with animation |

Rendered as a small SVG or styled `<div>` with Framer Motion for the loading pulse.

---

## Implementation Plan

### Phase 1: Foundation (scaffold + data flow)

1. **Create `workflow-stepper.tsx`** — Radix Tabs-based horizontal step indicator
2. **Create `shot-status-dot.tsx`** — SVG status indicator component
3. **Add `WorkflowStep` and `ShotStatus` types** to `lib/storyboard-types.ts`
4. **Add `activeStepByShot` state** to `storyboard-editor.tsx`
5. **Add `deriveShotStatus` utility** to compute status from simulation state

### Phase 2: Right Panel Rewrite

6. **Create `production-panel.tsx`** — container that renders stepper + step content
7. **Create `step-script.tsx`** — Step 1: prompt editor + generate frame CTA
8. **Create `step-frames.tsx`** — Step 2: side-by-side frames + prompts + generate video CTA
9. **Create `step-video.tsx`** — Step 3: video player + regenerate/approve buttons
10. **Create `step-polish.tsx`** — Step 4: voice generation + lip sync tools
11. **Delete old `frame-preview.tsx`** 4-card grid and video preview layout

### Phase 3: Left Panel + Sidebar

12. **Rewrite `scene-sidebar.tsx`** from `scene-list.tsx` — add status dots to shot list
13. **Rewrite `script-panel.tsx`** from `shot-detail.tsx` — remove prompts and generate button, keep only screenplay content
14. **Create `empty-states.tsx`** — welcome state, scene overview state

### Phase 4: Timeline

15. **Add Simple Mode** to `shot-timeline.tsx` — shot pills with title + status + duration only
16. **Add Advanced Mode toggle** — reveals full timeline with split, zoom, ruler
17. **Default to Simple Mode**

### Phase 5: Polish

18. **Loading state improvements** — pulsing stepper, sidebar dot animation, timeline shimmer
19. **Auto-advance logic** — stepper auto-switches when generation completes
20. **Contextual tips** — "You can edit while generating" helper text during loading
21. **Media Library slide-over** — accessible from header, organized by type

---

## File Mapping: v2 → v3

| v2 Component | v3 Component | Change |
|---|---|---|
| `frame-preview.tsx` | `production-panel.tsx` + `step-*.tsx` | Full rewrite. 4-card grid replaced by stepper. Content is step-dependent. |
| `shot-detail.tsx` | `script-panel.tsx` | Stripped down. Prompts and generate button removed. Only screenplay content. |
| `scene-list.tsx` | `scene-sidebar.tsx` | Status dots added. Shot cards in overview state. |
| `shot-timeline.tsx` | `shot-timeline.tsx` | Simple/Advanced toggle added. Default to simple. |
| `storyboard-editor.tsx` | `storyboard-editor.tsx` | New state: `activeStepByShot`. Orchestrates step transitions and auto-advance. |
| — | `workflow-stepper.tsx` | New component. |
| — | `shot-status-dot.tsx` | New component. |
| — | `empty-states.tsx` | New component. |

---

## Navigation Flow Between Editing Levels

### Drill-Down Navigation (Movie → Scene → Shot)

```
Movie Level (State 1)
    ↓ Click scene in sidebar OR scene pill in timeline
Scene Level (State 2)
    ↓ Click shot card OR shot pill in timeline
Shot Level (States 3-6)
```

### Drill-Up Navigation (Shot → Scene → Movie)

```
Shot Level (States 3-6)
    ↑ Click "←" back button in sidebar
Scene Level (State 2)
    ↑ Click "← All" back button in sidebar
Movie Level (State 1)
```

### Lateral Navigation (Within Same Level)

- **Movie Level:** No lateral navigation (only one movie)
- **Scene Level:** Click different scene in sidebar or timeline → switches to that scene's overview
- **Shot Level:** Click different shot in sidebar or timeline → switches to that shot's editing view

---

## Key Interaction Flows

### Flow 1: New User, First Time Creating a Movie

1. User lands on page → sees **State 1: Movie Overview** with all scenes listed
2. Movie preview shows placeholder (no videos generated yet)
3. User clicks Scene 1 in sidebar → **drills down to State 2: Scene Overview**
4. Scene preview shows placeholder, shot cards show all `○` empty status
5. User clicks Shot 1 card → **drills down to State 3: Shot-Level Editing (Step 1: Script)**
6. Left panel shows screenplay editor, right panel shows Step 1 with empty frame + "Generate Start Frame" CTA
7. User edits the start frame prompt → clicks "Generate Start Frame"
8. Loading animation plays → stepper pulses → sidebar dot becomes `◌`
9. Frame generates → stepper auto-advances to **State 4: Step 2** → sidebar dot becomes `◐`
10. User sees start + end frames side-by-side → clicks "Generate Video"
11. Loading animation → video generates → stepper auto-advances to **State 5: Step 3**
12. User watches video in right panel → clicks "Approve Shot" → sidebar dot becomes `●`
13. User clicks "←" back button → **drills up to State 2: Scene Overview**
14. Scene preview now shows Shot 1 video, user can see progress
15. User clicks Shot 2 card → repeats shot-level editing flow
16. After completing all shots in scene, user clicks "← All" → **drills up to State 1: Movie Overview**
17. Movie preview now includes completed Scene 1, user sees overall progress

### Flow 2: Returning User, Editing Existing Shot

1. User starts at **State 1: Movie Overview** → sees progress bars and completed scenes
2. Clicks Scene 3 → **State 2: Scene Overview** → sees mix of `○`, `◐`, `●` shots
3. Clicks Shot 2 (status `●` complete) → **State 3-6: Shot-Level Editing**
4. Stepper shows all steps complete, video plays in right panel
5. User clicks Step 2 (Frame) in stepper → sees frames with "Regenerate" buttons
6. User regenerates start frame → video status resets to `◐` → needs to re-generate video
7. User clicks Step 1 (Script) → edits the action text → no visual output changes (script is independent)
8. User navigates back to scene level to see updated status

### Flow 3: Movie-Level Editing (High-Level Overview)

1. User at **State 1: Movie Overview** with multiple completed scenes
2. Right panel shows full movie composite video playing all scenes in sequence
3. User adjusts movie-level controls: adds soundtrack, applies color grading
4. Timeline shows scene-level pills, user can scrub through entire movie
5. User clicks "Export Full Movie" → renders final composite
6. User can still drill down to any scene or shot for detailed edits

### Flow 4: Scene-Level Editing (Mid-Level Overview)

1. User at **State 2: Scene Overview** for Scene 3
2. Right panel shows scene composite video (all shots in Scene 3 stitched together)
3. User adjusts scene-level controls: scene audio mix, timing adjustments
4. User clicks "Reorder Shots" → drag-and-drop shot cards to resequence
5. Scene preview updates in real-time to reflect new order
6. User can drill down to individual shots or drill up to movie level

### Flow 5: Power User, Advanced Timeline

1. User at any editing level (movie, scene, or shot)
2. Clicks "Advanced" toggle in timeline
3. Full timeline appears with ruler, zoom, split tool
4. User splits a clip, adjusts speed, drags media from library
5. User clicks "Simple" to return to overview mode
6. Timeline adapts to current editing level (scene pills for movie, shot pills for scene/shot)

---

## Animation Specifications

All animations use Framer Motion (already installed).

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Stepper underline slide | `layoutId` shared layout | 200ms | `easeOut` |
| Step content swap | `AnimatePresence` fade + slide | 150ms | `easeOut` |
| Status dot change | Scale pop `1 → 1.2 → 1` | 300ms | Spring `stiffness: 400` |
| Loading pulse | Opacity `0.4 → 1 → 0.4` loop | 1500ms | `easeInOut` |
| Panel resize | Same as v2 drag handles | 120ms | `easeOut` |
| Sidebar collapse | Spring width animation | — | `stiffness: 360, damping: 34` |
| Timeline mode toggle | Height expand/collapse | 200ms | `easeOut` |

---

## Summary

The core redesign transforms the UI from "here's a bunch of tools, figure it out" into "here's step 1, here's step 2, here's step 3." Every screen has one primary action. Progress is always visible. The left panel is for writing, the right panel is for producing. Non-filmmakers follow the numbered steps. Power users click through steps freely and toggle Advanced Mode when needed.
