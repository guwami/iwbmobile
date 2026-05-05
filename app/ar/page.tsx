"use client";

import { useState } from "react";
import CameraView from "@/components/CameraView";
import OverlayUI from "@/components/OverlayUI";
import PermissionGate from "@/components/PermissionGate";
import { useCamera } from "@/hooks/useCamera";
import { useScreenTracker } from "@/hooks/useScreenTracker";

export default function ARPage() {
  const { videoRef, startCamera, isReady, isStarting, error } = useCamera();
  const [markerNumber, setMarkerNumber] = useState(1);
  const [note, setNote] = useState("ふせん");
  const pose = useScreenTracker(videoRef, isReady, markerNumber);

  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <PermissionGate
        isReady={isReady}
        isStarting={isStarting}
        error={error}
        onStart={startCamera}
      >
        <CameraView videoRef={videoRef} />
        <OverlayUI pose={pose} note={note} />

        <div
          style={{
            position: "absolute",
            right: 12,
            top: 12,
            zIndex: 9,
            display: "grid",
            gap: 8,
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <label>
            数字(1-40)
            <input
              type="number"
              min={1}
              max={40}
              value={markerNumber}
              onChange={(e) => setMarkerNumber(Number(e.target.value) || 1)}
              style={{ width: 80, marginLeft: 8 }}
            />
          </label>
          <label>
            付箋(5文字)
            <input
              type="text"
              maxLength={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: 100, marginLeft: 8 }}
            />
          </label>
        </div>
      </PermissionGate>
    </main>
  );
}
