import { useState, useCallback, useMemo } from "react";
import { Film, ArrowLeft, Users, Clapperboard, Download, FileText, Settings, Share2, Coins } from "lucide-react";
import { SceneSidebar } from "./components/SceneSidebar";
import type { SceneData } from "./components/SceneSidebar";
import { ShotEditor } from "./components/ShotEditor";
import { VideoPreview } from "./components/VideoPreview";
import { ShotTimeline } from "./components/ShotTimeline";

// ── Scene thumbnails ────────────────────────────────────────────────
const IMG_SCENE1 =
  "https://images.unsplash.com/photo-1584900106730-ea1a0e05697c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGNsb3NlLXVwJTIwd2FybSUyMG1vcm5pbmclMjBsaWdodCUyMGNpbmVtYXRpYyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTY0MzY4NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_SCENE2 =
  "https://images.unsplash.com/photo-1744962470248-226ec808052a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBkaW1seSUyMGxpdCUyMHJvb20lMjBkcmFtYXRpYyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTY0MzY4NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_SCENE3 =
  "https://images.unsplash.com/photo-1463397952320-023b1defe8a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGdhemluZyUyMHdpbmRvdyUyMG1vcm5pbmclMjBsaWdodCUyMGNvbnRlbXBsYXRpdmV8ZW58MXx8fHwxNzcxNjQzNjg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_SCENE4 =
  "https://images.unsplash.com/photo-1765448809307-ccd12f2a179d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBkYXJrJTIwY2l0eSUyMHN0cmVldCUyMG5pZ2h0JTIwZmlsbSUyMG5vaXJ8ZW58MXx8fHwxNzcxNjQzNjg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_SCENE5 =
  "https://images.unsplash.com/photo-1688042223442-cebc158db135?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0d28lMjBwZW9wbGUlMjBjb252ZXJzYXRpb24lMjBjYWZlJTIwZHJhbWF0aWMlMjBsaWdodGluZ3xlbnwxfHx8fDE3NzE2NDM2ODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_SCENE6 =
  "https://images.unsplash.com/photo-1650114363558-11c31db9a7a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdhbGtpbmclMjBhbG9uZSUyMHJhaW4lMjBjaW5lbWF0aWN8ZW58MXx8fHwxNzcxNjQzNjg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_EMOTIONAL =
  "https://images.unsplash.com/photo-1579473865557-61c4274a8ebb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGVtb3Rpb25hbCUyMHRlYXJzJTIwY2xvc2UtdXAlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE2NDM2ODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_SILHOUETTE =
  "https://images.unsplash.com/photo-1699801352871-df0bcc1767b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHNpbGhvdWV0dGUlMjB3aW5kb3clMjBtb3JuaW5nJTIwbGlnaHQlMjBhcGFydG1lbnR8ZW58MXx8fHwxNzcxNjQ2Mzc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_HAND_KITCHEN =
  "https://images.unsplash.com/photo-1595619769098-1a9fc955873a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGhhbmQlMjBraXRjaGVuJTIwY291bnRlciUyMGNsb3NlLXVwJTIwbW9vZHl8ZW58MXx8fHwxNzcxNjQ2Mzc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_APARTMENT =
  "https://images.unsplash.com/photo-1764037005931-d1fa6f781c29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMGFwYXJ0bWVudCUyMHdpZGUlMjBzaG90JTIwbW9ybmluZyUyMG1vb2R5JTIwY2luZW1hdGljfGVufDF8fHx8MTc3MTY0NjM3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

// ── Cast & Prop images ──────────────────────────────────────────────
const IMG_CAST_DANIELLE =
  "https://images.unsplash.com/photo-1635130439503-fced6db0b8cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwd2FybSUyMGNpbmVtYXRpYyUyMGhlYWRzaG90fGVufDF8fHx8MTc3MTY0NjM3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_CAST_WILBURN =
  "https://images.unsplash.com/photo-1770896686915-140095250023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMGRyYW1hdGljJTIwbGlnaHRpbmclMjBoZWFkc2hvdHxlbnwxfHx8fDE3NzE2NDYzNzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_CAST_MARGARET =
  "https://images.unsplash.com/photo-1764384700065-304c92b11e9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGRlciUyMHdvbWFuJTIwcG9ydHJhaXQlMjBlbGVnYW50JTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNjQ2Mzc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_PROP_COFFEE =
  "https://images.unsplash.com/photo-1762622815282-6b33abbbf32c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwY29mZmVlJTIwbXVnJTIwZGFyayUyMHRhYmxlfGVufDF8fHx8MTc3MTY0NjM3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_PROP_LETTER =
  "https://images.unsplash.com/photo-1768877598972-1e1d60fecb8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kd3JpdHRlbiUyMGxldHRlciUyMGVudmVsb3BlJTIwdmludGFnZXxlbnwxfHx8fDE3NzE2NDYzNzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_PROP_PHONE =
  "https://images.unsplash.com/photo-1770515853604-4487b6370bc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwcm90YXJ5JTIwcGhvbmUlMjBkYXJrJTIwbW9vZHl8ZW58MXx8fHwxNzcxNjQ2Mzc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

// ── Shared cast & prop pools ────────────────────────────────────────
const DANIELLE = { name: "Danielle", role: "Protagonist", image: IMG_CAST_DANIELLE };
const WILBURN = { name: "Wilburn", role: "Antagonist", image: IMG_CAST_WILBURN };
const MARGARET = { name: "Margaret", role: "Mentor", image: IMG_CAST_MARGARET };
const COFFEE = { name: "Coffee mug", image: IMG_PROP_COFFEE };
const LETTER = { name: "Letter", image: IMG_PROP_LETTER };
const PHONE = { name: "Rotary phone", image: IMG_PROP_PHONE };

// ── Scene & shot data ───────────────────────────────────────────────
const scenes: SceneData[] = [
  {
    id: 1,
    title: "Danielle's realization",
    thumbnail: IMG_SCENE1,
    shots: [
      {
        id: 101, title: "Morning light", thumbnail: IMG_SCENE1, duration: 5,
        action: "Danielle wakes to morning light flooding the bedroom. She blinks slowly, the weight of yesterday still pressing down.",
        actionHighlights: [
          { text: "Danielle", type: "character" },
          { text: "morning light", type: "location" },
          { text: "bedroom", type: "location" },
        ],
        internalMonologue: "Something shifted last night. I can feel it, like a door that won't close again.",
        monologueCharacter: "Danielle",
        cameraNotes: "Medium close-up, rack focus from window light to Danielle's face. 35mm, f/1.4.",
        soundCues: ["Soft ambient hum", "Distant bird song"],
        cast: [DANIELLE], props: [LETTER],
      },
      {
        id: 102, title: "Reading the letter", thumbnail: IMG_EMOTIONAL, duration: 6,
        action: "She reaches for the letter on the nightstand, unfolding it with trembling hands.",
        actionHighlights: [
          { text: "letter", type: "mood" },
          { text: "nightstand", type: "location" },
        ],
        cameraNotes: "Insert shot of hands and letter, shallow depth of field. Handheld micro-tremor.",
        soundCues: ["Paper rustling"],
        cast: [DANIELLE], props: [LETTER],
      },
      {
        id: 103, title: "Determination", thumbnail: IMG_SCENE1, duration: 4,
        action: "Danielle sets the letter down. Her jaw tightens. A resolute look crosses her face.",
        actionHighlights: [
          { text: "Danielle", type: "character" },
          { text: "resolute", type: "mood" },
        ],
        internalMonologue: "No more waiting. Today it changes.",
        monologueCharacter: "Danielle",
        cameraNotes: "Slow push-in on face. Anamorphic lens flare from window.",
        soundCues: ["Swelling piano note"],
        cast: [DANIELLE], props: [],
      },
    ],
  },
  {
    id: 2,
    title: "Wilburn dismisses Danielle",
    thumbnail: IMG_SCENE2,
    shots: [
      {
        id: 201, title: "Wilburn at his desk", thumbnail: IMG_SCENE2, duration: 5,
        action: "Wilburn sits behind his imposing desk, reviewing documents without looking up. The room is dimly lit.",
        actionHighlights: [
          { text: "Wilburn", type: "character" },
          { text: "desk", type: "location" },
          { text: "dimly lit", type: "mood" },
        ],
        cameraNotes: "Wide establishing shot. Low angle to convey authority. 50mm.",
        soundCues: ["Clock ticking", "Paper shuffling"],
        cast: [WILBURN], props: [LETTER],
      },
      {
        id: 202, title: "Danielle enters", thumbnail: IMG_SCENE1, duration: 4,
        action: "Danielle steps into the doorway, hesitant. Wilburn doesn't acknowledge her presence.",
        actionHighlights: [
          { text: "Danielle", type: "character" },
          { text: "Wilburn", type: "character" },
          { text: "hesitant", type: "mood" },
        ],
        cameraNotes: "Over-shoulder from Wilburn's POV. Danielle slightly out of focus in doorway.",
        soundCues: ["Door creak"],
        cast: [DANIELLE, WILBURN], props: [],
      },
      {
        id: 203, title: "The dismissal", thumbnail: IMG_SCENE2, duration: 6,
        action: "Wilburn finally looks up and waves his hand dismissively. His expression is cold, calculated.",
        actionHighlights: [
          { text: "Wilburn", type: "character" },
          { text: "dismissively", type: "mood" },
          { text: "cold", type: "mood" },
        ],
        internalMonologue: "She thinks she can challenge the protocol? Let her try.",
        monologueCharacter: "Wilburn",
        cameraNotes: "Close-up on Wilburn's face, slight push-in. Harsh side lighting.",
        soundCues: ["Low tension drone"],
        cast: [WILBURN], props: [],
      },
    ],
  },
  {
    id: 3,
    title: "Support for Protocol",
    thumbnail: IMG_SCENE3,
    shots: [
      {
        id: 301, title: "Window gazing", thumbnail: IMG_SCENE3, duration: 5,
        action: "Danielle sits alone, gazing softly into the morning light filtering through the apartment window. Her face slowly reveals the emotional weight of years of struggle to assert herself.",
        actionHighlights: [
          { text: "Danielle", type: "character" },
          { text: "morning light", type: "location" },
          { text: "apartment window", type: "location" },
          { text: "emotional weight", type: "mood" },
        ],
        internalMonologue: "I used to think that if I tried hard enough, things would just… work out. But the world doesn't reward patience the way they promised.",
        monologueCharacter: "Danielle",
        cameraNotes: "Medium close-up, steady tripod. The camera holds, allowing silence to speak. 35mm anamorphic, f/2.0. Warm color grade.",
        soundCues: ["Faint traffic ambience", "Melancholic piano intro"],
        cast: [DANIELLE, MARGARET],
        props: [COFFEE, LETTER],
      },
      {
        id: 302, title: "Emotional close-up", thumbnail: IMG_EMOTIONAL, duration: 4,
        action: "A single tear traces down Danielle's cheek. She doesn't wipe it away — she lets the sadness exist, fully and without apology.",
        actionHighlights: [
          { text: "Danielle's", type: "character" },
          { text: "sadness", type: "mood" },
        ],
        internalMonologue: "Maybe feeling it all is the only honest thing left.",
        monologueCharacter: "Danielle",
        cameraNotes: "Extreme close-up, macro lens on the tear. Rack focus to eyes. Handheld for intimacy.",
        soundCues: ["Piano melody swells", "Breathing"],
        cast: [DANIELLE],
        props: [],
      },
      {
        id: 303, title: "Whispered confession", thumbnail: IMG_SILHOUETTE, duration: 6,
        action: "Danielle turns from the window, silhouetted against the morning glow. She whispers to herself, voice barely audible over the ambient sound.",
        actionHighlights: [
          { text: "Danielle", type: "character" },
          { text: "window", type: "location" },
          { text: "silhouetted", type: "mood" },
          { text: "morning glow", type: "location" },
        ],
        cameraNotes: "Wide silhouette shot, backlit by window. Slow dolly left. High contrast, crushed blacks.",
        soundCues: ["Wind through gap", "Whispered dialogue"],
        cast: [DANIELLE],
        props: [],
      },
      {
        id: 304, title: "Walking to kitchen", thumbnail: IMG_HAND_KITCHEN, duration: 5,
        action: "She moves to the kitchen counter, her hand trailing along the cold surface. The letter and a half-empty coffee mug sit waiting — artifacts of a sleepless night.",
        actionHighlights: [
          { text: "kitchen counter", type: "location" },
          { text: "letter", type: "mood" },
          { text: "sleepless", type: "mood" },
        ],
        cameraNotes: "Tracking shot following hand on counter. Insert of letter + coffee mug. 85mm, shallow DOF.",
        soundCues: ["Footsteps on tile", "Coffee mug clink"],
        cast: [DANIELLE],
        props: [COFFEE, LETTER, PHONE],
      },
      {
        id: 305, title: "The empty apartment", thumbnail: IMG_APARTMENT, duration: 5,
        action: "Wide shot of the entire apartment — Danielle small against the vast, somber space. Morning light creates long shadows across the floor. She picks up the rotary phone and dials.",
        actionHighlights: [
          { text: "Danielle", type: "character" },
          { text: "apartment", type: "location" },
          { text: "somber", type: "mood" },
          { text: "rotary phone", type: "mood" },
        ],
        internalMonologue: "Maybe it's time I stop waiting for permission.",
        monologueCharacter: "Danielle",
        cameraNotes: "Extreme wide, static tripod. Desaturated grade, only warm tones in sunbeam. 24mm.",
        soundCues: ["Rotary dial clicks", "Piano resolves to silence"],
        cast: [DANIELLE],
        props: [PHONE, COFFEE],
      },
    ],
  },
  {
    id: 4,
    title: "Streets at midnight",
    thumbnail: IMG_SCENE4,
    shots: [
      {
        id: 401, title: "Neon reflections", thumbnail: IMG_SCENE4, duration: 5,
        action: "Rain-slicked streets reflect neon signs. The city hums with a nocturnal energy.",
        actionHighlights: [
          { text: "neon signs", type: "location" },
          { text: "nocturnal", type: "mood" },
        ],
        cameraNotes: "Slow tracking shot at street level. Anamorphic flares from neon. 40mm.",
        soundCues: ["Rain on asphalt", "Distant sirens"],
        cast: [], props: [],
      },
      {
        id: 402, title: "Danielle runs", thumbnail: IMG_SCENE6, duration: 6,
        action: "Danielle hurries through the dark streets, coat pulled tight. She glances over her shoulder.",
        actionHighlights: [
          { text: "Danielle", type: "character" },
          { text: "dark streets", type: "location" },
        ],
        cameraNotes: "Handheld chase cam, slightly behind. Shallow focus, motion blur.",
        soundCues: ["Heels on wet pavement", "Heavy breathing"],
        cast: [DANIELLE], props: [],
      },
      {
        id: 403, title: "Under the streetlight", thumbnail: IMG_SCENE4, duration: 4,
        action: "She stops under a lone streetlight, catching her breath. The yellow glow forms a halo around her.",
        actionHighlights: [
          { text: "streetlight", type: "location" },
          { text: "halo", type: "mood" },
        ],
        cameraNotes: "Wide shot, centered composition. Practical streetlight as key light.",
        soundCues: ["Streetlight buzz", "Rain easing"],
        cast: [DANIELLE], props: [],
      },
    ],
  },
  {
    id: 5,
    title: "The confrontation",
    thumbnail: IMG_SCENE5,
    shots: [
      {
        id: 501, title: "Café meeting", thumbnail: IMG_SCENE5, duration: 5,
        action: "Danielle and Wilburn face each other across a small café table. The tension is palpable.",
        actionHighlights: [
          { text: "Danielle", type: "character" },
          { text: "Wilburn", type: "character" },
          { text: "café table", type: "location" },
          { text: "tension", type: "mood" },
        ],
        cameraNotes: "Two-shot, slightly low angle. Warm practicals in background. 50mm.",
        soundCues: ["Café ambience", "Espresso machine"],
        cast: [DANIELLE, WILBURN], props: [COFFEE],
      },
      {
        id: 502, title: "Words exchanged", thumbnail: IMG_SCENE5, duration: 6,
        action: "Danielle slides the letter across the table. Wilburn's expression hardens as he reads.",
        actionHighlights: [
          { text: "Danielle", type: "character" },
          { text: "letter", type: "mood" },
          { text: "Wilburn's", type: "character" },
        ],
        cameraNotes: "Shot-reverse-shot pattern. Tight close-ups. Shallow DOF.",
        soundCues: ["Paper slide", "Silence"],
        cast: [DANIELLE, WILBURN], props: [LETTER, COFFEE],
      },
      {
        id: 503, title: "Wilburn stands", thumbnail: IMG_SCENE2, duration: 4,
        action: "Wilburn pushes back from the table, standing abruptly. His chair scrapes against the floor.",
        actionHighlights: [
          { text: "Wilburn", type: "character" },
        ],
        cameraNotes: "Low angle looking up at Wilburn. Quick dolly back as he rises.",
        soundCues: ["Chair scrape", "Tense string hit"],
        cast: [WILBURN], props: [],
      },
      {
        id: 504, title: "Danielle holds firm", thumbnail: IMG_SCENE1, duration: 5,
        action: "Danielle remains seated, calm and resolute. She meets his gaze without flinching.",
        actionHighlights: [
          { text: "Danielle", type: "character" },
          { text: "calm", type: "mood" },
          { text: "resolute", type: "mood" },
        ],
        internalMonologue: "I've already decided. There's nothing you can take from me now.",
        monologueCharacter: "Danielle",
        cameraNotes: "Close-up on Danielle's eyes. Static. Steady. Power in stillness.",
        soundCues: ["Heartbeat", "Piano chord"],
        cast: [DANIELLE], props: [],
      },
    ],
  },
  {
    id: 6,
    title: "Danielle walks away",
    thumbnail: IMG_SCENE6,
    shots: [
      {
        id: 601, title: "The exit", thumbnail: IMG_SCENE6, duration: 6,
        action: "Danielle walks out of the café into the rain. She doesn't look back.",
        actionHighlights: [
          { text: "Danielle", type: "character" },
          { text: "café", type: "location" },
          { text: "rain", type: "mood" },
        ],
        cameraNotes: "Follow shot from behind, gradually widening. Rain backlighting.",
        soundCues: ["Rain", "Café door closing"],
        cast: [DANIELLE], props: [],
      },
      {
        id: 602, title: "Into the distance", thumbnail: IMG_SCENE6, duration: 5,
        action: "Wide shot: Danielle's figure grows small as she walks down the empty street. The rain continues to fall.",
        actionHighlights: [
          { text: "Danielle's", type: "character" },
          { text: "empty street", type: "location" },
        ],
        cameraNotes: "Extreme wide, static. Let her walk out of frame. Hold on empty street for 2 beats.",
        soundCues: ["Rain intensifying", "Final piano note fades"],
        cast: [DANIELLE], props: [],
      },
      {
        id: 603, title: "Margaret watches", thumbnail: IMG_EMOTIONAL, duration: 4,
        action: "Inside the café, Margaret watches through the rain-streaked window. A quiet, knowing smile crosses her face.",
        actionHighlights: [
          { text: "Margaret", type: "character" },
          { text: "café", type: "location" },
          { text: "rain-streaked window", type: "location" },
          { text: "knowing", type: "mood" },
        ],
        cameraNotes: "Medium close-up through window glass. Rain drops in foreground. Warm interior light.",
        soundCues: ["Muffled rain", "Warm ambient chord"],
        cast: [MARGARET], props: [COFFEE],
      },
    ],
  },
];

// ── App ─────────────────────────────────────────────────────────────
export default function App() {
  const [expandedSceneId, setExpandedSceneId] = useState<number | null>(3);
  const [selectedShotId, setSelectedShotId] = useState<number | null>(301);

  // Derived data
  const expandedScene = useMemo(
    () => scenes.find((s) => s.id === expandedSceneId) ?? null,
    [expandedSceneId]
  );
  const selectedShot = useMemo(() => {
    if (!expandedScene || selectedShotId === null) return null;
    return expandedScene.shots.find((s) => s.id === selectedShotId) ?? null;
  }, [expandedScene, selectedShotId]);

  const selectedShotIndex = useMemo(() => {
    if (!expandedScene || !selectedShot) return 1;
    return expandedScene.shots.findIndex((s) => s.id === selectedShot.id) + 1;
  }, [expandedScene, selectedShot]);

  // Handlers
  const handleSelectScene = useCallback((sceneId: number) => {
    const scene = scenes.find((s) => s.id === sceneId);
    setExpandedSceneId(sceneId);
    if (scene && scene.shots.length > 0) {
      setSelectedShotId(scene.shots[0].id);
    }
  }, []);

  const handleSelectShot = useCallback((shotId: number) => {
    setSelectedShotId(shotId);
    // If the shot belongs to a different scene (e.g. from timeline), expand that scene
    for (const scene of scenes) {
      if (scene.shots.some((s) => s.id === shotId)) {
        setExpandedSceneId(scene.id);
        break;
      }
    }
  }, []);

  const handleBack = useCallback(() => {
    setExpandedSceneId(null);
    setSelectedShotId(null);
  }, []);

  return (
    <div
      className="size-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: "#0D0E14",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ── Header / Navigation Bar ─────────────────────────── */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          backgroundColor: "#0D0E14",
          borderBottom: "1px solid #252933",
          height: 48,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Left: Back + Movie Title */}
        <div className="flex items-center gap-3 pl-4 pr-6 flex-shrink-0">
          <button
            className="flex items-center justify-center cursor-pointer transition-colors"
            style={{ color: "#777076" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#777076"; }}
          >
            <ArrowLeft size={18} />
          </button>
          <span
            style={{
              fontSize: 14,
              color: "#ffffff",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            The Silent Protocol
          </span>
        </div>

        {/* Center: Pipeline Steps */}
        <div className="flex-1 flex items-center justify-center gap-0">
          {/* Step 1 */}
          <button
            className="flex items-center gap-2 px-4 h-full cursor-pointer transition-colors"
            style={{ color: "#60515C", fontSize: 13, height: 48 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#777076"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#60515C"; }}
          >
            <Users size={14} />
            <span style={{ whiteSpace: "nowrap" }}>Cast, Locations, Props</span>
          </button>

          {/* Connector */}
          <div
            className="flex-shrink-0"
            style={{ width: 24, height: 1, backgroundColor: "#404556" }}
          />

          {/* Step 2 — Active */}
          <div
            className="flex items-center gap-2 px-5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: "#597D7C",
              height: 30,
              fontSize: 13,
              color: "#0D0E14",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <Clapperboard size={14} />
            <span>Review Scene & Shot Information</span>
          </div>

          {/* Connector */}
          <div
            className="flex-shrink-0"
            style={{ width: 24, height: 1, backgroundColor: "#404556" }}
          />

          {/* Step 3 */}
          <button
            className="flex items-center gap-2 px-4 h-full cursor-pointer transition-colors"
            style={{ color: "#60515C", fontSize: 13, height: 48 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#777076"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#60515C"; }}
          >
            <Film size={14} />
            <span style={{ whiteSpace: "nowrap" }}>Generate and Edit Film</span>
          </button>
        </div>

        {/* Right: Utility Buttons */}
        <div className="flex items-center gap-1 pr-4 flex-shrink-0">
          {/* Credits */}
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
            style={{ color: "#597D7C", fontSize: 12 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#252933"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <Coins size={14} />
            <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>0</span>
          </button>

          {/* Download */}
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors"
            style={{ color: "#777076" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#252933";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#777076";
            }}
          >
            <Download size={16} />
          </button>

          {/* Script */}
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors"
            style={{ color: "#777076" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#252933";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#777076";
            }}
          >
            <FileText size={16} />
          </button>

          {/* Settings */}
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors"
            style={{ color: "#777076" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#252933";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#777076";
            }}
          >
            <Settings size={16} />
          </button>

          {/* Share */}
          <button
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cursor-pointer transition-colors ml-1"
            style={{
              backgroundColor: "#252933",
              border: "1px solid #404556",
              color: "#777076",
              fontSize: 12,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#404556";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#252933";
              e.currentTarget.style.color = "#777076";
            }}
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Scene / Shot Sidebar — full page height */}
        <div
          className="flex-shrink-0"
          style={{ borderRight: "1px solid #252933" }}
        >
          <SceneSidebar
            scenes={scenes}
            expandedSceneId={expandedSceneId}
            selectedShotId={selectedShotId}
            onSelectScene={handleSelectScene}
            onSelectShot={handleSelectShot}
            onBack={handleBack}
          />
        </div>

        {/* Right Side */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Upper Content Area */}
          <div className="flex-1 flex min-h-0">
            {/* Shot Editor (or empty state) */}
            <div
              className="flex-1 min-w-0 min-h-0 overflow-hidden"
              style={{ borderRight: "1px solid #252933" }}
            >
              {selectedShot && expandedScene ? (
                <ShotEditor
                  shot={selectedShot}
                  sceneNumber={expandedScene.id}
                  shotIndex={selectedShotIndex}
                  totalShots={expandedScene.shots.length}
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center h-full gap-3"
                  style={{ backgroundColor: "#0D0E14" }}
                >
                  <Film size={32} style={{ color: "#404556" }} />
                  <span style={{ fontSize: 13, color: "#404556" }}>
                    Select a scene to begin editing
                  </span>
                </div>
              )}
            </div>

            {/* Video Preview */}
            <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
              <VideoPreview
                previewImage={selectedShot?.thumbnail ?? IMG_SCENE3}
                shotLabel={
                  selectedShot && expandedScene
                    ? `Scene ${expandedScene.id} — Shot ${selectedShotIndex} of ${expandedScene.shots.length}`
                    : undefined
                }
                shotDuration={selectedShot?.duration}
              />
            </div>
          </div>

          {/* Shot Timeline — full bottom width */}
          {expandedScene && (
            <ShotTimeline
              shots={expandedScene.shots}
              selectedShotId={selectedShotId}
              sceneNumber={expandedScene.id}
              onSelectShot={handleSelectShot}
            />
          )}
        </div>
      </div>
    </div>
  );
}