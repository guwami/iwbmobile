"use client";

type CameraViewProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
};

export default function CameraView({ videoRef }: CameraViewProps) {
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        background: "#000",
      }}
    />
  );
}