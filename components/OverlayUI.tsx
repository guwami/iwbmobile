"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { QuadPoint, ScreenPose } from "@/types/tracker";

type OverlayUIProps = {
  pose: ScreenPose;
};

function polygonPath(points: QuadPoint[]) {
  if (points.length < 4) return "";
  return `${points[0].x},${points[0].y} ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`;
}

export default function OverlayUI({ pose }: OverlayUIProps) {
  const [note, setNote] = useState("新しい付箋");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveSticky = async () => {
    if (!pose.screenPoint) return;

    if (!supabase) {
      alert("Supabase の環境変数が未設定です。");
      return;
    }

    try {
      setSaving(true);
      setSaved(false);

      const { error } = await supabase.from("stickies").insert({
        text: note,
        x: pose.screenPoint.x,
        y: pose.screenPoint.y,
        distance_score: pose.distanceScore,
      });

      if (error) throw error;
      setSaved(true);
    } catch (e) {
      console.error(e);
      alert("Supabase保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderRadius: 14,
          background: "rgba(0,0,0,0.45)",
          color: "#fff",
          backdropFilter: "blur(8px)",
          zIndex: 5,
        }}
      >
        <span>IWB Mobile AR</span>
        <span
          style={{
            color:
              pose.mode === "tracking"
                ? "#8fff8f"
                : pose.mode === "detecting"
                ? "#ffd27a"
                : "#ff9b9b",
          }}
        >
          {pose.mode}
        </span>
      </div>

      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        {pose.screenCornersImage.length === 4 && (
          <polygon
            points={polygonPath(pose.screenCornersImage)}
            fill="rgba(255,255,0,0.08)"
            stroke={pose.isNear ? "#8fff8f" : "#ffd27a"}
            strokeWidth="3"
          />
        )}
      </svg>

      {pose.markers.map((m, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: m.center.x - m.width / 2,
            top: m.center.y - m.height / 2,
            width: m.width,
            height: m.height,
            border: "3px solid #00d2ff",
            borderRadius: 8,
            boxSizing: "border-box",
            zIndex: 4,
          }}
        />
      ))}

      {pose.screenPoint && (
        <div
          style={{
            position: "absolute",
            left: `${pose.screenPoint.x * 100}%`,
            top: `${pose.screenPoint.y * 100}%`,
            transform: "translate(-50%, -50%)",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: pose.isNear ? "#8fff8f" : "#ffd27a",
            border: "3px solid rgba(255,255,255,0.8)",
            zIndex: 6,
          }}
        />
      )}

      {pose.screenPoint && pose.isNear && (
        <div
          style={{
            position: "absolute",
            left: `${pose.screenPoint.x * 100}%`,
            top: `${pose.screenPoint.y * 100}%`,
            transform: "translate(-50%, -120%)",
            width: 220,
            padding: 14,
            borderRadius: 16,
            background: "#ffe97a",
            color: "#222",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            zIndex: 7,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>付箋候補</div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              width: "100%",
              minHeight: 80,
              resize: "none",
              borderRadius: 8,
              border: "1px solid #ccc",
              padding: 8,
              marginBottom: 8,
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={saveSticky}
            disabled={saving}
            style={{
              width: "100%",
              border: 0,
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {saving ? "保存中..." : "Supabase に保存"}
          </button>

          {saved && (
            <div style={{ marginTop: 8, fontSize: 13 }}>保存しました。</div>
          )}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 16px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.45)",
          color: "#fff",
          fontSize: 14,
          backdropFilter: "blur(8px)",
          zIndex: 5,
        }}
      >
        {pose.detected
          ? `mode=${pose.mode} x=${pose.screenPoint?.x.toFixed(2)} y=${pose.screenPoint?.y.toFixed(2)} d=${pose.distanceScore.toFixed(3)} features=${pose.trackedFeatureCount}`
          : "4隅マーカーを画面に入れてください"}
      </div>
    </div>
  );
}