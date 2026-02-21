import { Plus, HelpCircle, ChevronLeft, Film, Clock } from "lucide-react";
import type { ShotData } from "./ShotEditor";

export interface SceneData {
  id: number;
  title: string;
  thumbnail: string;
  shots: ShotData[];
}

interface SceneSidebarProps {
  scenes: SceneData[];
  expandedSceneId: number | null;
  selectedShotId: number | null;
  onSelectScene: (sceneId: number) => void;
  onSelectShot: (shotId: number) => void;
  onBack: () => void;
}

export function SceneSidebar({
  scenes,
  expandedSceneId,
  selectedShotId,
  onSelectScene,
  onSelectShot,
  onBack,
}: SceneSidebarProps) {
  const expandedScene = scenes.find((s) => s.id === expandedSceneId);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 200,
        minWidth: 200,
        backgroundColor: "#0D0E14",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {expandedScene ? (
        /* ========== SHOT LIST VIEW ========== */
        <>
          {/* Back to scenes + scene title */}
          <div className="p-3 pb-2">
            <button
              onClick={onBack}
              className="flex items-center gap-1 mb-2 cursor-pointer transition-colors w-full"
              style={{ color: "#777076", fontSize: 11 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#777076";
              }}
            >
              <ChevronLeft size={14} />
              <span>All Scenes</span>
            </button>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded flex-shrink-0"
                style={{
                  width: 22,
                  height: 22,
                  backgroundColor: "#597D7C22",
                  border: "1px solid #597D7C44",
                }}
              >
                <span style={{ fontSize: 10, color: "#597D7C", fontWeight: 600 }}>
                  {expandedScene.id}
                </span>
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "#ffffff",
                  fontWeight: 500,
                  lineHeight: "1.3",
                }}
              >
                {expandedScene.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Film size={10} style={{ color: "#404556" }} />
              <span style={{ fontSize: 10, color: "#404556" }}>
                {expandedScene.shots.length} shots •{" "}
                {expandedScene.shots.reduce((sum, s) => sum + s.duration, 0)}s total
              </span>
            </div>
          </div>

          <div
            className="mx-3 mb-2"
            style={{ borderTop: "1px solid #17292B" }}
          />

          {/* Shot list */}
          <div
            className="flex-1 overflow-y-auto px-3 pb-3"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#404556 transparent",
            }}
          >
            <div className="flex flex-col gap-1.5">
              {expandedScene.shots.map((shot, idx) => {
                const isSelected = shot.id === selectedShotId;
                return (
                  <button
                    key={shot.id}
                    onClick={() => onSelectShot(shot.id)}
                    className="relative flex rounded-lg overflow-hidden transition-all cursor-pointer text-left"
                    style={{
                      backgroundColor: isSelected ? "#17292B" : "transparent",
                      border: isSelected
                        ? "1px solid #252933"
                        : "1px solid transparent",
                      boxShadow: isSelected
                        ? "0 0 12px #17292B44"
                        : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor = "#17292B88";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div className="flex gap-2 p-2 w-full">
                      {/* Thumbnail */}
                      <div
                        className="rounded-md overflow-hidden flex-shrink-0"
                        style={{
                          width: 56,
                          height: 36,
                        }}
                      >
                        <img
                          src={shot.thumbnail}
                          alt={shot.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-1">
                          <span
                            style={{
                              fontSize: 10,
                              color: isSelected ? "#597D7C" : "#60515C",
                              fontWeight: 600,
                            }}
                          >
                            {idx + 1}.
                          </span>
                          <span
                            className="truncate"
                            style={{
                              fontSize: 11,
                              color: isSelected ? "#ffffff" : "#777076",
                              lineHeight: "1.3",
                            }}
                          >
                            {shot.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock size={9} style={{ color: "#404556" }} />
                          <span
                            style={{
                              fontSize: 10,
                              color: "#404556",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {shot.duration}s
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Active indicator bar */}
                    {isSelected && (
                      <div
                        className="absolute left-0 top-0 bottom-0"
                        style={{
                          width: 3,
                          backgroundColor: "#597D7C",
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Shot button */}
          <div className="p-3" style={{ borderTop: "1px solid #17292B" }}>
            <button
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors cursor-pointer"
              style={{
                backgroundColor: "#17292B",
                border: "1px dashed #597D7C66",
                color: "#597D7C",
                fontSize: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#20504E";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#17292B";
              }}
            >
              <Plus size={14} />
              <span>Add Shot</span>
            </button>
          </div>
        </>
      ) : (
        /* ========== SCENE LIST VIEW ========== */
        <>
          {/* Add Scene Button */}
          <div className="p-3">
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors cursor-pointer"
              style={{
                backgroundColor: "#252933",
                color: "#777076",
                fontSize: 13,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#404556";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#252933";
                e.currentTarget.style.color = "#777076";
              }}
            >
              <Plus size={15} />
              <span>Add Scene</span>
            </button>
          </div>

          {/* Scene List */}
          <div
            className="flex-1 overflow-y-auto px-3 pb-3"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#404556 transparent",
            }}
          >
            <div className="flex flex-col gap-2">
              {scenes.map((scene) => {
                const isActive = scene.id === expandedSceneId;
                return (
                  <button
                    key={scene.id}
                    onClick={() => onSelectScene(scene.id)}
                    className="relative flex rounded-lg overflow-hidden transition-all cursor-pointer text-left"
                    style={{
                      backgroundColor: "#17292B",
                      minHeight: 90,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#193D31";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#17292B";
                    }}
                  >
                    {/* Scene number */}
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 28,
                        color: isActive ? "#597D7C" : "#404556",
                        fontSize: 11,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {scene.id}
                    </div>

                    {/* Thumbnail and title */}
                    <div className="flex-1 flex flex-col py-2 pr-2 gap-1.5">
                      <div
                        className="w-full rounded-md overflow-hidden"
                        style={{ aspectRatio: "16/9" }}
                      >
                        <img
                          src={scene.thumbnail}
                          alt={scene.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#777076",
                          lineHeight: "1.3",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {scene.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "#404556",
                        }}
                      >
                        {scene.shots.length} shots •{" "}
                        {scene.shots.reduce((sum, s) => sum + s.duration, 0)}s
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Help icon */}
          <div
            className="p-3 flex justify-center"
            style={{ borderTop: "1px solid #17292B" }}
          >
            <button
              className="cursor-pointer transition-colors"
              style={{ color: "#404556" }}
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}