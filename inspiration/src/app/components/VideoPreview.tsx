import { SkipBack, SkipForward, Play } from "lucide-react";

interface VideoPreviewProps {
  previewImage: string;
  shotLabel?: string;
  shotDuration?: number;
}

export function VideoPreview({ previewImage, shotLabel, shotDuration }: VideoPreviewProps) {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: "#0D0E14",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Video Player */}
      <div className="flex-1 flex items-center justify-center p-4 pb-1 min-h-0">
        <div
          className="relative w-full h-full rounded-xl overflow-hidden"
        >
          <img
            src={previewImage}
            alt="Video preview"
            className="w-full h-full object-cover"
          />
          {/* Subtle vignette overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
            }}
          />
          {/* Scene indicator */}
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-md"
            style={{
              backgroundColor: "rgba(13,14,20,0.7)",
              backdropFilter: "blur(8px)",
              fontSize: 11,
              color: "#ffffff",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {shotLabel || "Select a shot"}
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-4 py-2 flex-shrink-0">
        <span style={{ fontSize: 11, color: "#777076", fontFamily: "Inter, sans-serif", fontVariantNumeric: "tabular-nums" }}>
          00:00
        </span>
        <button className="cursor-pointer transition-colors" style={{ color: "#777076" }}>
          <SkipBack size={16} fill="#777076" />
        </button>
        <button
          className="flex items-center justify-center rounded-full cursor-pointer transition-colors"
          style={{
            width: 36,
            height: 36,
            backgroundColor: "#597D7C",
          }}
        >
          <Play size={16} fill="#0D0E14" style={{ color: "#0D0E14", marginLeft: 2 }} />
        </button>
        <button className="cursor-pointer transition-colors" style={{ color: "#777076" }}>
          <SkipForward size={16} fill="#777076" />
        </button>
        <span style={{ fontSize: 11, color: "#777076", fontFamily: "Inter, sans-serif", fontVariantNumeric: "tabular-nums" }}>
          {shotDuration != null
            ? `00:${String(shotDuration).padStart(2, "0")}`
            : "00:00"}
        </span>
      </div>
    </div>
  );
}
