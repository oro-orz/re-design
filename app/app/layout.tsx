import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Re:Design",
  description: "デザインフィードバック & リファレンス生成",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
