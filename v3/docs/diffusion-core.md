# Diffusion Studio Core (`@diffusionstudio/core`) — Complete Reference

**Version:** `4.0.3` | **License:** MPL-2.0 | **Package:** `@diffusionstudio/core`

Diffusion Studio Core is a browser-based video compositing engine built in TypeScript. It uses the **Canvas 2D Context API** for rendering and the **WebCodecs API** for hardware-accelerated decoding and encoding. It is framework-agnostic (React, Next.js, Vue, Svelte, Solid, Angular all work). The underlying mux/demux layer is `mediabunny`.

---

## Table of Contents

1. [Installation](#installation)
2. [Required HTTP Headers](#required-http-headers)
3. [Core Architecture](#core-architecture)
4. [Primitive Types](#primitive-types)
5. [Composition](#composition)
6. [Layer](#layer)
7. [Sources](#sources)
8. [Base Clip](#base-clip)
9. [VisualMixin](#visualmixin)
10. [VideoClip](#videoclip)
11. [AudioClip](#audioclip)
12. [ImageClip](#imageclip)
13. [TextClip](#textclip)
14. [CaptionClip](#captionclip)
15. [Shape Clips](#shape-clips)
16. [Keyframe Animations](#keyframe-animations)
17. [Effects (Filters)](#effects-filters)
18. [Transitions](#transitions)
19. [Masks](#masks)
20. [Blend Modes](#blend-modes)
21. [Font Management](#font-management)
22. [Encoder (Export)](#encoder-export)
23. [Utility Functions](#utility-functions)
24. [Global Configuration](#global-configuration)
25. [Checkpoint / Serialization](#checkpoint--serialization)
26. [Error Classes](#error-classes)
27. [React / Next.js Integration](#react--nextjs-integration)
28. [Building a Scrubber / Timeline UI](#building-a-scrubber--timeline-ui)
29. [Performance Best Practices](#performance-best-practices)
30. [Complete Examples](#complete-examples)

---

## Installation

```bash
npm install @diffusionstudio/core
# or
yarn add @diffusionstudio/core
pnpm add @diffusionstudio/core
bun add @diffusionstudio/core
```

The package is ES module only (`"type": "module"`). Entry point: `./dist/core.es.js`.

**Import style (recommended):**
```typescript
import * as core from '@diffusionstudio/core';

const composition = new core.Composition();
```

**Named imports also work:**
```typescript
import {
  Composition, Layer, Source,
  VideoClip, AudioClip, ImageClip, TextClip, CaptionClip,
  RectangleClip, EllipseClip, PolygonClip,
  RectangleMask, EllipseMask,
  Encoder,
  loadFont, getWebFonts, getLocalFonts,
} from '@diffusionstudio/core';
```

**In Next.js `'use client'` components, always dynamic-import** because the library uses browser APIs:
```typescript
const coreModule = await import('@diffusionstudio/core');
```

---

## Required HTTP Headers

These headers are **mandatory**. Without them, `SharedArrayBuffer` (required by WebCodecs) is unavailable and the library will not function.

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

### Next.js (`next.config.ts`)

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Vite (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
});
```

---

## Core Architecture

The three primary abstractions:

- **`Composition`** — the root canvas/project container; manages layers, playback, and the renderer
- **`Layer`** — a timeline track (the docs call it a "track", the API class is `Layer`); holds clips in order
- **`Clip`** — a media element placed on a layer with a start/end time

There is **no separate `Track` or `Timeline` class**. The Composition IS the timeline. Layers are tracks.

**Browser compatibility:** Chrome 94+, Edge 94+. WebCodecs is partial/unsupported in Firefox and Safari.

---

## Primitive Types

All type definitions are in `dist/types/index.d.ts`.

```typescript
type int     = number;        // integer (no decimals)
type frame   = number;        // frame index
type float   = number;
type hex     = `#${string}`;  // e.g. '#FF0000'
type uuid    = `${string}-${string}-${string}-${string}-${string}`;
type Percent = `${number}%` | `${number}.${number}%`;  // e.g. '50%', '33.3%'

// Used everywhere time is accepted — all of these are valid:
type Time =
  | `${number}ms`               // milliseconds: '500ms'
  | `${number}s`                // seconds: '2.5s'
  | `${number}f`                // frames: '30f'
  | `${number}min`              // minutes: '1min'
  | `${number}:${number}`       // MM:SS: '1:30'
  | `${number}:${number}:${number}` // HH:MM:SS: '0:01:30'
  | `${number}/${number}`       // frame/fps fraction: '60/30'
  | number;                     // raw frames as integer

type Size        = { width: number; height: number };
type Point       = { x: number; y: number };
type RelativePoint = { x: number | Percent; y: number | Percent };
type MediaInput  = string | Blob | File | FileSystemFileHandle;
type Asset       = { id?: string; mimeType: string; input: MediaInput };
type ClipType    = 'IMAGE' | 'AUDIO' | 'TEXT' | 'VIDEO' | 'BASE' | 'ELLIPSE' | 'RECT' | 'POLYGON' | 'CAPTION';

// Transcript format (used by CaptionSource)
type Transcript = {
  text: string;
  words: { text: string; start: number; end: number }[];
}[];
```

---

## Composition

The root container. Creating it gives you a project. Mounting it to the DOM starts rendering.

### Constructor

```typescript
new Composition(options?: CompositionSettings & { licenseKey?: string | null })

type CompositionSettings = {
  width?: int;                          // default: 1920
  height?: int;                         // default: 1080
  background?: hex | 'transparent';    // default: '#000000'
  playbackEndBehavior?: 'stop' | 'loop' | 'reset';  // default: 'stop'
};
```

The free tier renders a "Made with Diffusion Studio" watermark on exported video. Pass `licenseKey` to remove it.

### Properties

| Property | Type | Description |
|---|---|---|
| `id` | `string` | UUID |
| `renderer` | `Renderer` | Internal canvas renderer |
| `layers` | `Layer[]` | All layers (index 0 = top, renders last) |
| `markers` | `Marker[]` | User-defined time markers |
| `data` | `Record<string, unknown>` | Arbitrary user data |
| `createdAt` | `Date` | Creation timestamp |
| `playbackEndBehavior` | `PlaybackEndBehavior` | End-of-playback behavior |

### Getters / Setters

| Name | Type | Description |
|---|---|---|
| `settings` | `Required<CompositionSettings>` | Get or set all settings at once |
| `playing` | `boolean` | Whether playback is active |
| `currentTime` | `number` (get) / `Time` (set) | Last rendered time in seconds |
| `playheadTime` | `number` (get) / `Time` (set) | Playhead position (differs from `currentTime` during active playback) |
| `duration` | `number` | Total duration derived from all clips |
| `width` | `number` | Canvas width |
| `height` | `number` | Canvas height |
| `clips` | `Clip[]` | All clips across all layers |

### Methods

```typescript
// DOM lifecycle — mount() starts the ticker, unmount() stops it
mount(element: HTMLElement): void
unmount(): void
resize(width: number, height: number): void

// Playback
play(time?: Time): Promise<void>
pause(): Promise<void>
seek(time?: Time): Promise<void>
update(): Promise<void>    // force a single redraw

// Layer management
add<L extends Layer>(layer: L, index?: number): Promise<L>   // index 0 = top
createLayer<L extends Clip>(index?: number): Layer<L>         // sync, no init
remove<L extends Layer>(layers: L | L[]): L[]
clear(): void              // removes all layers and clips

// Utilities
screenshot(format?: 'webp' | 'png' | 'jpeg', quality?: number): string  // data URL
time(precision?: { hours?: boolean; milliseconds?: boolean }): string    // formatted time

// Serialization
createCheckpoint(): Promise<unknown>
restoreCheckpoint(checkpoint: unknown, assets: Asset[]): Promise<this>
toString(): string
```

### Events

```typescript
type CompositionEvents = {
  'playback:start': undefined;
  'playback:end': undefined;
  'playback:time': number | undefined;  // fires every rendered frame
  'layer:add': undefined;
  'layer:remove': undefined;
  'resize': undefined;
  'restored': undefined;
};

// Subscribe — returns an unsubscribe function
const unsub = composition.on('playback:time', (time) => {
  updateUI(time);
});
unsub(); // unsubscribe

// One-time listener
composition.on('playback:end', () => { ... }, { once: true });

// Regex matching across multiple events
composition.on(/playback:.*/, ({ type, detail }) => {
  console.log(type, detail);
});

// Remove listeners
composition.off('playback:time', callback);
composition.offAny(); // remove all
```

---

## Layer

Layers are timeline tracks. A `Composition` holds an ordered array of `Layer` objects.

### Layer z-index

`index: 0` is the **top** layer (rendered last, appears on top visually). Higher index = lower in stack.

### Insert Modes

- **`DEFAULT`** — clips are positioned at explicit `delay` values; they can overlap
- **`SEQUENTIAL`** — clips are placed end-to-end automatically; `delay` of the first clip sets where the sequence starts

### Constructor

```typescript
new Layer(options?: { mode?: 'DEFAULT' | 'SEQUENTIAL' })
```

### Properties & Getters

| Name | Type | Description |
|---|---|---|
| `id` | `string` | UUID |
| `disabled` | `boolean` | Hides all clips in the layer |
| `clips` | `Clip[]` | Clips in this layer |
| `data` | `Record<string, unknown>` | Arbitrary user data |
| `composition` | `Composition?` | Parent composition |
| `mode` | `InsertMode` | Get/set insert mode |
| `index` | `number` | Get z-index; set with `'top'`, `'bottom'`, or a number |
| `start` | `number` | First visible frame of layer |
| `end` | `number` | Last visible frame of layer |

### Methods

```typescript
add<L extends Clip>(clip: L, index?: number): Promise<L>
remove<L extends Clip>(clip: L, detachEmptyLayer?: boolean): L | undefined
relocate(clip: Clip, targetLayer?: Layer, index?: number): void
sequential(value?: boolean): this   // enable SEQUENTIAL mode (chainable)
detach(): this                      // remove from composition
clear(): void

// Serialization
createCheckpoint(): Promise<unknown>
restoreCheckpoint(checkpoint: unknown, assets: Asset[]): Promise<this>
```

### Usage

```typescript
// DEFAULT layer (manual positioning by delay)
const layer = await composition.add(new core.Layer());
await layer.add(new core.VideoClip(source, { delay: 0, duration: '5s' }));
await layer.add(new core.VideoClip(source2, { delay: '3s', duration: '5s' }));

// SEQUENTIAL layer (auto end-to-end concatenation)
const seqLayer = await composition.add(new core.Layer({ mode: 'SEQUENTIAL' }));
await seqLayer.add(new core.VideoClip(sources[0], { range: [2, 8] }));
await seqLayer.add(new core.VideoClip(sources[1], { range: [0, 10] }));
// sources[1] starts immediately after sources[0] ends

// Z-index management
layer.index = 'top';     // move to front
layer.index = 'bottom';  // move to back
layer.index = 2;         // specific position
```

---

## Sources

Sources hold decoded media data and can be **shared across multiple clips** for memory efficiency. All are created via the `Source.from()` factory.

### `Source.from()` — universal factory

```typescript
// auto-detects MIME type and returns the appropriate typed source
const videoSource = await core.Source.from<core.VideoSource>('/video.mp4');
const audioSource = await core.Source.from<core.AudioSource>('/audio.mp3');
const imageSource = await core.Source.from<core.ImageSource>('/logo.png');

// Accepts all MediaInput types
const source = await core.Source.from<core.VideoSource>(file);           // File
const source = await core.Source.from<core.VideoSource>(blob);           // Blob
const source = await core.Source.from<core.VideoSource>(fileHandle);     // FileSystemFileHandle
const source = await core.Source.from<core.VideoSource>(objectUrl);      // blob: URL

// With options
await core.Source.from<core.VideoSource>(input, {
  name?: string;      // human-readable name
  mimeType?: string;  // override auto-detected MIME type
});

// From Asset descriptor (for checkpoint restoration)
await core.Source.fromAsset<core.VideoSource>(asset: Asset);
```

### VideoSource

`VideoSource extends AudioSource` — has all audio methods plus video-specific ones.

```typescript
class VideoSource {
  id: string;
  mimeType: string;
  input: MediaInput;
  name: string;

  // Video
  width: int;
  height: int;
  fps: number;
  bitrate: number;
  get aspectRatio(): number;

  // Audio (inherited)
  duration?: number;
  sampleRate: number;
  numberOfChannels: number;

  // Decode the audio track to an AudioBuffer
  decode(numberOfChannels?: number, sampleRate?: number, cache?: boolean): Promise<AudioBuffer>;

  // Silence detection
  silences(options?: SilenceDetectionOptions): Promise<AudioSlice[]>;

  // Async generator of raw audio samples in a time range
  samplesInRange({ start, end }: { start: Time; end: Time }): AsyncGenerator<AudioSample>;

  // Async generator of video thumbnail frames (for timeline strip)
  thumbnailsInRange(options: {
    start: Time;
    end: Time;
    count: number;
    width: number;
    height: number;
  }): AsyncGenerator<WrappedCanvas | null>;

  arrayBuffer(): Promise<ArrayBuffer>;
}
```

### AudioSource

```typescript
class AudioSource {
  id: string;
  mimeType: string;
  duration?: number;
  sampleRate: number;
  numberOfChannels: number;

  decode(numberOfChannels?: number, sampleRate?: number, cache?: boolean): Promise<AudioBuffer>;
  silences(options?: SilenceDetectionOptions): Promise<AudioSlice[]>;
  samplesInRange({ start, end }: { start: Time; end: Time }): AsyncGenerator<AudioSample>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

type SilenceDetectionOptions = {
  threshold?: number;    // RMS below this = silent; default: 0.02
  hopSize?: number;      // affects short-silence accuracy; default: 1024
  minDuration?: number;  // minimum silence duration in seconds; default: 0.5
};

type AudioSlice = { start: number; end: number };  // seconds
```

### ImageSource

```typescript
class ImageSource {
  id: string;
  mimeType: string;
  element: HTMLImageElement;
  width: int;
  height: int;
  get aspectRatio(): number;
  arrayBuffer(): Promise<ArrayBuffer>;
}
```

### CaptionSource

```typescript
class CaptionSource {
  transcript: Transcript;
  get duration(): number;

  // Group transcript words for display segments
  groupBy(options: GeneratorOptions): WordGroup[];
  // GeneratorOptions is one of:
  //   { count: number }     — N words per group
  //   { duration: number }  — N second groups
  //   { length: number }    — N character groups

  computeWpm(): number;        // words per minute
  optimize(): this;            // optimize transcript for display
  toSrt(): { text: string; blob: Blob };
}

type WordGroup = { text: string; start: number; end: number }[];
```

---

## Base Clip

All clips extend `Clip`. It provides the shared timing and lifecycle API.

### `ClipProps` (constructor options shared by all clips)

```typescript
interface ClipProps {
  disabled?: boolean;
  name?: string;
  duration?: Time;
  delay?: Time;           // offset from start of composition (DEFAULT mode)
  animations?: ClipAnimationOptions;
  transition?: TransitionConfig;
}
```

### Clip Properties & Getters

| Name | Type | Description |
|---|---|---|
| `id` | `string` | UUID |
| `type` | `ClipType` | Clip type string |
| `source` | `BaseSource?` | Shared source reference |
| `layer` | `Layer?` | Parent layer |
| `disabled` | `boolean` | Hides clip |
| `data` | `Record<string, unknown>` | Arbitrary user data |
| `initialized` | `boolean` | Whether `init()` has been called |
| `transition` | `TransitionConfig?` | Transition to the next clip |
| `animations` | `ClipAnimationOptions` | Keyframe animations |
| `start` | `number` | First visible frame in seconds |
| `end` | `number` | Last visible frame in seconds |
| `delay` | `number` | Offset from timeline zero |
| `duration` | `number` | Clip length in frames |
| `index` | `number` | Position within the parent layer |

Setting `start` / `end` adjusts `delay` / `duration` respectively.

### Clip Methods

```typescript
trim(start?: Time, end?: Time): this       // trim source range
split(time?: Time): Promise<this>          // split at time (defaults to composition.currentTime)
copy(): this                               // new id, shared source
detach(): this                             // remove from parent layer
containsAudio(): this is AudioClip
animate(time: number): this                // interpolate keyframes at given absolute time

// Serialization
createCheckpoint(): Promise<unknown>
restoreCheckpoint(checkpoint: unknown, assets: Asset[]): Promise<this>
```

---

## VisualMixin

All visual clip types (`VideoClip`, `ImageClip`, `TextClip`, `CaptionClip`, `ShapeClip` subclasses) mix this in.

### `VisualMixinProps` (added to constructor options)

```typescript
interface VisualMixinProps {
  rotation?: number;              // degrees; default: 0
  opacity?: number;               // 0–100 (NOT 0–1); default: 100
  position?: RelativePoint | 'center';
  x?: number | Percent;
  y?: number | Percent;
  translate?: Point | number;
  translateX?: number | Percent;
  translateY?: number | Percent;
  scale?: Point | number;
  scaleX?: number;
  scaleY?: number;
  height?: Percent | number;
  width?: Percent | number;
  anchor?: Point | number;        // origin point; 0.5 = center, 1 = bottom-right
  anchorX?: number;
  anchorY?: number;
  keepAspectRatio?: boolean;      // default: true; auto-false when both h+w are set
  effects?: Effect[];
  blendMode?: BlendMode;
  mask?: Mask;
  constraints?: Constraints;
}
```

**CRITICAL:** `opacity` is **0–100**, not 0–1. `opacity: 50` = 50% transparent.

### VisualMixin Getters

```typescript
get filter(): string           // computed CSS filter string from effects[]
get size(): Size               // { width, height }
get bounds(): [Point, Point, Point, Point]  // four corners accounting for all transforms
get aspectRatio(): number
set aspectRatio(value: number | undefined)  // override source aspect ratio
```

### Constraints

Controls how a clip responds when the composition is resized:

```typescript
interface Constraints {
  horizontal: ConstraintType;  // default: 'MIN'
  vertical: ConstraintType;    // default: 'MIN'
}
type ConstraintType = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
```

### Animatable Visual Properties

```typescript
type VisualMixinAnimationOptions = KeyframeOptions<
  | 'opacity' | 'rotation'
  | 'scale' | 'scaleX' | 'scaleY'
  | 'anchorX' | 'anchorY'
  | 'x' | 'y' | 'height' | 'width'
  | 'translateX' | 'translateY',
  number
>[];
```

---

## VideoClip

Renders video frames to the canvas with synchronized audio.

```typescript
class VideoClip extends AudioClip  // (with VisualMixin applied)
readonly type = 'VIDEO'
```

### `VideoClipProps`

```typescript
interface VideoClipProps extends AudioClipProps, VisualMixinProps {
  animations?: VideoClipAnimationOptions;  // same as VisualMixinAnimationOptions
}

interface AudioClipProps extends ClipProps {
  volume?: number;   // 0–1; default: 1
  muted?: boolean;
  range?: [Time | undefined, Time | undefined];  // source trim range
}
```

### Usage

```typescript
const source = await core.Source.from<core.VideoSource>('/video.mp4');

// Basic
const clip = new core.VideoClip(source);
await layer.add(clip);

// With trim range (plays seconds 2–8 of source)
const clip = new core.VideoClip(source, {
  range: [2, 8],
  delay: '5s',
});

// Muted, centered, full-width
const clip = new core.VideoClip(source, {
  muted: true,
  position: 'center',
  width: '100%',
});

// Audio fades
clip.fadeInDurationSeconds = 0.5;
clip.fadeOutDurationSeconds = 1.0;

// With transition to next clip
const clip = new core.VideoClip(source, {
  transition: { duration: '1s', type: 'dissolve' },
});

// Sequential concatenation
const seqLayer = await composition.add(new core.Layer({ mode: 'SEQUENTIAL' }));
await seqLayer.add(new core.VideoClip(sources[0], { range: [2, 8] }));
await seqLayer.add(new core.VideoClip(sources[1], { range: [0, 12] }));
```

---

## AudioClip

Plays audio on the timeline. No visual representation.

```typescript
class AudioClip extends Clip
readonly type = 'AUDIO'
```

### Additional Getters/Setters

| Name | Type | Description |
|---|---|---|
| `volume` | `number` | 0–1; default: 1 |
| `muted` | `boolean` | |
| `range` | `[number, number]` | Source trim range in seconds |
| `fadeInDurationSeconds` | `number` | Auto-creates audio ramp keyframes |
| `fadeOutDurationSeconds` | `number` | Auto-creates audio ramp keyframes |

### Methods

```typescript
trim(start?: Time, end?: Time): this
split(time?: Time): Promise<this>
removeSilences(options?: SilenceRemoveOptions): Promise<AudioClip[]>
```

```typescript
type SilenceRemoveOptions = {
  padding?: number;       // seconds of non-silence padding after each segment; default: 0.5
  threshold?: number;     // RMS threshold; default: 0.02
  hopSize?: number;       // default: 1024
  minDuration?: number;   // minimum silence in seconds; default: 0.5
};
```

```typescript
const source = await core.Source.from<core.AudioSource>('/voice.mp3');
const clip = new core.AudioClip(source, { volume: 0.8, range: [0, 30] });
clip.fadeInDurationSeconds = 1;

// Remove silence from voice recording
const clips = await clip.removeSilences({ threshold: 0.015, padding: 0.3 });
```

---

## ImageClip

Renders a static image to the canvas.

```typescript
class ImageClip extends Clip  // (with VisualMixin applied)
readonly type = 'IMAGE'
```

```typescript
interface ImageClipProps extends ClipProps, VisualMixinProps {
  animations?: ImageClipAnimationOptions;  // same as VisualMixinAnimationOptions
}
```

```typescript
const source = await core.Source.from<core.ImageSource>('/logo.png');

await layer.add(new core.ImageClip(source, {
  position: 'center',
  width: 400,
  delay: '2s',
  duration: '5s',
  animations: [
    {
      key: 'scale',
      frames: [
        { time: 0, value: 1 },
        { time: '5s', value: 1.5 },
      ],
      easing: 'ease-in-out',
    },
  ],
}));
```

---

## TextClip

Renders styled text to the canvas with rich typography support.

```typescript
class TextClip extends Clip  // (with VisualMixin applied)
readonly type = 'TEXT'
```

### `TextClipProps`

```typescript
interface TextClipProps extends ClipProps, Omit<VisualMixinProps, 'height'>, Partial<TextStyle> {
  text?: string;
  align?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'bottom' | 'middle' | 'alphabetic';
  strokes?: Stroke[];
  shadows?: Shadow[];
  leading?: number;               // line spacing
  background?: Background;        // background pill/box behind text
  styles?: StyleOverride[];       // per-character range overrides
  maxWidth?: number | Percent;    // wrapping width
  animations?: TextClipAnimationOptions;
}
```

### Text Styling Types

```typescript
interface Font {
  size: number;
  family: string;
  weight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  style?: 'normal' | 'italic' | 'oblique';
}

interface Stroke {
  color?: hex;
  width?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'bevel' | 'round' | 'miter';
  miterLimit?: number;
  opacity?: number;
}

interface Shadow {
  color?: hex;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  opacity?: number;
}

interface Glow {
  color?: hex;
  radius?: number;
  intensity?: number;
  opacity?: number;
}

type Background = {
  fill?: hex;             // default: '#000000'
  opacity?: number;       // default: 100
  borderRadius?: number;  // default: 20
  padding?: {
    x: int;               // default: 30
    y: int;               // default: 20
  };
};

interface StyleOverride {
  start: number;              // character index start
  end?: number;               // character index end (undefined = end of text)
  style: Partial<TextStyle>;
}
```

### TextClip Animatable Properties

```typescript
type TextClipAnimationOptions = (
  | KeyframeOptions<
      'opacity' | 'rotation' | 'scale' | 'scaleX' | 'scaleY'
      | 'fontSize' | 'leading' | 'x' | 'y' | 'translateX' | 'translateY',
      number
    >
  | KeyframeOptions<'text', string>    // text content switch at midpoint
  | KeyframeOptions<'color', hex>      // color interpolated in HSL space
)[];
```

### Usage

```typescript
// Basic centered text
await layer.add(new core.TextClip({
  text: 'Hello World',
  font: { family: 'Montserrat', size: 80, weight: '700' },
  color: '#FFFFFF',
  align: 'center',
  baseline: 'middle',
  position: 'center',
  duration: '5s',
}));

// Text with stroke and shadow
new core.TextClip({
  text: 'Bold Caption',
  font: { family: 'Bangers', size: 120 },
  color: '#FFFF00',
  strokes: [{ color: '#000000', width: 4, lineJoin: 'round' }],
  shadows: [{ color: '#00000088', offsetX: 4, offsetY: 4, blur: 8 }],
  glow: { color: '#FF000088', radius: 20, intensity: 2 },
});

// Text with background pill
new core.TextClip({
  text: 'Caption',
  background: {
    fill: '#000000',
    opacity: 70,
    borderRadius: 10,
    padding: { x: 20, y: 10 },
  },
});

// Multi-line with wrapping
new core.TextClip({
  text: 'Line one\nLine two\nLine three',
  maxWidth: '80%',
  leading: 1.4,
  align: 'center',
});

// Per-character style override
new core.TextClip({
  text: 'Hello World',
  font: { family: 'Arial', size: 60 },
  color: '#FFFFFF',
  styles: [
    { start: 0, end: 5, style: { color: '#FF0000', font: { family: 'Arial', size: 60, weight: '900' } } },
  ],
});

// Animated opacity + position slide-up
new core.TextClip({
  text: 'Fade In',
  position: 'center',
  animations: [
    {
      key: 'opacity',
      frames: [{ time: 0, value: 0 }, { time: '1s', value: 100 }],
      easing: 'ease-out',
    },
    {
      key: 'y',
      frames: [{ time: 0, value: 600 }, { time: '1s', value: 540, easing: 'ease-out' }],
    },
  ],
});
```

---

## CaptionClip

Renders word-by-word animated captions with preset styles.

```typescript
class CaptionClip extends Clip  // (with VisualMixin applied)
readonly type = 'CAPTION'
```

### Caption Presets

```typescript
type CaptionPresetType = 'CLASSIC' | 'CASCADE' | 'SPOTLIGHT' | 'WHISPER' | 'SOLAR' | 'PAPER' | 'VERDANT' | 'GUINEA';
```

| Preset | Description |
|---|---|
| `CLASSIC` | Standard word-by-word display |
| `CASCADE` | Cascading word animation |
| `SPOTLIGHT` | Highlights the current word; supports `highlightColors: hex[]` |
| `WHISPER` | Word highlight with background box; supports `highlightColors` and `background` |
| `SOLAR` | Solar-styled display |
| `PAPER` | Paper-styled with split sequences |
| `VERDANT` | Verdant-styled |
| `GUINEA` | Guinea-styled with word highlighting; supports `highlightColors` |

### Usage

```typescript
// 1. Build a Transcript (from speech-to-text API)
const transcript: core.Transcript = [
  {
    text: 'Hello world',
    words: [
      { text: 'Hello', start: 0.0, end: 0.5 },
      { text: 'world', start: 0.6, end: 1.2 },
    ],
  },
];

// 2. Create CaptionSource
const captionSource = new core.CaptionSource({
  input: JSON.stringify(transcript),
  mimeType: 'application/json',
});

// 3. Optionally group words
const groups = captionSource.groupBy({ count: 3 });    // 3 words per group
const groups = captionSource.groupBy({ duration: 2 }); // 2-second groups
const groups = captionSource.groupBy({ length: 15 });  // 15-char limit

// 4. Create and configure CaptionClip
const captionClip = new core.CaptionClip(captionSource, {
  position: { x: '50%', y: '80%' },
  anchor: 0.5,
  maxWidth: '80%',
  font: { family: 'Montserrat', size: 60, weight: '700' },
  color: '#FFFFFF',
  align: 'center',
  baseline: 'middle',
});

// 5. Load a preset
await captionClip.loadPreset('SPOTLIGHT');

// 6. Add to layer
const captionLayer = await composition.add(new core.Layer());
await captionLayer.add(captionClip);

// Export to SRT
const { text, blob } = captionSource.toSrt();
```

---

## Shape Clips

### Shared `ShapeClipProps`

```typescript
interface ShapeClipProps extends ClipProps, VisualMixinProps {
  fill?: hex;
  strokes?: Stroke[];
}
```

### RectangleClip

```typescript
class RectangleClip extends ShapeClip
readonly type = 'RECT'

interface RectangleClipProps extends ShapeClipProps {
  radius?: number | Percent;   // corner radius
  animations?: RectangleClipAnimationOptions;
}

// Animatable: opacity, rotation, scale, scaleX, scaleY, x, y, height, width,
//             translateX, translateY, radius (number), fill (string/hex)
```

### EllipseClip

```typescript
class EllipseClip extends ShapeClip
readonly type = 'ELLIPSE'

interface EllipseClipProps extends ShapeClipProps {
  radius?: number | Percent;
  animations?: EllipseClipAnimationOptions;
}
// Animatable: includes radius
```

### PolygonClip

```typescript
class PolygonClip extends ShapeClip
readonly type = 'POLYGON'

interface PolygonClipProps extends ShapeClipProps {
  sides?: number;   // number of polygon sides (e.g. 6 = hexagon)
  animations?: PolygonClipAnimationOptions;
}
// Animatable: includes sides
```

### Shape Examples

```typescript
// Rounded rectangle with effects
const rect = new core.RectangleClip({
  position: 'center',
  width: 400,
  height: 200,
  fill: '#386775',
  radius: 20,
  delay: 0,
  duration: 5,
  effects: [
    { type: 'blur', value: 10 },
    { type: 'hue-rotate', value: 90 },
  ],
});

// Animated fill color
new core.RectangleClip({
  fill: '#386775',
  animations: [
    {
      key: 'fill',
      frames: [
        { time: 0, value: '#386775' },
        { time: 2, value: '#FF0000' },
      ],
    },
  ],
});

// Hexagon
new core.PolygonClip({ sides: 6, fill: '#597D7C', width: 200, height: 200 });
```

---

## Keyframe Animations

All clips support keyframe-based animation via the `animations` array in their constructor props.

### Types

```typescript
type Easing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'ease-out-in' | 'log-linear';

type Extrapolate = 'clamp' | 'extend';
// 'clamp' (default): holds endpoint values outside the range
// 'extend': extrapolates beyond the range

interface KeyFrame<T> {
  value: T;
  time: Time;         // relative to the clip's start time
  easing?: Easing;    // easing from THIS frame to the NEXT
}

interface KeyframeOptions<K, T> {
  key: K;                    // the property name to animate
  extrapolate?: Extrapolate; // default: 'clamp'
  easing?: Easing;           // default easing for all frames; default: 'linear'
  frames: KeyFrame<T>[];
}
```

### Animatable Properties by Clip Type

| Property | VideoClip | ImageClip | TextClip | RectClip | EllipseClip | PolygonClip |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `opacity` | Y | Y | Y | Y | Y | Y |
| `rotation` | Y | Y | Y | Y | Y | Y |
| `scale`, `scaleX`, `scaleY` | Y | Y | Y | Y | Y | Y |
| `x`, `y` | Y | Y | Y | Y | Y | Y |
| `translateX`, `translateY` | Y | Y | Y | Y | Y | Y |
| `width`, `height` | Y | Y | — | Y | Y | Y |
| `anchorX`, `anchorY` | Y | Y | — | — | — | — |
| `fontSize`, `leading` | — | — | Y | — | — | — |
| `color` (hex) | — | — | Y | — | — | — |
| `text` (string) | — | — | Y | — | — | — |
| `fill` (string/hex) | — | — | — | Y | Y | Y |
| `radius` | — | — | — | Y | Y | — |
| `sides` | — | — | — | — | — | Y |

### Animation Examples

```typescript
// Fade in + scale up
const clip = new core.VideoClip(source, {
  animations: [
    {
      key: 'opacity',
      extrapolate: 'clamp',
      frames: [
        { time: 0, value: 0 },
        { time: '0.5s', value: 100, easing: 'ease-out' },
      ],
    },
    {
      key: 'scale',
      frames: [
        { time: 0, value: 0.8 },
        { time: '0.5s', value: 1, easing: 'ease-out' },
      ],
    },
  ],
});

// Rotating text (from README)
new core.TextClip({
  text: 'Hello World',
  align: 'center',
  baseline: 'middle',
  position: 'center',
  animations: [
    {
      key: 'rotation',
      frames: [
        { time: 0, value: 0 },
        { time: 2, value: 720 },
      ],
    },
  ],
});

// Color transition on text
{
  key: 'color',
  frames: [
    { time: 0, value: '#FF0000' },
    { time: '2s', value: '#FFFFFF' },
  ],
}

// Pop font size
{
  key: 'fontSize',
  frames: [
    { time: 0, value: 10 },
    { time: '0.5s', value: 100, easing: 'ease-out' },
    { time: '1s', value: 80, easing: 'ease-in-out' },
  ],
}
```

---

## Effects (Filters)

Applied via the `effects` array on any visual clip. They map directly to CSS filter functions.

```typescript
type Effect =
  | { type: 'url';         value: string }          // SVG filter URL
  | { type: 'blur';        value: number }           // px; 0 = no blur
  | { type: 'brightness';  value: number }           // %; 100 = unchanged; >100 = brighter
  | { type: 'contrast';    value: number }           // %; 100 = unchanged
  | { type: 'drop-shadow'; value: { offsetX: number; offsetY: number; blur: number; color: string } }
  | { type: 'grayscale';   value: number }           // 0–100%; 100 = fully gray
  | { type: 'hue-rotate';  value: number }           // degrees; 0 = unchanged
  | { type: 'invert';      value: number }           // 0–100%; 100 = fully inverted
  | { type: 'opacity';     value: number }           // 0–100% (separate from clip opacity)
  | { type: 'saturate';    value: number }           // %; 100 = unchanged
  | { type: 'sepia';       value: number };          // 0–100%; 100 = full sepia
```

```typescript
// Multiple effects stack
new core.VideoClip(source, {
  effects: [
    { type: 'sepia',      value: 60 },
    { type: 'contrast',   value: 110 },
    { type: 'brightness', value: 95 },
  ],
});

// Drop shadow on text
new core.TextClip({
  effects: [
    { type: 'drop-shadow', value: { offsetX: 2, offsetY: 2, blur: 4, color: '#000000' } },
  ],
});

// Custom SVG filter
new core.ImageClip(source, {
  effects: [{ type: 'url', value: '#my-svg-filter' }],
});
```

---

## Transitions

Transitions are set on the **outgoing** clip and describe how it transitions to the next clip in the same **SEQUENTIAL** layer.

```typescript
type TransitionType =
  | 'dissolve'           // cross-dissolve (opacity crossfade)
  | 'slide-from-right'   // next clip slides in from right
  | 'slide-from-left'    // next clip slides in from left
  | 'fade-to-black'      // current fades to black, next fades in
  | 'fade-to-white';     // current fades to white, next fades in

type TransitionConfig = {
  duration: Time;
  type: TransitionType;
};
```

```typescript
// Clips in a sequential layer with transitions
const seqLayer = await composition.add(new core.Layer({ mode: 'SEQUENTIAL' }));

await seqLayer.add(new core.VideoClip(sources[0], {
  range: [0, 10],
  transition: { duration: '1s', type: 'dissolve' },
}));

await seqLayer.add(new core.VideoClip(sources[1], {
  range: [0, 10],
  transition: { duration: '0.5s', type: 'slide-from-right' },
}));

await seqLayer.add(new core.VideoClip(sources[2], { range: [0, 10] }));
```

---

## Masks

Masks clip the visible region of a visual clip.

### RectangleMask

```typescript
class RectangleMask extends Mask

interface RectangleMaskProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  radius?: number | Percent;
  animations?: KeyframeOptions<'x' | 'y' | 'radius' | 'width' | 'height', number>[];
}
```

### EllipseMask

```typescript
class EllipseMask extends Mask

interface EllipseMaskProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  animations?: KeyframeOptions<'x' | 'y' | 'width' | 'height', number>[];
}
```

### Mask API

```typescript
class Mask {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  fillRule?: 'nonzero' | 'evenodd';
  animations: KeyframeOptions<any, number>[];

  connect(clip: Clip): this;
  detach(): this;
  animate(time: number): this;

  get start(): number;
  get end(): number;
  get size(): Size;
  get bounds(): [Point, Point, Point, Point];
}
```

### Usage

```typescript
// Rounded rectangle mask
const mask = new core.RectangleMask({ width: 640, height: 1080, radius: 100 });
new core.ImageClip(source, { mask });

// Circular mask
const circleMask = new core.EllipseMask({ width: 400, height: 400 });
new core.ImageClip(source, { mask: circleMask });

// Animated mask radius
const animMask = new core.RectangleMask({
  width: 200,
  height: 200,
  radius: 0,
  animations: [
    {
      key: 'radius',
      frames: [
        { time: 0, value: 0 },
        { time: '1s', value: 100 },
      ],
    },
  ],
});
```

---

## Blend Modes

All visual clips support Canvas 2D composite operations via `blendMode`:

```typescript
type BlendMode =
  | 'source-over' | 'source-in' | 'source-out' | 'source-atop'
  | 'destination-over' | 'destination-in' | 'destination-out' | 'destination-atop'
  | 'lighter' | 'copy' | 'xor'
  | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten'
  | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light'
  | 'difference' | 'exclusion'
  | 'hue' | 'saturation' | 'color' | 'luminosity';
```

```typescript
// Useful for overlays, light leaks, etc.
new core.VideoClip(source, { blendMode: 'screen' });
```

---

## Font Management

```typescript
import { loadFont, getWebFonts, getLocalFonts, getLoadedFonts, restoreFonts } from '@diffusionstudio/core';

// Load a built-in web font
const font = await loadFont({
  family: 'Montserrat',
  weight: '700',
  size: 60,
});

// Load a custom font from URL
const font = await loadFont({
  family: 'MyFont',
  source: 'url(/fonts/my-font.woff2)',
  weight: '400',
  style: 'normal',
});

// Get local system fonts (requires Local Font Access API permission)
const localFonts = await getLocalFonts();

// Get all built-in web fonts
const webFonts = getWebFonts();

// Restore fonts after a checkpoint restore
await restoreFonts(getLoadedFonts());
```

### Built-in Web Fonts

| Family | Available Weights |
|---|---|
| `The Bold Font` | 500 |
| `Komika Axis` | 400 |
| `Geologica` | 100–900 |
| `Nunito` | 200–900 |
| `Figtree` | 300–900 |
| `Urbanist` | 100–900 |
| `Montserrat` | 100–900 |
| `Bangers` | 400 |
| `Chewy` | 400 |
| `Source Code Pro` | 200–900 |

**Safe browser fonts** (no loading required): `Helvetica, Arial, Verdana, Tahoma, Trebuchet MS, Impact, Times New Roman, Georgia, Courier, Monaco, Comic Sans MS` and others.

---

## Encoder (Export)

Hardware-accelerated rendering of a `Composition` to a video file using WebCodecs.

### Constructor

```typescript
new Encoder(composition: Composition, config?: EncoderConfig)
```

### `EncoderConfig`

```typescript
interface EncoderConfig {
  format?: 'mp4' | 'webm' | 'ogg';   // default: 'mp4'
  video?: VideoConfig;
  audio?: AudioConfig;
  debug?: boolean;                    // log performance; default: false
  range?: { end?: Time };             // encode only up to this time
}

interface VideoConfig {
  codec?: 'avc' | 'hevc' | 'vp9' | 'av1' | 'vp8';  // default: 'avc'
  fullCodecString?: string;   // full WebCodecs codec registry string (overrides codec)
  enabled?: boolean;          // default: true
  bitrate?: number;           // bps; default: 10_000_000 (10 Mbps)
  fps?: number;               // default: 30
  resolution?: number;        // scale multiplier; default: 1 (e.g. 2 = 4K from 1080p)
}

interface AudioConfig {
  codec?: 'aac' | 'opus' | 'mp3' | 'vorbis' | 'flac' | 'pcm-s16';  // default: 'aac'
  enabled?: boolean;          // default: true
  sampleRate?: number;        // default: 48000
  numberOfChannels?: number;  // default: 2
  bitrate?: number;           // bps; default: 128_000 (128 kbps)
}
```

### Encoder API

```typescript
class Encoder {
  onProgress?: (progress: { total: number; progress: number; remaining: Date }) => void;

  render(target?: WriteStreamCallback | FileSystemFileHandle | WritableStream | string): Promise<ExportResult>;
  cancel(): void;

  // Query browser-supported codecs
  audioCodecs(): Promise<string[]>;
  videoCodecs(): Promise<string[]>;
}

type ExportResult =
  | { type: 'success'; data: Blob | undefined }
  | { type: 'canceled' }
  | { type: 'error'; error: Error };
```

### Export Examples

```typescript
// Export to Blob (in-memory)
const encoder = new core.Encoder(composition, {
  format: 'mp4',
  video: { codec: 'avc', bitrate: 10_000_000, fps: 30 },
  audio: { codec: 'aac', bitrate: 128_000 },
});

encoder.onProgress = ({ progress }) => {
  console.log(`${Math.round(progress * 100)}%`);
};

const result = await encoder.render();
if (result.type === 'success' && result.data) {
  await core.downloadObject(result.data, 'output.mp4');
}

// Export directly to disk (no memory spike) — File System Access API
const [handle] = await window.showSaveFilePicker({
  suggestedName: 'output.mp4',
  types: [{ accept: { 'video/mp4': ['.mp4'] } }],
});
await new core.Encoder(composition).render(handle);

// Cancel
encoder.cancel();
```

---

## Utility Functions

```typescript
import {
  downloadObject,
  showFileDialog,
  parseTime,
  detectMimeType,
  mimeTypeToExtension,
  transcriptToSrt,
  audioBufferToWav,
  blobToMonoBuffer,
  detectSilences,
  sleep, debounce, clamp,
} from '@diffusionstudio/core';

// Trigger browser file download
await downloadObject(blob, 'output.mp4');

// Open browser file picker
const files = await showFileDialog('video/mp4,video/webm', false);  // (accept, multiple)

// Parse any Time value to seconds
parseTime('2s')    // -> 2
parseTime('500ms') // -> 0.5
parseTime('30f')   // -> 1 (at 30fps)
parseTime('1:30')  // -> 90

// MIME type detection
const mimeType = await detectMimeType(file);
const ext = mimeTypeToExtension('video/mp4');  // -> '.mp4'

// Audio utilities
const wav = audioBufferToWav(audioBuffer, 'audio/wav');
const mono = await blobToMonoBuffer(blob, 44100, 1.0);
const silences = detectSilences(audioBuffer, { threshold: 0.02, minDuration: 0.5 });

// SRT export
const { text, blob } = transcriptToSrt(transcript);
```

---

## Global Configuration

```typescript
import { env } from '@diffusionstudio/core';

// Change timeline frame rate (default: 30)
env.experimental_timeBase = 24;

// Change internal high-precision clock rate (default: 48000)
env.experimental_canonicalTimeBase = 48000;
```

---

## Checkpoint / Serialization

All major classes support save/restore via `createCheckpoint` / `restoreCheckpoint`.

```typescript
// Save full composition state
const checkpoint = await composition.createCheckpoint();
const json = JSON.stringify(checkpoint);
// Store in IndexedDB, localStorage, server, etc.

// Restore — must provide original source assets (Blobs/Files/URLs)
const assets: core.Asset[] = [
  { id: source.id, mimeType: source.mimeType, input: file },
];
await composition.restoreCheckpoint(JSON.parse(json), assets);
// 'restored' event fires on completion

// Individual layer/clip checkpoints also available
const layerCheckpoint = await layer.createCheckpoint();
await layer.restoreCheckpoint(layerCheckpoint, assets);
```

---

## Error Classes

```typescript
import { DecoderError, EncoderError, IOError, ReferenceError, ValidationError } from '@diffusionstudio/core';

// All extend Error; use for typed error handling
try {
  const source = await core.Source.from<core.VideoSource>(file);
} catch (err) {
  if (err instanceof core.DecoderError) {
    // handle decode failure
  }
}
```

---

## React / Next.js Integration

### CompositionProvider Pattern

```typescript
'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type * as core from '@diffusionstudio/core'

type CompositionContextValue = {
  composition: core.Composition | null
  isPlaying: boolean
  currentTime: number
  duration: number
  loading: boolean
  play: () => Promise<void>
  pause: () => Promise<void>
  seek: (time: number) => Promise<void>
}

const CompositionContext = createContext<CompositionContextValue | null>(null)

export function useComposition() {
  const ctx = useContext(CompositionContext)
  if (!ctx) throw new Error('useComposition must be used within <CompositionProvider>')
  return ctx
}

export function CompositionProvider({ children }: { children: React.ReactNode }) {
  const compositionRef = useRef<core.Composition | null>(null)
  const coreRef = useRef<typeof core | null>(null)
  const [composition, setComposition] = useState<core.Composition | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)

  // Create composition once on mount (dynamic import required in Next.js)
  useEffect(() => {
    let cancelled = false

    async function init() {
      const coreModule = await import('@diffusionstudio/core')
      if (cancelled) return
      coreRef.current = coreModule

      const comp = new coreModule.Composition({ width: 1920, height: 1080 })
      compositionRef.current = comp
      setComposition(comp)
    }

    init()
    return () => {
      cancelled = true
      compositionRef.current?.unmount()
    }
  }, [])

  const play = useCallback(async () => {
    if (!composition) return
    await composition.play()
    setIsPlaying(true)
  }, [composition])

  const pause = useCallback(async () => {
    if (!composition) return
    await composition.pause()
    setIsPlaying(false)
  }, [composition])

  const seek = useCallback(async (time: number) => {
    if (!composition) return
    await composition.seek(time)
    setCurrentTime(time)
  }, [composition])

  // Listen for time updates
  useEffect(() => {
    if (!composition) return
    const unsub = composition.on('playback:time', (time) => {
      if (time !== undefined) setCurrentTime(time)
    })
    composition.on('playback:end', () => setIsPlaying(false), { once: false })
    return () => unsub()
  }, [composition])

  return (
    <CompositionContext.Provider
      value={{ composition, isPlaying, currentTime, duration, loading, play, pause, seek }}
    >
      {children}
    </CompositionContext.Provider>
  )
}
```

### Canvas Mount Component

```typescript
'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useComposition } from './CompositionProvider'

export default function VideoCanvas() {
  const { composition } = useComposition()
  const containerRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)

  const rescale = useCallback(() => {
    const container = containerRef.current
    const mount = mountRef.current
    if (!container || !mount || !composition) return

    const scale = Math.min(
      container.clientWidth / composition.width,
      container.clientHeight / composition.height,
    )
    mount.style.width = `${composition.width}px`
    mount.style.height = `${composition.height}px`
    mount.style.transform = `scale(${scale})`
    mount.style.transformOrigin = 'center'
  }, [composition])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || !composition) return

    composition.mount(mount)  // starts ticker, appends <canvas>
    rescale()

    const observer = new ResizeObserver(rescale)
    if (containerRef.current) observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      composition.unmount()  // stops ticker, removes <canvas>
    }
  }, [composition, rescale])

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      <div ref={mountRef} />
    </div>
  )
}
```

### Loading User-Uploaded Files

```typescript
// HTML file input
async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  const source = await core.Source.from<core.VideoSource>(file)
  // ...
}

// Drag and drop
async function handleDrop(e: React.DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  const source = await core.Source.from<core.VideoSource>(file)
}

// File System Access API (modern browsers)
const files = await core.showFileDialog('video/*,audio/*', false)
const source = await core.Source.from<core.VideoSource>(files[0])
```

---

## Building a Scrubber / Timeline UI

```typescript
// Map composition state to UI

// Total duration in seconds
const totalDuration = composition.duration;

// Current playhead in seconds
const current = composition.currentTime;  // last rendered frame
// or
const current = composition.playheadTime; // live during playback

// Formatted display time
composition.time()                       // '00:05 / 01:30'
composition.time({ hours: true })        // 'HH:mm:ss'
composition.time({ milliseconds: true }) // 'mm:ss.SSS'

// Seek when user drags scrubber
await composition.seek(normalizedPosition * totalDuration);

// Real-time progress bar
composition.on('playback:time', (time) => {
  if (time !== undefined) {
    setProgress(time / composition.duration);
  }
});

// Enumerate all clips for timeline rendering
composition.layers.forEach((layer, zIndex) => {
  layer.clips.forEach(clip => {
    const startPercent = clip.start / composition.duration;
    const widthPercent = clip.duration / composition.duration;
    const type = clip.type;           // 'VIDEO', 'AUDIO', 'TEXT', etc.
    const isDisabled = clip.disabled;
  });
});

// Thumbnail strip for a video track
const videoSource = await core.Source.from<core.VideoSource>('/video.mp4');
for await (const frame of videoSource.thumbnailsInRange({
  start: 0,
  end: videoSource.duration,
  count: 20,
  width: 160,
  height: 90,
})) {
  if (frame) {
    const dataUrl = frame.canvas.toDataURL();
    // render dataUrl into timeline strip
  }
}

// Waveform for audio track
const audioSource = await core.Source.from<core.AudioSource>('/audio.mp3');
const buffer = await audioSource.decode(1, 22050, true);  // mono, low-rate, cached
const samples = buffer.getChannelData(0);  // Float32Array of PCM data
// downsample and draw samples to <canvas>

// Screenshot current frame (scrub preview thumbnail)
const dataUrl = composition.screenshot('webp', 0.8);
```

---

## Performance Best Practices

1. **COOP/COEP headers are mandatory.** Without them, WebCodecs hardware acceleration is unavailable.

2. **Always `unmount()` in cleanup.** In React `useEffect`, return `() => composition.unmount()` to stop the animation loop and free GPU resources.

3. **Share sources.** One `Source` object can feed multiple clips. Do not create duplicate sources from the same file.

4. **Dynamic import in Next.js.** Use `await import('@diffusionstudio/core')` in client components to avoid SSR failures.

5. **Use `layer.disabled` for hiding.** Toggling `disabled = true` is cheaper than removing and re-adding a layer.

6. **Cache audio decoding.** Pass `cache: true` to `audioSource.decode()` to avoid re-decoding.

7. **Clear layers before re-loading.** Before loading a new composition, remove existing layers:
   ```typescript
   for (const layer of [...composition.layers]) {
     composition.remove(layer);
   }
   ```

8. **4K export without resizing the canvas.** Set `resolution: 2` in `EncoderConfig.video` to export 4K from a 1080p composition. Do not resize `width`/`height`.

9. **Inactive FPS is 1.** The renderer ticks at 1 FPS when playback is stopped, conserving resources during editing.

10. **Browser support.** Test in Chrome 94+. WebCodecs is not available in Firefox or Safari at the time of writing.

---

## Complete Examples

### Minimal setup

```typescript
import * as core from '@diffusionstudio/core';

const composition = new core.Composition({ width: 1920, height: 1080, background: '#000000' });
composition.mount(document.getElementById('preview')!);

const source = await core.Source.from<core.VideoSource>('/video.mp4');
const layer = await composition.add(new core.Layer());
await layer.add(new core.VideoClip(source, { position: 'center', width: '100%' }));

await composition.play();
```

### Multi-layer video editor composition

```typescript
import * as core from '@diffusionstudio/core';

async function buildProject() {
  const composition = new core.Composition({ width: 1920, height: 1080, background: '#0D0E14' });

  // Load all sources in parallel
  const [videoSrc, bgMusicSrc, logoSrc] = await Promise.all([
    core.Source.from<core.VideoSource>('/main.mp4'),
    core.Source.from<core.AudioSource>('/bg-music.mp3'),
    core.Source.from<core.ImageSource>('/logo.png'),
  ]);

  // Background video layer (bottom — highest index)
  const videoLayer = await composition.add(new core.Layer({ mode: 'DEFAULT' }));
  await videoLayer.add(new core.VideoClip(videoSrc, {
    position: 'center',
    width: '100%',
    muted: true,
  }));

  // Background music
  const audioLayer = await composition.add(new core.Layer());
  await audioLayer.add(new core.AudioClip(bgMusicSrc, {
    volume: 0.3,
    fadeInDurationSeconds: 1,
    fadeOutDurationSeconds: 2,
  }));

  // Logo overlay (index 0 = top)
  const logoLayer = await composition.add(new core.Layer(), 0);
  await logoLayer.add(new core.ImageClip(logoSrc, {
    position: { x: '85%', y: '10%' },
    anchor: 0.5,
    width: 120,
    opacity: 80,
    delay: '2s',
    duration: '10s',
    animations: [
      {
        key: 'opacity',
        frames: [{ time: 0, value: 0 }, { time: '1s', value: 80 }],
      },
    ],
  }));

  // Text title
  const textLayer = await composition.add(new core.Layer(), 0);
  await textLayer.add(new core.TextClip({
    text: 'Scene Title',
    font: { family: 'Montserrat', size: 80, weight: '700' },
    color: '#FFFFFF',
    align: 'center',
    baseline: 'middle',
    position: 'center',
    delay: '1s',
    duration: '3s',
    shadows: [{ color: '#000000', blur: 8, offsetX: 2, offsetY: 2 }],
    animations: [
      {
        key: 'opacity',
        frames: [{ time: 0, value: 0 }, { time: '0.5s', value: 100 }],
        easing: 'ease-out',
      },
    ],
  }));

  return composition;
}
```

### Export with progress and download

```typescript
async function exportComposition(composition: core.Composition) {
  const encoder = new core.Encoder(composition, {
    format: 'mp4',
    video: { codec: 'avc', bitrate: 10_000_000, fps: 30, resolution: 1 },
    audio: { codec: 'aac', bitrate: 128_000, sampleRate: 48000 },
  });

  encoder.onProgress = ({ progress }) => {
    const pct = Math.round(progress * 100);
    document.getElementById('progress')!.textContent = `${pct}%`;
  };

  const result = await encoder.render();

  if (result.type === 'success' && result.data) {
    await core.downloadObject(result.data, 'output.mp4');
  } else if (result.type === 'error') {
    console.error('Export failed:', result.error);
  }
}
```

### Captions with SPOTLIGHT preset

```typescript
const transcript: core.Transcript = [
  {
    text: 'This is an example caption',
    words: [
      { text: 'This', start: 0.0, end: 0.3 },
      { text: 'is', start: 0.4, end: 0.5 },
      { text: 'an', start: 0.6, end: 0.7 },
      { text: 'example', start: 0.8, end: 1.2 },
      { text: 'caption', start: 1.3, end: 1.8 },
    ],
  },
];

const captionSource = new core.CaptionSource({
  input: JSON.stringify(transcript),
  mimeType: 'application/json',
});

const captionClip = new core.CaptionClip(captionSource, {
  position: { x: '50%', y: '82%' },
  anchor: 0.5,
  maxWidth: '80%',
  font: { family: 'Montserrat', size: 64, weight: '700' },
  color: '#FFFFFF',
  align: 'center',
  baseline: 'middle',
});

await captionClip.loadPreset('SPOTLIGHT');

const captionLayer = await composition.add(new core.Layer(), 0);
await captionLayer.add(captionClip);
```

### Checkpoint save/restore

```typescript
// Save
const checkpoint = await composition.createCheckpoint();
localStorage.setItem('project', JSON.stringify(checkpoint));

// Restore — provide the original assets
const assets: core.Asset[] = sources.map(s => ({
  id: s.id,
  mimeType: s.mimeType,
  input: s.input,
}));
await composition.restoreCheckpoint(JSON.parse(localStorage.getItem('project')!), assets);
```

---

## All Exported Symbols

```
Classes:
  Composition, Layer, Source
  VideoSource, AudioSource, ImageSource, CaptionSource
  VideoClip, AudioClip, ImageClip, TextClip, CaptionClip
  RectangleClip, EllipseClip, PolygonClip
  RectangleMask, EllipseMask
  Encoder
  ClassicCaptionPreset, CascadeCaptionPreset, SpotlightCaptionPreset
  WhisperCaptionPreset, SolarCaptionPreset, PaperCaptionPreset, GuineaCaptionPreset
  DecoderError, EncoderError, IOError, ReferenceError, ValidationError

Functions:
  loadFont, getWebFonts, getLocalFonts, getLoadedFonts, restoreFonts
  downloadObject, showFileDialog
  parseTime, detectMimeType, mimeTypeToExtension
  transcriptToSrt, serializeSources
  audioBufferToWav, blobToMonoBuffer, detectSilences
  sleep, debounce, clamp

Constants / Config:
  env              — global config (experimental_timeBase, experimental_canonicalTimeBase)
  WebFonts         — built-in web font registry
  SAFE_BROWSER_FONTS — list of fonts safe to use without loading
  FONT_WEIGHTS     — weight name mapping
```
