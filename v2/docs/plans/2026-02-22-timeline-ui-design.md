# Timeline UI Redesign Plan

## Overview
Redesign the `ShotTimeline` component to be a full-width, minimalist, integrated timeline that matches the user's hand-drawn sketch. The goal is to eliminate "dead space", ensure the timeline spans the entire width of the screen, and use a black background instead of the current dark blue.

## Goals
1.  **Eliminate Dead Space:** Remove padding around the timeline component in the parent editor.
2.  **Full-Width Layout:** Ensure the timeline tracks scroll horizontally across the full width of the pane.
3.  **Color Update:** Change track backgrounds from `#252933` to `#000000`.
4.  **Integrated Controls:** Move controls (Split, Play/Pause, Zoom) into a compact header bar above the tracks.

## Architecture & Components

### 1. `v2/components/storyboard/storyboard-editor.tsx`
-   **Change:** Remove padding from the container that holds `ShotTimeline`.
-   **Style:** `padding: "0 12px 12px"` -> `padding: 0`.
-   **Layout:** Ensure the container takes up the full available width and height.

### 2. `v2/components/storyboard/shot-timeline.tsx`
-   **Structure:**
    -   **Header Bar:**
        -   Height: ~40px.
        -   Background: `#000000` or transparent.
        -   Border Bottom: `1px solid #252933`.
        -   Content:
            -   Left: "SPLIT" button (disabled style).
            -   Center: Time Display (`0:00`), Play/Pause Button, Total Duration.
            -   Right: Zoom Controls (`-`, Slider, `+`, `FIT`).
    -   **Timeline Area:**
        -   Flex: `1` (takes remaining height).
        -   Overflow: `hidden` (vertical), `auto` (horizontal for tracks).
        -   Background: `#000000`.
        -   **Ruler:**
            -   Height: ~24px.
            -   Background: `#000000`.
            -   Border Bottom: `1px solid #252933`.
        -   **Tracks Container:**
            -   Background: `#000000`.
            -   **Video Track:**
                -   Height: ~64px (or flexible).
                -   Background: `#000000`.
                -   Border Bottom: `1px solid #252933`.
            -   **Audio Track:**
                -   Height: ~40px.
                -   Background: `#000000`.

### 3. Styling Details
-   **Colors:**
    -   Background: `#000000` (Black).
    -   Borders: `#252933` (Dark Grey).
    -   Text: `#777076` (Grey) / `#FFFFFF` (White).
    -   Playhead: `#597D7C` (Teal).
-   **Spacing:**
    -   Remove internal padding in `ShotTimeline` container.
    -   Ensure tracks start from the left edge (or minimal offset).

## Implementation Steps
1.  **Update Editor Layout:** Modify `storyboard-editor.tsx` to remove padding.
2.  **Refactor Timeline Component:**
    -   Update `ShotTimeline` structure to include the new Header Bar.
    -   Update CSS styles for full-width layout and black backgrounds.
    -   Adjust track heights and borders.
3.  **Verify:** Check that the timeline looks like a single cohesive component and matches the sketch.
