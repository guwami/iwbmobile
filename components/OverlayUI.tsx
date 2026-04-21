"use client";

export default function OverlayUI() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          right: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderRadius: "14px",
          background: "rgba(0,0,0,0.45)",
          color: "#ffffff",
          backdropFilter: "blur(8px)",
        }}
      >
        <span>AR Sticky Prototype</span>
        <span style={{ color: "#9effa1" }}>standby</span>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 16px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.12)",
          color: "#ffffff",
        }}
      >
        marker not detected
      </div>
    </div>
  );
}