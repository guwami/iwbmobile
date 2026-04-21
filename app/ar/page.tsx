"use client";

import CameraView from "@/components/CameraView";
import OverlayUI from "@/components/OverlayUI";
import PermissionGate from "@/components/PermissionGate";
import { useCamera } from "@/hooks/useCamera";
import { useMarkerDetection } from "@/hooks/useMarkerDetection";

export default function ARPage() {
  const { videoRef, startCamera, isReady, isStarting, error } = useCamera();
  const result = useMarkerDetection(videoRef, isReady);

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
        <OverlayUI result={result} />
      </PermissionGate>
    </main>
  );
}