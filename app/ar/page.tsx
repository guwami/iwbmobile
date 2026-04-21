import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "24px",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "32px" }}>IWB Mobile AR</h1>

      <p
        style={{
          margin: 0,
          maxWidth: "460px",
          lineHeight: 1.7,
          color: "#cccccc",
        }}
      >
        4隅マーカーからディスプレイ平面を推定し,
        スマホが近づいた位置に付箋を置くプロトタイプです。
      </p>

      <Link
        href="/ar"
        style={{
          display: "inline-block",
          padding: "14px 22px",
          borderRadius: "12px",
          background: "#ffffff",
          color: "#111111",
          fontWeight: 700,
        }}
      >
        AR画面を開く
      </Link>
    </main>
  );
}