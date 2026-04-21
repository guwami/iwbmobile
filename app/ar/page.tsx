"use client";

import CameraView from "@/components/CameraView";
import PermissionGate from "@/components/PermissionGate";
import { useCamera } from "@/hooks/useCamera";
import { useOpenCv } from "@/hooks/useOpenCv";

export default function ARPage() {
  const { videoRef, startCamera, isReady, isStarting, error } = useCamera();
  const { ready: cvReady, error: cvError } = useOpenCv();

  const mergedError = error || cvError;

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
        error={mergedError}
        onStart={startCamera}
      >
        <CameraView videoRef={videoRef} />

        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            padding: "12px 16px",
            borderRadius: 14,
            background: "rgba(0,0,0,0.45)",
            color: "#fff",
            zIndex: 5,
          }}
        >
          <div>IWB Mobile AR</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#ccc" }}>
            camera: {isReady ? "ready" : "waiting"} / opencv:{" "}
            {cvReady ? "ready" : "loading"}
          </div>
        </div>
      </PermissionGate>
    </main>
  );
}