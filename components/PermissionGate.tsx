"use client";

type PermissionGateProps = {
  children: React.ReactNode;
  isReady: boolean;
  isStarting: boolean;
  error: string | null;
  onStart: () => void;
};

export default function PermissionGate({
  children,
  isReady,
  isStarting,
  error,
  onStart,
}: PermissionGateProps) {
  return (
    <>
      {children}

      {!isReady && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(0,0,0,0.72)",
            color: "#fff",
            zIndex: 20,
          }}
        >
          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              padding: "24px",
              borderRadius: "18px",
              background: "rgba(20,20,20,0.95)",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginTop: 0 }}>カメラを開始</h2>

            <p style={{ color: "#ccc", lineHeight: 1.6 }}>
              背面カメラを使って黒い四角マーカーを検出します。
              白地の上に黒い四角形を表示して試してください。
            </p>

            {error && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(255,0,0,0.12)",
                  color: "#ff9b9b",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  wordBreak: "break-word",
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={onStart}
              disabled={isStarting}
              style={{
                border: 0,
                borderRadius: "12px",
                padding: "14px 20px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isStarting ? "起動中..." : "カメラを許可して開始"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}