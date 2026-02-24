"use client"

import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const DISMISS_AFTER_MS = 6000

interface GeneratingToastProps {
  nextShotNumber: number | null
  onNavigate: () => void
  onDismiss: () => void
}

// Large Framer Motion toast that slides in from the top-right.
// Clicking anywhere on it navigates to the next shot.
// Auto-dismisses after DISMISS_AFTER_MS.
export function GeneratingToast({ nextShotNumber, onNavigate, onDismiss }: GeneratingToastProps) {
  const visible = nextShotNumber !== null

  useEffect(() => {
    if (!visible) return
    const timer = window.setTimeout(onDismiss, DISMISS_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [visible, onDismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 72, y: -6 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 72 }}
          transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.9 }}
          onClick={() => {
            onNavigate()
            onDismiss()
          }}
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: "64px",
            right: "20px",
            zIndex: 200,
            background: "#111111",
            border: "1px solid #464646",
            borderRadius: "10px",
            padding: "16px 18px",
            width: "300px",
            cursor: "pointer",
            boxShadow: "0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
            userSelect: "none",
          }}
          whileHover={{ borderColor: "#696969", scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Pulsing dot indicator */}
          <div className="flex items-center gap-2" style={{ marginBottom: "8px" }}>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#ffffff",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "10px",
                color: "#696969",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                fontWeight: 600,
              }}
            >
              Generating
            </span>
          </div>

          <p style={{ fontSize: "13px", color: "#D9D9D9", lineHeight: 1.55, margin: "0 0 10px 0" }}>
            Your start frame is generating, estimated 20 seconds.
          </p>

          <div
            className="flex items-center gap-2"
            style={{
              paddingTop: "10px",
              borderTop: "1px solid #232323",
            }}
          >
            <span style={{ fontSize: "12px", color: "#ffffff", fontWeight: 500 }}>
              Work on shot {nextShotNumber} in the meantime
            </span>
            <motion.div
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight size={16} style={{ color: "#ffffff" }} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
