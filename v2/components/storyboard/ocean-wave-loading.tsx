"use client"

import { useRef, useEffect, useState, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { EffectComposer } from "@react-three/postprocessing"
import { Vector2, Group, Mesh } from "three"
import { AsciiEffect } from "../ascii-effect"

// Floating bubble that drifts upward and sways
function Bubble({
  startX,
  startY,
  startZ,
  speed,
  phase,
}: {
  startX: number
  startY: number
  startZ: number
  speed: number
  phase: number
}) {
  const ref = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const cycle = ((t * speed + phase) % 5) - 1
    ref.current.position.set(startX + Math.sin(t * 0.6 + phase) * 0.12, startY + cycle, startZ)
  })

  return (
    <mesh ref={ref} position={[startX, startY, startZ]}>
      <sphereGeometry args={[0.07, 8, 8]} />
      <meshStandardMaterial color="#87CEEB" transparent opacity={0.55} wireframe />
    </mesh>
  )
}

// Boxy SpongeBob character in a waiting/tapping pose
function SpongeBob() {
  const bodyRef = useRef<Group>(null)
  const rightFootRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (bodyRef.current) {
      // Impatient side-to-side sway
      bodyRef.current.rotation.z = Math.sin(t * 1.8) * 0.035
      bodyRef.current.position.y = Math.sin(t * 3.5) * 0.025
    }
    if (rightFootRef.current) {
      // Foot tapping — lifts and drops
      rightFootRef.current.position.y = -1.05 + Math.abs(Math.sin(t * 4)) * 0.2
    }
  })

  const yellow = "#F4C430"
  const darkBrown = "#8B4513"

  return (
    <group ref={bodyRef}>
      {/* Sponge torso */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.1, 1.5, 0.55]} />
        <meshStandardMaterial color={yellow} roughness={0.85} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.95, 0.85, 0.55]} />
        <meshStandardMaterial color={yellow} roughness={0.85} />
      </mesh>

      {/* Eye whites */}
      <mesh position={[-0.21, 1.46, 0.29]}>
        <sphereGeometry args={[0.19, 16, 16]} />
        <meshStandardMaterial color="white" roughness={0.25} />
      </mesh>
      <mesh position={[0.21, 1.46, 0.29]}>
        <sphereGeometry args={[0.19, 16, 16]} />
        <meshStandardMaterial color="white" roughness={0.25} />
      </mesh>

      {/* Pupils */}
      <mesh position={[-0.21, 1.46, 0.48]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#1a3a7a" />
      </mesh>
      <mesh position={[0.21, 1.46, 0.48]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#1a3a7a" />
      </mesh>

      {/* Brown pants */}
      <mesh position={[0, -0.53, 0]}>
        <boxGeometry args={[1.12, 0.55, 0.57]} />
        <meshStandardMaterial color={darkBrown} roughness={0.9} />
      </mesh>

      {/* Belt */}
      <mesh position={[0, -0.24, 0]}>
        <boxGeometry args={[1.13, 0.09, 0.58]} />
        <meshStandardMaterial color="#2a1400" />
      </mesh>

      {/* Left arm (crossed over) */}
      <mesh position={[-0.7, 0.28, 0.12]} rotation={[0, 0, 0.28]}>
        <boxGeometry args={[0.22, 0.88, 0.22]} />
        <meshStandardMaterial color={yellow} roughness={0.85} />
      </mesh>

      {/* Right arm (crossed over) */}
      <mesh position={[0.7, 0.28, 0.12]} rotation={[0, 0, -0.28]}>
        <boxGeometry args={[0.22, 0.88, 0.22]} />
        <meshStandardMaterial color={yellow} roughness={0.85} />
      </mesh>

      {/* Left leg + shoe */}
      <group position={[-0.31, -1.05, 0]}>
        <mesh>
          <boxGeometry args={[0.27, 0.65, 0.27]} />
          <meshStandardMaterial color={yellow} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.42, 0.1]}>
          <boxGeometry args={[0.31, 0.16, 0.44]} />
          <meshStandardMaterial color="#111" roughness={0.7} />
        </mesh>
      </group>

      {/* Right leg + shoe — animated (foot tapping) */}
      <group ref={rightFootRef} position={[0.31, -1.05, 0]}>
        <mesh>
          <boxGeometry args={[0.27, 0.65, 0.27]} />
          <meshStandardMaterial color={yellow} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.42, 0.1]}>
          <boxGeometry args={[0.31, 0.16, 0.44]} />
          <meshStandardMaterial color="#111" roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
}

interface SceneProps {
  resolution: Vector2
  cellSize: number
}

function Scene({ resolution, cellSize }: SceneProps) {
  return (
    <>
      {/* Main front light */}
      <ambientLight intensity={0.45} />
      <pointLight position={[2, 4, 5]} intensity={28} color="#ffffff" />
      {/* Soft fill from the left */}
      <pointLight position={[-3, 2, 3]} intensity={8} color="#aad4f5" />

      <SpongeBob />

      <Bubble startX={-0.9} startY={-0.5} startZ={0.3} speed={0.7} phase={0} />
      <Bubble startX={0.75} startY={-1.0} startZ={0.2} speed={1.0} phase={1.7} />
      <Bubble startX={-0.2} startY={-1.5} startZ={0.4} speed={0.85} phase={3.1} />
      <Bubble startX={1.1} startY={-0.2} startZ={0.1} speed={0.65} phase={0.9} />

      <EffectComposer>
        <AsciiEffect
          style="standard"
          cellSize={cellSize}
          invert={false}
          color={true}
          resolution={resolution}
          postfx={{
            brightnessAdjust: 0,
            contrastAdjust: 1,
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

  // Compact = coarser ASCII grid for smaller contexts (video overlay)
  const cellSize = compact ? 6 : 4

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ background: "#000" }}>
      <Canvas
        camera={{ position: [0, 0.4, 5], fov: 45 }}
        gl={{ antialias: false, powerPreference: "low-power" }}
        dpr={1}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#000000"]} />
        <Suspense fallback={null}>
          <Scene resolution={resolution} cellSize={cellSize} />
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
