"use client"

import { Mic, Check } from "lucide-react"

interface StepPolishProps {
  internalMonologue: string
  isVoiceLoading: boolean
  isVoiceReady: boolean
  isLipsyncLoading: boolean
  isLipsyncReady: boolean
  onGenerateVoice: () => void
  onApplyLipsync: () => void
}

function SectionLabel({ children, isReady }: { children: string; isReady?: boolean }) {
  return (
    <div className="flex items-center gap-2" style={{ marginBottom: "10px" }}>
      <span
        style={{
          fontSize: "13px",
          color: "#D9D9D9",
          fontWeight: 500,
          fontFamily: "var(--font-inter)",
        }}
      >
        {children}
      </span>
      {isReady && (
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: "16px", height: "16px", background: "rgba(217,217,217,0.1)", border: "1px solid #696969" }}
        >
          <Check size={9} color="#D9D9D9" strokeWidth={2.5} />
        </div>
      )}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid #232323",
        borderRadius: "8px",
        padding: "12px",
      }}
    >
      {children}
    </div>
  )
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 transition-all duration-150"
      style={{
        background: "transparent",
        border: `1px solid ${disabled ? "#404040" : "#D9D9D9"}`,
        borderRadius: "6px",
        padding: "8px 14px",
        color: disabled ? "#404040" : "#D9D9D9",
        fontSize: "12px",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        flex: "0 0 auto",
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.background = "rgba(255,255,255,0.04)"
        e.currentTarget.style.borderColor = "#ffffff"
        e.currentTarget.style.color = "#ffffff"
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.background = "transparent"
        e.currentTarget.style.borderColor = "#D9D9D9"
        e.currentTarget.style.color = "#D9D9D9"
      }}
    >
      {children}
    </button>
  )
}

function SecondaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 transition-all duration-150"
      style={{
        background: "transparent",
        border: `1px solid ${disabled ? "#404040" : "#232323"}`,
        borderRadius: "6px",
        padding: "8px 14px",
        color: disabled ? "#404040" : "#696969",
        fontSize: "12px",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        flex: "0 0 auto",
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.borderColor = "#696969"
        e.currentTarget.style.color = "#D9D9D9"
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.borderColor = "#232323"
        e.currentTarget.style.color = "#696969"
      }}
    >
      {children}
    </button>
  )
}

export function StepPolish({
  internalMonologue,
  isVoiceLoading,
  isVoiceReady,
  isLipsyncLoading,
  isLipsyncReady,
  onGenerateVoice,
  onApplyLipsync,
}: StepPolishProps) {
  const lipsyncDisabled = !isVoiceReady || isLipsyncLoading || isLipsyncReady

  return (
    <div className="flex flex-col min-h-0 overflow-y-auto" style={{ padding: "16px" }}>

      <span
        style={{
          fontSize: "11px",
          color: "#696969",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
          display: "block",
          marginBottom: "10px",
        }}
      >
        Polish
      </span>

      {/* Voice generation card */}
      <Card>
        <SectionLabel isReady={isVoiceReady}>Voice Generation</SectionLabel>

        {/* Monologue preview */}
        <div style={{ marginBottom: "10px" }}>
          {internalMonologue ? (
            <p
              style={{
                fontSize: "12px",
                color: "#696969",
                lineHeight: 1.6,
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {internalMonologue}
            </p>
          ) : (
            <p style={{ fontSize: "12px", color: "#404040", fontStyle: "italic", margin: 0 }}>
              No monologue in this shot
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <PrimaryButton
            onClick={onGenerateVoice}
            disabled={isVoiceLoading || isVoiceReady}
          >
            <Mic size={12} />
            {isVoiceLoading ? "Generating..." : isVoiceReady ? "V.O. Ready" : "Generate V.O."}
          </PrimaryButton>

          <SecondaryButton disabled={isVoiceLoading}>
            Upload Audio
          </SecondaryButton>
        </div>
      </Card>

      {/* Lip sync card */}
      <div style={{ marginTop: "12px" }}>
        <Card>
          <SectionLabel isReady={isLipsyncReady}>Lip Sync</SectionLabel>

          <p style={{ fontSize: "12px", color: "#696969", margin: "0 0 10px 0", lineHeight: 1.5 }}>
            Sync video lip movement to audio.
          </p>

          <button
            type="button"
            onClick={onApplyLipsync}
            disabled={lipsyncDisabled}
            className="w-full flex items-center justify-center gap-2 transition-all duration-150"
            style={{
              background: "transparent",
              border: `1px solid ${lipsyncDisabled ? "#404040" : "#D9D9D9"}`,
              borderRadius: "6px",
              padding: "8px 14px",
              color: lipsyncDisabled ? "#404040" : "#D9D9D9",
              fontSize: "12px",
              fontWeight: 500,
              cursor: lipsyncDisabled ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (lipsyncDisabled) return
              e.currentTarget.style.background = "rgba(255,255,255,0.04)"
              e.currentTarget.style.borderColor = "#ffffff"
              e.currentTarget.style.color = "#ffffff"
            }}
            onMouseLeave={(e) => {
              if (lipsyncDisabled) return
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.borderColor = "#D9D9D9"
              e.currentTarget.style.color = "#D9D9D9"
            }}
          >
            {isLipsyncLoading ? "Applying..." : isLipsyncReady ? "Lip Sync Applied" : "Apply Lip Sync"}
          </button>
        </Card>
      </div>

    </div>
  )
}
