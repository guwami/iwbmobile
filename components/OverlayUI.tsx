"use client";

import { useMemo } from "react";
import type { GridPose } from "@/types/tracker";

type OverlayUIProps = {
  pose: GridPose;
  note: string;
};

function formatNote(text: string) {
  return text.slice(0, 5).split("").join("\n");
}

export default function OverlayUI({ pose, note }: OverlayUIProps) {
  const shownNote = useMemo(() => formatNote(note), [note]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {pose.displayNormalized && (
        <>
          <div
            style={{
              position: "absolute",
              left: `${pose.displayNormalized.x * 100}%`,
              top: `${pose.displayNormalized.y * 100}%`,
              transform: "translate(-50%, -50%)",
              background: "#ffef7a",
              color: "#222",
              borderRadius: 8,
              padding: "10px 12px",
              fontWeight: 700,
              fontSize: 30,
              lineHeight: 1,
              whiteSpace: "pre-line",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            }}
          >
            {shownNote}
          </div>

          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              fontSize: 12,
              color: "#fff",
              background: "rgba(0,0,0,0.5)",
              borderRadius: 6,
              padding: "6px 8px",
            }}
          >
            x={pose.displayCell?.x} y={pose.displayCell?.y}
          </div>
        </>
      )}
    </div>
  );
}
