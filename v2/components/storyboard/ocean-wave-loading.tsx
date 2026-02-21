"use client"

import { useRef, useEffect, useState, Suspense } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { EffectComposer } from "@react-three/postprocessing"
import { useVideoTexture } from "@react-three/drei"
import { Vector2 } from "three"
import { AsciiEffect } from "../ascii-effect"

// Full-screen video plane — fills whatever the viewport is via useThree
function VideoPlane({ cellSize, resolution }: { cellSize: number; resolution: Vector2 }) {
  const texture = useVideoTexture("/ascii-base/spongebob.mp4", {
    loop: true,
    muted: true,
    start: true,
    crossOrigin: "anonymous",
  })

  const { viewport } = useThree()

  return (
    <>
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
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

export interface OceanWaveLoadingProps {
  label?: string
  compact?: boolean
}

export function OceanWaveLoading({ label, compact = false }: OceanWaveLoadingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [resolution, setResolution] = useState(new Vector2(400, 300))

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observe = () => {
      const { width, height } = container.getBoundingClientRect()
      setResolution(new Vector2(width, height))
    }
    observe()
    const ro = new ResizeObserver(observe)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Compact (video overlay) uses a coarser cell grid
  const cellSize = compact ? 5 : 3

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ background: "#000" }}>
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
