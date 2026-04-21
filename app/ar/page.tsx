"use client";

import { useEffect, useRef, useState } from "react";

export default function ARPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  const startCamera = async () => {
    try {
      setError("");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("このブラウザはカメラAPIに対応していません。");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      if (!videoRef.current) {
        setError("video要素がありません。");
        return;
      }

      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;

      await videoRef.current.play();
      setStarted(true);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("カメラ起動に失敗しました。");
      }
    }
  };

  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
      }}
    >
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

      {!started && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(0,0,0,0.75)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "24px",
              borderRadius: "18px",
              background: "rgba(20,20,20,0.95)",
              color: "#fff",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginTop: 0 }}>カメラテスト</h2>

            <p style={{ color: "#ccc", lineHeight: 1.6 }}>
              まずは背面カメラが起動できるかだけ確認します。
            </p>

            {error && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(255,0,0,0.12)",
                  color: "#ff9b9b",
                  lineHeight: 1.6,
                  wordBreak: "break-word",
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={startCamera}
              style={{
                border: 0,
                borderRadius: "12px",
                padding: "14px 20px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              カメラを許可して開始
            </button>
          </div>
        </div>
      )}
    </main>
  );
}