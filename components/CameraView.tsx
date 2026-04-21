"use client";

export default function CameraView() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(40,40,40,1) 0%, rgba(10,10,10,1) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#888888",
        fontSize: "18px",
      }}
    >
      Camera area
    </div>
  );
}