"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Coins, Download, FileText, Settings, Share2 } from "lucide-react"
import { RenderPill } from "./render-pill"
import type { EditingLevel, RenderingShot, StoryboardScene, StoryboardShot } from "@/lib/storyboard-types"

interface HeaderBarProps {
  editingLevel: EditingLevel
  activeScene: StoryboardScene | undefined
  activeShot: StoryboardShot | undefined
  renderingShots: RenderingShot[]
  onRenderingShotClick: (renderingShot: RenderingShot) => void
  onBackToMovie: () => void
  onBackToScene: () => void
}

// Breadcrumb separator rendered between path segments
function Separator() {
  return (
    <span style={{ color: "#575757", fontSize: "13px", userSelect: "none" }} aria-hidden>
      ›
    </span>
  )
}

// A single clickable breadcrumb segment (parent levels, dimmed)
function BreadcrumbLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="transition-colors duration-150 truncate"
      style={{ color: "#696969", fontSize: "13px", fontWeight: 400, maxWidth: "200px" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#D9D9D9")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#696969")}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

// The active (current level) breadcrumb segment — not clickable, bright
function BreadcrumbActive({ label }: { label: string }) {
  return (
    <motion.span
      className="truncate"
      style={{ color: "#ffffff", fontSize: "13px", fontWeight: 500, maxWidth: "280px" }}
      initial={{ opacity: 0, x: 4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {label}
    </motion.span>
  )
}

export function HeaderBar({
  editingLevel,
  activeScene,
  activeShot,
  renderingShots,
  onRenderingShotClick,
  onBackToMovie,
  onBackToScene,
}: HeaderBarProps) {
  // Back arrow navigates one level up
  const handleBack =
    editingLevel === "shot" ? onBackToScene : editingLevel === "scene" ? onBackToMovie : undefined

  return (
    <header
      className="flex items-center h-[48px] w-full shrink-0"
      style={{ background: "#000000", borderBottom: "1px solid #232323" }}
    >
      {/* Left group: back arrow + breadcrumb */}
      <div className="flex items-center gap-2 pl-4 min-w-0 overflow-hidden">
        <button
          className="shrink-0 transition-colors duration-150"
          style={{ color: handleBack ? "#D9D9D9" : "#464646" }}
          onMouseEnter={(e) => { if (handleBack) e.currentTarget.style.color = "#ffffff" }}
          onMouseLeave={(e) => { if (handleBack) e.currentTarget.style.color = "#D9D9D9" }}
          onClick={handleBack}
          disabled={!handleBack}
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Breadcrumb path */}
        <nav className="flex items-center gap-1.5 min-w-0 overflow-hidden" aria-label="Breadcrumb">
          {editingLevel === "movie" && <BreadcrumbActive label="Movie" />}

          {editingLevel === "scene" && (
            <>
              <BreadcrumbLink label="Movie" onClick={onBackToMovie} />
              <Separator />
              <BreadcrumbActive label={activeScene ? `Scene ${activeScene.number}: ${activeScene.title}` : "Scene"} />
            </>
          )}

          {editingLevel === "shot" && (
            <>
              <BreadcrumbLink label="Movie" onClick={onBackToMovie} />
              <Separator />
              <BreadcrumbLink
                label={activeScene ? `Sc ${activeScene.number}: ${activeScene.title}` : "Scene"}
                onClick={onBackToScene}
              />
              <Separator />
              <BreadcrumbActive label={activeShot ? `Shot ${activeShot.number}: ${activeShot.title}` : "Shot"} />
            </>
          )}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right group */}
      <div className="flex items-center gap-1 pr-4">
        {/* Render queue pills */}
        <div className="flex flex-row-reverse items-center gap-1.5 overflow-hidden max-w-[480px]">
          <AnimatePresence>
            {renderingShots.map((r) => (
              <RenderPill
                key={`${r.shotId}-${r.type}`}
                shotNumber={r.shotNumber}
                type={r.type}
                startedAt={r.startedAt}
                durationMs={r.durationMs}
                isComplete={r.isComplete}
                onClick={() => onRenderingShotClick(r)}
              />
            ))}
          </AnimatePresence>
        </div>

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
            style={{ width: "32px", height: "32px", color: "#D9D9D9" }}
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
