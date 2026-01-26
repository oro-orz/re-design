import type { Metadata } from "next";
import { Fjalla_One } from "next/font/google";
import "./globals.css";

const fjallaOne = Fjalla_One({ weight: "400", subsets: ["latin"], display: "swap" });

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
      <body className={`${fjallaOne.className} antialiased bg-white text-neutral-900`}>
        {children}
      </body>
    </html>
  );
}
