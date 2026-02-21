"use client"

import { ArrowLeft, Coins, Download, FileText, Rewind, Settings, Share2 } from "lucide-react"

interface HeaderBarProps {
  onRewindSimulation: () => void
  canRewindSimulation: boolean
}

export function HeaderBar({ onRewindSimulation, canRewindSimulation }: HeaderBarProps) {
  return (
    <header
      className="flex items-center h-[48px] w-full shrink-0"
      style={{
        background: "#000000",
        borderBottom: "1px solid #232323",
      }}
    >
      {/* Left group */}
      <div className="flex items-center gap-3 pl-4">
        <button
          className="transition-colors duration-150"
          style={{ color: "#D9D9D9" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#D9D9D9")}
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <span
          className="font-serif"
          style={{ color: "#ffffff", fontSize: "14px", fontWeight: 500 }}
        >
          The Lot
        </span>
      </div>

      {/* Right group */}
      <div className="flex items-center gap-1 pr-4">
        {/* Credits */}
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors duration-150"
          style={{ color: "#D9D9D9", fontWeight: 600, fontSize: "12px" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#232323")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Coins size={14} />
          <span>0</span>
        </button>

        {/* Icon buttons */}
        {[Download, FileText, Settings].map((Icon, i) => (
          <button
            key={i}
            className="flex items-center justify-center rounded-lg transition-colors duration-150"
            style={{
              width: "32px",
              height: "32px",
              color: "#D9D9D9",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#232323"
              e.currentTarget.style.color = "#ffffff"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "#D9D9D9"
            }}
            aria-label={Icon.displayName}
          >
            <Icon size={16} />
          </button>
        ))}

        <button
          className="flex items-center justify-center rounded-lg transition-colors duration-150"
          style={{
            width: "32px",
            height: "32px",
            color: canRewindSimulation ? "#D9D9D9" : "#4A4A4A",
            cursor: canRewindSimulation ? "pointer" : "not-allowed",
          }}
          onMouseEnter={(e) => {
            if (!canRewindSimulation) return
            e.currentTarget.style.background = "#232323"
            e.currentTarget.style.color = "#ffffff"
          }}
          onMouseLeave={(e) => {
            if (!canRewindSimulation) return
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = "#D9D9D9"
          }}
          onClick={onRewindSimulation}
          disabled={!canRewindSimulation}
          aria-label="Rewind simulation"
          title="Rewind simulation"
        >
          <Rewind size={16} />
        </button>

        {/* Share button */}
        <button
          className="flex items-center gap-1.5 rounded-full transition-colors duration-150 ml-1"
          style={{
            background: "#232323",
            border: "1px solid #696969",
            color: "#D9D9D9",
            fontSize: "12px",
            fontWeight: 500,
            padding: "6px 14px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#696969"
            e.currentTarget.style.color = "#ffffff"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#232323"
            e.currentTarget.style.color = "#D9D9D9"
          }}
        >
          <Share2 size={13} />
          <span>Share</span>
        </button>
      </div>
    </header>
  )
}
