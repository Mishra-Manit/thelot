"use client"

import { useRef, useEffect, useState, Suspense } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { EffectComposer } from "@react-three/postprocessing"
import { useVideoTexture } from "@react-three/drei"
import { Vector2 } from "three"
import { AsciiEffect } from "../../ascii-effect"

// Full-screen video plane — fills whatever the viewport is via useThree
function VideoPlane({ cellSize, resolution }: { cellSize: number; resolution: Vector2 }) {
  const texture = useVideoTexture("/ascii-base/spongebob.mp4", {
    loop: true,
    muted: true,
    start: true,
    crossOrigin: "anonymous",
  })

  const { viewport } = useThree()

  // Guard against unloaded video metadata producing NaN aspect ratio
  const rawVideoAspect = texture.image.videoWidth / texture.image.videoHeight
  const videoAspect = Number.isFinite(rawVideoAspect) && rawVideoAspect > 0 ? rawVideoAspect : 16 / 9

  // Calculate dimensions to maintain aspect ratio (contain)
  const viewportAspect = viewport.width / viewport.height

  let planeWidth = viewport.width
  let planeHeight = viewport.height

  if (viewportAspect > videoAspect) {
    // Viewport is wider than video -> constrain by height
    planeWidth = viewport.height * videoAspect
  } else {
    // Viewport is taller than video -> constrain by width
    planeHeight = viewport.width / videoAspect
  }

  return (
    <>
      <mesh>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <EffectComposer>
        <AsciiEffect
          style="dense"
          cellSize={cellSize}
          invert={false}
          color={true}
          resolution={resolution}
          postfx={{
            brightnessAdjust: 0.1,
            contrastAdjust: 0.85,
            colorPalette: 0,
          }}
        />
      </EffectComposer>
    </>
  )
}

export interface SpongebobLoadingProps {
  label?: string
  compact?: boolean
}

export function SpongebobLoading({ label, compact = false }: SpongebobLoadingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Start as null so the Canvas only renders once we have real container dimensions,
  // preventing the 400×300 → actual-size jump that caused the initial glitch.
  const [resolution, setResolution] = useState<Vector2 | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => {
      const { width, height } = container.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setResolution(new Vector2(width, height))
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Use a fine cell grid for high sharpness
  const cellSize = 3

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ background: "#000" }}>
      {resolution && (
        <Canvas
          orthographic
          camera={{ zoom: 1, position: [0, 0, 100] }}
          gl={{ antialias: false, powerPreference: "low-power" }}
          dpr={1}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <Suspense fallback={null}>
            <VideoPlane cellSize={cellSize} resolution={resolution} />
          </Suspense>
        </Canvas>
      )}

      {label && (
        <span
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "10px",
            color: "#D9D9D9",
            letterSpacing: "0.02em",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
