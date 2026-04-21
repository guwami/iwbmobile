"use client";

import type { MarkerDetection } from "@/types/marker";

type OverlayUIProps = {
  result: MarkerDetection;
};

export default function OverlayUI({ result }: OverlayUIProps) {
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
          color: "#fff",
          backdropFilter: "blur(8px)",
        }}
      >
        <span>IWB Mobile AR</span>
        <span style={{ color: result.near ? "#9effa1" : "#ffd27a" }}>
          {result.near ? "near" : result.detected ? "detected" : "standby"}
        </span>
      </div>

      {result.box && (
        <div
          style={{
            position: "absolute",
            left: `${result.box.x * 100}%`,
            top: `${result.box.y * 100}%`,
            width: `${result.box.width * 100}%`,
            height: `${result.box.height * 100}%`,
            border: `3px solid ${result.near ? "#8fff8f" : "#ffd27a"}`,
            borderRadius: "8px",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.05)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "18px",
          height: "18px",
          borderRadius: "999px",
          border: "2px solid rgba(255,255,255,0.9)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "22px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 16px",
          borderRadius: "999px",
          background: "rgba(0,0,0,0.45)",
          color: "#fff",
          fontSize: "14px",
          backdropFilter: "blur(8px)",
        }}
      >
        {result.detected
          ? `marker detected / size ${(result.areaRatio * 100).toFixed(1)}%`
          : "marker not detected"}
      </div>

      {result.near && (
        <div
          style={{
            position: "absolute",
            right: "16px",
            bottom: "90px",
            width: "180px",
            padding: "14px",
            borderRadius: "16px",
            background: "#ffe97a",
            color: "#222",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "8px" }}>付箋候補</div>
          <div style={{ fontSize: "14px", lineHeight: 1.5 }}>
            マーカーに近づきました。
            ここに付箋の入力UIや白板送信ボタンを載せられます。
          </div>
        </div>
      )}
    </div>
  );
}