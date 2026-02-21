export interface Shot {
  id: number
  number: number
  title: string
  duration: number
  action: string
  monologue: string
  cameraNotes: string
  videoClip: string
  startFramePrompt: string
  videoPrompt: string
}

export interface Scene {
  id: number
  number: number
  title: string
  shots: Shot[]
}

export const SAMPLE_SCENES: Scene[] = [
  {
    id: 1,
    number: 1,
    title: "Danielle's Realization",
    shots: [
      {
        id: 101,
        number: 1,
        title: "Morning light",
        duration: 6,
        action: "Danielle wakes up, light streaming through the curtains.",
        monologue: 'Danielle [thinking]: "Another day. Same silence."',
        cameraNotes: "Wide shot, natural light. 50mm, f/1.8.",
        videoClip: "— none —",
        startFramePrompt: "Danielle waking up in soft morning light. Cinematic, warm tones.",
        videoPrompt: "Danielle waking up, light streaming through curtains. Wide shot.",
      },
      {
        id: 102,
        number: 2,
        title: "Mirror reflection",
        duration: 4,
        action: "She stares at herself in the bathroom mirror.",
        monologue: 'Danielle [thinking]: "Who even am I anymore?"',
        cameraNotes: "Close-up on mirror reflection. Shallow DOF.",
        videoClip: "— none —",
        startFramePrompt: "Close-up of a woman's face reflected in a bathroom mirror. Moody.",
        videoPrompt: "Danielle staring at her reflection. Close-up, shallow depth of field.",
      },
    ],
  },
  {
    id: 2,
    number: 2,
    title: "Dismissal",
    shots: [
      {
        id: 201,
        number: 1,
        title: "Office confrontation",
        duration: 8,
        action: "Her manager dismisses her concerns in a brief meeting.",
        monologue: 'Danielle [thinking]: "They never listen."',
        cameraNotes: "Over-the-shoulder shot. Fluorescent lighting.",
        videoClip: "— none —",
        startFramePrompt: "Office meeting room, tense atmosphere. Cinematic fluorescent lighting.",
        videoPrompt: "A tense office meeting. Over-the-shoulder shot of a woman being dismissed.",
      },
    ],
  },
  {
    id: 3,
    number: 3,
    title: "Support for Protocol",
    shots: [
      {
        id: 301,
        number: 1,
        title: "Window gazing",
        duration: 5,
        action:
          "Danielle sits alone, gazing softly into the morning light filtering through the apartment window. Her face slowly reveals the emotional weight of years of struggle to assert herself.",
        monologue:
          'Danielle [thinking]: "I used to think that if I tried hard enough, things would just\u2026 work out. But the world doesn\u2019t reward patience the way they promised."',
        cameraNotes:
          "Medium close-up, steady tripod. The camera holds, allowing silence to speak. 35mm anamorphic, f/2.0. Warm color grade.",
        videoClip: "— none —",
        startFramePrompt:
          "Danielle sits alone, gazing softly into the morning light. Cinematic lighting, film grain.",
        videoPrompt:
          "Danielle sits alone, gazing softly into the morning light filtering through the apartment window. Camera: Medium close-up, steady tripod.",
      },
      {
        id: 302,
        number: 2,
        title: "Emotional close-up",
        duration: 4,
        action:
          "A tear rolls down her cheek as she processes the weight of the moment.",
        monologue:
          'Danielle [thinking]: "Maybe it\u2019s not about being heard. Maybe it\u2019s about finally hearing myself."',
        cameraNotes:
          "Extreme close-up on her face. Rack focus from eyes to lips. 85mm, f/1.4. Desaturated tones.",
        videoClip: "— none —",
        startFramePrompt:
          "Extreme close-up of a woman's face, a single tear. Desaturated cinematic tones.",
        videoPrompt:
          "A tear rolling down a woman's cheek. Extreme close-up, rack focus. Desaturated.",
      },
      {
        id: 303,
        number: 3,
        title: "Whispered confession",
        duration: 5,
        action:
          "She whispers something to herself, barely audible, a private confession.",
        monologue:
          'Danielle [whispering]: "I deserve better than this."',
        cameraNotes:
          "Tight close-up, handheld slight movement. Intimate framing. 40mm, f/2.0. Warm shadows.",
        videoClip: "— none —",
        startFramePrompt:
          "A woman whispering to herself in a dimly lit room. Intimate, cinematic.",
        videoPrompt:
          "A woman whispering a private confession. Tight close-up, handheld, warm shadows.",
      },
      {
        id: 304,
        number: 4,
        title: "Walking to kitchen",
        duration: 5,
        action:
          "She rises from the window seat and walks slowly to the kitchen, each step deliberate.",
        monologue:
          'Danielle [thinking]: "One foot in front of the other. That\u2019s all I can do."',
        cameraNotes:
          "Tracking shot following her from behind. Steadicam. 24mm, f/2.8. Cool morning tones.",
        videoClip: "— none —",
        startFramePrompt:
          "A woman rising from a window seat, walking towards a kitchen. Tracking shot.",
        videoPrompt:
          "A woman walking slowly to the kitchen, seen from behind. Steadicam tracking shot. Cool tones.",
      },
      {
        id: 305,
        number: 5,
        title: "The empty apartment",
        duration: 5,
        action:
          "Wide shot of the apartment, empty and quiet. The morning light fills the space.",
        monologue: "",
        cameraNotes:
          "Wide establishing shot. Static camera on tripod. 16mm, f/5.6. Natural light only. Long take.",
        videoClip: "— none —",
        startFramePrompt:
          "Wide shot of an empty, sunlit apartment. Quiet and still. Film grain.",
        videoPrompt:
          "Wide shot of an empty apartment filled with morning light. Static camera, long take.",
      },
    ],
  },
]
