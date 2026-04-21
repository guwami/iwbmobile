import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IWB Mobile AR",
  description: "Mobile AR sticky note prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}