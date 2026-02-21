import { useState } from "react";
import {
  Clock,
  Volume2,
  Camera,
  Brain,
  Clapperboard,
  Sparkles,
  Image,
  Play,
  GripVertical,
} from "lucide-react";

interface CastMember {
  name: string;
  role: string;
  image: string;
}

interface Prop {
  name: string;
  image: string;
}

export interface ShotData {
  id: number;
  title: string;
  thumbnail: string;
  duration: number;
  action: string;
  actionHighlights?: { text: string; type: "character" | "location" | "mood" }[];
  internalMonologue?: string;
  monologueCharacter?: string;
  cameraNotes: string;
  soundCues: string[];
  cast: CastMember[];
  props: Prop[];
}

interface ShotEditorProps {
  shot: ShotData;
  sceneNumber: number;
  shotIndex: number;
  totalShots: number;
}

// A single hoverable document block — shows a drag handle and subtle
// left accent on hover, like Notion's block system.
function EditorBlock({
  children,
  accentColor,
}: {
  children: React.ReactNode;
  accentColor?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex"
      style={{ marginLeft: -28 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle gutter */}
      <div
        className="flex-shrink-0 flex items-start justify-center pt-1"
        style={{
          width: 28,
          opacity: hovered ? 0.45 : 0,
          transition: "opacity 150ms",
          color: "#404556",
          cursor: "grab",
        }}
      >
        <GripVertical size={14} />
      </div>

      {/* Content with left accent bar on hover */}
      <div
        className="flex-1 min-w-0 rounded-md transition-colors"
        style={{
          borderLeft: `2px solid ${hovered ? accentColor ?? "#404556" : "transparent"}`,
          paddingLeft: 12,
          paddingTop: 2,
          paddingBottom: 2,
          backgroundColor: hovered ? "#ffffff04" : "transparent",
          transition: "border-color 150ms, background-color 150ms",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Prompt textarea block — styled like an editable text area with a
// ghost placeholder and sparkle icon. Purely visual.
function PromptBlock({
  label,
  icon,
  placeholder,
  value,
  accentColor,
}: {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  accentColor: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 6 }}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ paddingLeft: 2 }}>
        <span style={{ color: accentColor, display: "flex" }}>{icon}</span>
        <span
          style={{
            fontSize: 10,
            color: accentColor,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <div
        className="rounded-lg transition-all"
        style={{
          backgroundColor: focused ? "#17292B" : "#0D0E14",
          border: `1px solid ${focused ? accentColor + "55" : "#17292B"}`,
          padding: "10px 14px",
          minHeight: 56,
          cursor: "text",
          transition: "border-color 200ms, background-color 200ms",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        tabIndex={0}
      >
        <p
          style={{
            fontSize: 13,
            lineHeight: "1.7",
            color: value ? "#777076" : "#404556",
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontStyle: value ? "normal" : "italic",
            margin: 0,
          }}
        >
          {value || placeholder}
        </p>
      </div>
    </div>
  );
}

export function ShotEditor({ shot, sceneNumber, shotIndex, totalShots }: ShotEditorProps) {
  const highlightColors: Record<string, string> = {
    character: "#597D7C",
    location: "#386775",
    mood: "#777076",
  };

  const highlightBgs: Record<string, string> = {
    character: "#597D7C15",
    location: "#38677515",
    mood: "#77707615",
  };

  // Parse action text with inline highlights — styled like inline
  // annotations/mentions in Notion.
  function renderActionText(text: string, highlights?: ShotData["actionHighlights"]) {
    if (!highlights || highlights.length === 0) {
      return <span>{text}</span>;
    }

    let remaining = text;
    const parts: React.ReactNode[] = [];
    let keyIndex = 0;

    for (const hl of highlights) {
      const idx = remaining.indexOf(hl.text);
      if (idx === -1) continue;
      if (idx > 0) {
        parts.push(<span key={`t-${keyIndex++}`}>{remaining.slice(0, idx)}</span>);
      }
      parts.push(
        <span
          key={`h-${keyIndex++}`}
          style={{
            color: highlightColors[hl.type],
            backgroundColor: highlightBgs[hl.type],
            borderRadius: 3,
            padding: "1px 4px",
            margin: "0 1px",
          }}
        >
          {hl.text}
        </span>
      );
      remaining = remaining.slice(idx + hl.text.length);
    }
    if (remaining) {
      parts.push(<span key={`t-${keyIndex}`}>{remaining}</span>);
    }
    return <>{parts}</>;
  }

  // Derive AI prompt values from existing shot data (these would be
  // user-editable in a full product; here we synthesise them).
  const startFramePrompt = `${shot.cast.map((c) => c.name).join(", ") || "Scene"} — ${shot.action.split(".")[0]}.${shot.cameraNotes.includes("Wide") || shot.cameraNotes.includes("wide") ? " Wide composition." : ""} Cinematic lighting, film grain.`;
  const endFramePrompt = `${shot.action.split(".").slice(-2).join(".").trim()} Hold on final expression.${shot.cameraNotes.includes("shallow") || shot.cameraNotes.includes("Shallow") ? " Shallow depth of field." : ""} Moody color grade.`;
  const videoPrompt = `${shot.action} Camera: ${shot.cameraNotes.split(".")[0]}. ${shot.soundCues.length > 0 ? "Audio: " + shot.soundCues.join(", ") + "." : ""}`;

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{
        backgroundColor: "#0D0E14",
        fontFamily: "Inter, sans-serif",
        scrollbarWidth: "thin",
        scrollbarColor: "#404556 transparent",
      }}
    >
      {/* Document body */}
      <div className="flex-1 px-8 py-6" style={{ maxWidth: 720 }}>

        {/* ── Page title area (like Notion page header) ──────── */}
        <div className="mb-1">
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="px-2 py-0.5 rounded"
              style={{
                backgroundColor: "#597D7C18",
                border: "1px solid #597D7C33",
                fontSize: 10,
                color: "#597D7C",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              SCENE {sceneNumber}
            </div>
            <span style={{ color: "#404556" }}>·</span>
            <span style={{ fontSize: 11, color: "#60515C", fontWeight: 400 }}>
              Shot {shotIndex} of {totalShots}
            </span>
            <span style={{ color: "#404556" }}>·</span>
            <div className="flex items-center gap-1">
              <Clock size={11} style={{ color: "#60515C" }} />
              <span
                style={{
                  fontSize: 11,
                  color: "#60515C",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {shot.duration}s
              </span>
            </div>
          </div>
        </div>

        {/* Shot title — large editable-looking heading */}
        <h2
          className="mb-6"
          style={{
            fontSize: 26,
            color: "#eeeeee",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            cursor: "text",
          }}
        >
          {shot.title}
        </h2>

        {/* ── Document blocks ─────────────────────────────────── */}

        {/* Action — main prose paragraph */}
        <div className="mb-5">
          <EditorBlock accentColor="#597D7C">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clapperboard size={12} style={{ color: "#597D7C" }} />
              <span
                style={{
                  fontSize: 10,
                  color: "#597D7C",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Action
              </span>
            </div>
            <p
              style={{
                fontSize: 15,
                lineHeight: "1.85",
                color: "#d4d4d4",
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                cursor: "text",
                margin: 0,
              }}
            >
              {renderActionText(shot.action, shot.actionHighlights)}
            </p>
          </EditorBlock>
        </div>

        {/* Internal Monologue — block-quote style */}
        {shot.internalMonologue && (
          <div className="mb-5">
            <EditorBlock accentColor="#60515C">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Brain size={12} style={{ color: "#60515C" }} />
                <span
                  style={{
                    fontSize: 10,
                    color: "#60515C",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  Internal Monologue
                </span>
              </div>
              <div
                className="rounded-md"
                style={{
                  backgroundColor: "#60515C08",
                  borderLeft: "3px solid #60515C44",
                  padding: "10px 16px",
                }}
              >
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: "1.85",
                    color: "#ccc",
                    fontFamily: "Inter, sans-serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    cursor: "text",
                    margin: 0,
                  }}
                >
                  {shot.monologueCharacter && (
                    <>
                      <span
                        style={{
                          color: "#597D7C",
                          backgroundColor: "#597D7C15",
                          borderRadius: 3,
                          padding: "1px 5px",
                        }}
                      >
                        {shot.monologueCharacter}
                      </span>{" "}
                      <span style={{ color: "#60515C", fontStyle: "normal", fontSize: 12 }}>
                        (thinking)
                      </span>{" "}
                    </>
                  )}
                  "{shot.internalMonologue}"
                </p>
              </div>
            </EditorBlock>
          </div>
        )}

        {/* Camera Notes — code block */}
        <div className="mb-5">
          <EditorBlock accentColor="#404556">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Camera size={12} style={{ color: "#777076" }} />
              <span
                style={{
                  fontSize: 10,
                  color: "#777076",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Camera Notes
              </span>
            </div>
            <div
              className="rounded-md"
              style={{
                backgroundColor: "#17292B",
                border: "1px solid #252933",
                padding: "10px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  lineHeight: "1.7",
                  color: "#777076",
                  fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                  fontWeight: 400,
                  cursor: "text",
                  margin: 0,
                }}
              >
                {shot.cameraNotes}
              </p>
            </div>
          </EditorBlock>
        </div>

        {/* Sound Cues — inline tags */}
        <div className="mb-6">
          <EditorBlock accentColor="#404556">
            <div className="flex items-center gap-1.5 mb-2">
              <Volume2 size={12} style={{ color: "#777076" }} />
              <span
                style={{
                  fontSize: 10,
                  color: "#777076",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Sound Cues
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {shot.soundCues.map((cue, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5"
                  style={{
                    backgroundColor: "#252933",
                    border: "1px solid #404556",
                    fontSize: 12,
                    color: "#777076",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <span style={{ color: "#597D7C", fontSize: 10 }}>♪</span>
                  {cue}
                </span>
              ))}
            </div>
          </EditorBlock>
        </div>

        {/* ── Cast & Props — compact inline row ───────────────── */}
        <div
          className="flex gap-6 mb-7 py-3 px-3 rounded-lg"
          style={{ backgroundColor: "#17292B", border: "1px solid #252933" }}
        >
          {/* Cast */}
          {shot.cast.length > 0 && (
            <div className="flex-1 min-w-0">
              <span
                style={{
                  fontSize: 10,
                  color: "#597D7C",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Cast
              </span>
              <div className="flex gap-3 mt-2">
                {shot.cast.map((member, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="rounded-full overflow-hidden flex-shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        border: "1.5px solid #597D7C44",
                      }}
                    >
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        style={{
                          fontSize: 12,
                          color: "#ddd",
                          fontWeight: 500,
                          lineHeight: 1.2,
                        }}
                      >
                        {member.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#60515C", lineHeight: 1.2 }}>
                        {member.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Props */}
          {shot.props.length > 0 && (
            <div className="flex-1 min-w-0">
              <span
                style={{
                  fontSize: 10,
                  color: "#386775",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Props
              </span>
              <div className="flex gap-3 mt-2">
                {shot.props.map((prop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="rounded-full overflow-hidden flex-shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        border: "1.5px solid #38677533",
                      }}
                    >
                      <img
                        src={prop.image}
                        alt={prop.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span style={{ fontSize: 12, color: "#777076" }}>{prop.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── AI Generation Prompts ───────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} style={{ color: "#597D7C" }} />
            <span
              style={{
                fontSize: 12,
                color: "#597D7C",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              AI Generation Prompts
            </span>
            <div
              className="flex-1"
              style={{ height: 1, backgroundColor: "#252933", marginLeft: 6 }}
            />
          </div>

          <div className="flex flex-col gap-4">
            <PromptBlock
              label="Start Frame"
              icon={<Image size={12} />}
              placeholder="Describe the opening frame of this shot..."
              value={startFramePrompt}
              accentColor="#597D7C"
            />
            <PromptBlock
              label="End Frame"
              icon={<Image size={12} />}
              placeholder="Describe the closing frame of this shot..."
              value={endFramePrompt}
              accentColor="#60515C"
            />
            <PromptBlock
              label="Video"
              icon={<Play size={12} />}
              placeholder="Describe the motion, action, and camera movement for the AI video..."
              value={videoPrompt}
              accentColor="#386775"
            />
          </div>
        </div>

        {/* ── Regenerate button ──────────────────────────────── */}
        <button
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg transition-all cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #597D7C22, #597D7C11)",
            border: "1px solid #597D7C44",
            color: "#597D7C",
            fontSize: 13,
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(135deg, #597D7C33, #597D7C22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(135deg, #597D7C22, #597D7C11)";
          }}
        >
          <Sparkles size={16} />
          Regenerate Shot with AI
        </button>
      </div>
    </div>
  );
}