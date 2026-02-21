export interface Shot {
  id: number
  number: number
  title: string
  duration: number
  action: string
  monologue: string
  cameraNotes: string
  soundCues: string
  videoClipTitle: string
  videoClip: string
  startFramePrompt: string
  endFramePrompt: string
  videoPrompt: string
}

export interface Scene {
  id: number
  number: number
  title: string
  shots: Shot[]
}

const SCENE_TITLES = [
  "Arrakis Arrival",
  "Gom Jabbar Test",
  "House Atreides Betrayed",
  "Escape into the Desert",
  "First Ride with the Fremen",
]

const SHOT_TEMPLATES: Omit<Shot, "id" | "number">[] = [
  {
    title: "Cinematic Dunes Wide",
    duration: 6,
    action: "A sweeping wide shot establishes the endless desert dunes of Arrakis.",
    monologue: 'Paul [thinking]: "This world feels ancient, dangerous, and alive."',
    cameraNotes: "Ultra-wide lens, low angle, slow push-in, heat haze visible.",
    soundCues: "Low desert wind, distant metallic drone, subtle tension bed.",
    videoClipTitle: "Dunes Cinematic",
    videoClip: "/videos/dunes_cinematic.mp4",
    startFramePrompt:
      "Endless sand dunes at golden hour, cinematic scale, atmospheric haze, 2.39:1.",
    endFramePrompt: "Camera settles on deep dune ridges as wind trails drift across frame.",
    videoPrompt:
      "Aerial-to-low-angle cinematic shot over massive dunes on Arrakis with drifting sand.",
  },
  {
    title: "Paul Close-up",
    duration: 5,
    action: "Close-up on Paul as he processes visions and uncertainty.",
    monologue: 'Paul [thinking]: "Every choice feels like it is already written."',
    cameraNotes: "85mm close-up, shallow depth of field, subtle handheld drift.",
    soundCues: "Muffled heartbeat, breath texture, sparse atmospheric hum.",
    videoClipTitle: "Paul Atreides Close-up",
    videoClip: "/videos/paul_atreides_closeup.mp4",
    startFramePrompt:
      "Intense cinematic close-up of a young man in desert light, expressive eyes.",
    endFramePrompt: "Focus softens into a distant stare as wind sound grows.",
    videoPrompt: "Cinematic close-up portrait of Paul-like character under warm Arrakis light.",
  },
  {
    title: "Ornithopter Flight",
    duration: 7,
    action: "An ornithopter glides above dunes while scanning the horizon.",
    monologue: 'Paul [thinking]: "Survival here depends on reading every sign."',
    cameraNotes: "Tracking shot from rear quarter, then side profile pass.",
    soundCues: "Mechanical rotor flutter, cockpit chatter, wind shear.",
    videoClipTitle: "Flying Ornithopter",
    videoClip: "/videos/flying_ornithopter.mp4",
    startFramePrompt:
      "Futuristic desert aircraft crossing sunlit dunes, cinematic action framing.",
    endFramePrompt: "Aircraft banks toward a storm wall with sand streaking across lens.",
    videoPrompt:
      "Dynamic cinematic shot of ornithopter-style craft flying above Arrakis dunes.",
  },
  {
    title: "Sandworm Emergence",
    duration: 8,
    action: "A colossal sandworm erupts from beneath the sand in a violent plume.",
    monologue: 'Paul [thinking]: "The desert has a will, and we are only passing through it."',
    cameraNotes: "Long lens compression, fast dolly back, shake on impact.",
    soundCues: "Deep sub-bass rumble, sand burst impact, alarm calls.",
    videoClipTitle: "Sandworm Erupting",
    videoClip: "/videos/sandworm_erupting.mp4",
    startFramePrompt: "Massive sandworm breaching from the desert, epic cinematic scale and dust.",
    endFramePrompt:
      "Worm mouth dominates frame before cutting to fleeing figures in the distance.",
    videoPrompt: "Epic sequence of giant sandworm erupting from desert under harsh sun.",
  },
  {
    title: "Battle Momentum",
    duration: 6,
    action: "Rapid battle beats show chaos, tactical movement, and survival under fire.",
    monologue: 'Paul [thinking]: "If we hesitate, we lose everything."',
    cameraNotes: "Mixed handheld and whip-pans, medium telephoto, high contrast.",
    soundCues: "Rhythmic percussion hits, shouts, impacts, metallic reverb tails.",
    videoClipTitle: "Battle Scene",
    videoClip: "/videos/battle_scene.mp4",
    startFramePrompt:
      "Desert battle sequence with kinetic camera and high-contrast cinematic grading.",
    endFramePrompt: "Dust clears over aftermath silhouettes as percussion decays into wind.",
    videoPrompt: "Fast-paced cinematic battle sequence in a desert environment inspired by Dune.",
  },
]

function buildShots(sceneNumber: number): Shot[] {
  return SHOT_TEMPLATES.map((shot, index) => ({
    id: sceneNumber * 100 + (index + 1),
    number: index + 1,
    ...shot,
  }))
}

export const SAMPLE_SCENES: Scene[] = SCENE_TITLES.map((title, index) => ({
  id: index + 1,
  number: index + 1,
  title,
  shots: buildShots(index + 1),
}))
