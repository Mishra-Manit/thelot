import { Plus } from "lucide-react";
import type { ShotData } from "./ShotEditor";

interface ShotTimelineProps {
  shots: ShotData[];
  selectedShotId: number | null;
  sceneNumber: number;
  onSelectShot: (shotId: number) => void;
}

export function ShotTimeline({
  shots,
  selectedShotId,
  sceneNumber,
  onSelectShot,
}: ShotTimelineProps) {
  const totalDuration = shots.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div
      className="flex-shrink-0 px-4 py-3"
      style={{
        backgroundColor: "#0D0E14",
        borderTop: "1px solid #252933",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        <span
          style={{
            fontSize: 10,
            color: "#404556",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Scene {sceneNumber} — Shot Timeline
        </span>
        <div
          className="flex-1"
          style={{ height: 1, backgroundColor: "#252933" }}
        />
        <span
          style={{
            fontSize: 10,
            color: "#404556",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {shots.length} shots • {totalDuration}s
        </span>
      </div>

      {/* Pills row */}
      <div
        className="flex items-center gap-1 p-1.5 rounded-full overflow-x-auto"
        style={{
          backgroundColor: "#0D0E14",
          scrollbarWidth: "none",
        }}
      >
        {shots.map((shot, idx) => {
          const isActive = shot.id === selectedShotId;
          // Width proportional to duration
          const flex = shot.duration;
          return (
            <div
              key={shot.id}
              onClick={() => onSelectShot(shot.id)}
              className="relative rounded-[20px] overflow-hidden cursor-pointer transition-all"
              style={{
                flex: `${flex} 0 0`,
                minWidth: 50,
                height: 44,
                border: isActive
                  ? "2px solid #597D7C"
                  : "2px solid transparent",
                boxShadow: isActive ? "0 0 10px #597D7C44" : "none",
                opacity: isActive ? 1 : 0.65,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.opacity = "0.65";
              }}
            >
              <img
                src={shot.thumbnail}
                alt={`Shot ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Shot number overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(to right, rgba(13,14,20,0.6), rgba(13,14,20,0.25))",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: isActive ? "#597D7C" : "#777076",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  {idx + 1}
                </span>
              </div>
            </div>
          );
        })}
        {/* Add shot button */}
        <button
          className="flex-shrink-0 flex items-center justify-center rounded-[20px] cursor-pointer transition-colors"
          style={{
            width: 44,
            height: 44,
            backgroundColor: "#17292B",
            border: "1px dashed #597D7C",
            color: "#597D7C",
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}