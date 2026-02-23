# Toast System Design

Date: 2026-02-23

## Summary

Add a minimal Sonner-based toast notification that fires when the user triggers frame or video generation from the storyboard editor.

## Approach

Use the `sonner` package already installed. Wire up the existing `components/ui/sonner.tsx` wrapper into the root layout and call `toast()` directly inside the two generation handlers.

## Changes

### 1. `app/layout.tsx`
Add `<Toaster />` once at the root so it renders on every page.

### 2. `components/ui/sonner.tsx`
Restyle to match the monochrome palette:
- Background: `#111111`
- Border: `1px solid #232323`
- Text: `#ffffff`
- Position: `top-right`
- Duration: `3000ms`
- No icon, no close button

### 3. `components/storyboard/storyboard-editor.tsx`
Call `toast()` at the start of:
- `handleGenerateFrames()` → `"Generating frames..."`
- `handleGenerateVideo()` → `"Generating video..."`

## Data Flow

```
User clicks generate
  → handleGenerateFrames() / handleGenerateVideo() fires
  → toast("Generating frames...") called
  → Sonner renders toast top-right
  → Auto-dismisses after 3s
```

## Constraints

- No new dependencies
- No state, no context, no custom hook
- Three files touched total
