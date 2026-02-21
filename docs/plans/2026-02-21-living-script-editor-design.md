# Design Document: "Living Script" Editor

## Overview
Transform the `ShotDetail` component from a "Form UI" (Label -> Box -> Input) into a "Screenplay Document UI" using a CSS-only formatting approach. The goal is to provide screenwriters and directors an immersive, script-like experience where formatting visually indicates the data type.

## Architecture & Data Flow
- **Data Layer:** Unchanged. The editor will continue to use the `action`, `internalMonologue`, and `cameraNotes` properties on the `shot` object.
- **Component Layer:** Modifications will be localized to `v2/components/storyboard/shot-detail.tsx`, primarily restyling `EditorBlock` and `AutoTextarea`.
- **Data Persistence:** The existing `onUpdate` propagation and debounce logic will be maintained as is.

## Design Details

### 1. The Clean Canvas
- Remove borders and background colors from `EditorBlock` wrappers and `<textarea>` elements.
- The `AutoTextarea` inputs will sit directly on the black background, reading like a continuous document.
- Update typography to resemble screenplay text.

### 2. Screenplay Alignment (Fountain Standard)
- **Shot Title (Slugline):** Left-aligned, uppercase, bolder weight.
- **Action:** Standard paragraph width, left-aligned.
- **Monologue/Dialogue:**
  - Indented approximately 20% from both the left and right margins.
  - Automatically place a non-editable, centered label `CHARACTER (V.O.)` directly above the text input to denote dialogue.
- **Camera Notes:** Prefixed with a static `[CAMERA]` tag, and styled differently (e.g. italic or slightly muted monospace) to separate technical direction from narrative story.

### 3. Block Discovery & Hover States
- Labels (`ACTION`, `MONOLOGUE`, `CAMERA NOTES`) and the drag handle (`GripVertical`) will fade in on the far left margin *only when the user hovers* over the corresponding block.
- This creates an immersive reading mode by default, gracefully revealing editing tools and context only when the user intends to interact with the block.

### 4. "Director's Notes"
- Rename the current "AI Generation Prompts" section to "🎬 DIRECTOR'S NOTES".
- Keep this section visually distinct (e.g., using a subtle dark grey background or monospace font) to cleanly separate the "Script" from the generation "Instructions".

## Trade-offs
- Using CSS-only formatting on individual text areas means users must tab or click between distinct fields rather than seamlessly typing "Enter" to flow from an Action block directly into a Monologue block (like they could in a true rich text editor). However, this significantly reduces technical complexity and bugs while fully satisfying the visual requirements.
