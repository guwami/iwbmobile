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
  if (isReady) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#000",
        color: "#fff",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          padding: "24px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.08)",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginTop: 0 }}>カメラを開始</h2>
        <p style={{ color: "#ccc", lineHeight: 1.6 }}>
          背面カメラを使って黒い四角マーカーを検出します。
          白地の上に黒い四角形を表示して試してください。
        </p>

        {error && (
          <p style={{ color: "#ff8f8f", lineHeight: 1.6 }}>{error}</p>
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
  );
}