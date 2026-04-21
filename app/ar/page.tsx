"use client";

import CameraView from "@/components/CameraView";
import OverlayUI from "@/components/OverlayUI";
import PermissionGate from "@/components/PermissionGate";
import { useCamera } from "@/hooks/useCamera";
import { useOpenCv } from "@/hooks/useOpenCv";
import { useScreenTracker } from "@/hooks/useScreenTracker";

export default function ARPage() {
  const { videoRef, startCamera, isReady, isStarting, error } = useCamera();
  const { ready: cvReady, error: cvError } = useOpenCv();

  // 🔥 ここがコア
  const pose = useScreenTracker(videoRef, cvReady, isReady);

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
        <OverlayUI pose={pose} />
      </PermissionGate>
    </main>
  );
}