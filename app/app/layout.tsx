import type { Metadata } from "next";
import "@/lib/polyfill-file";
import { notoSans } from "@/lib/fonts";
import { AuthProvider } from "@/contexts/AuthContext";
import { TMGPortalLoginModal } from "./components/TMGPortalLoginModal";
import { DevLoginBanner } from "./components/DevLoginBanner";
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
      <body className={`${notoSans.className} antialiased bg-white text-neutral-900`}>
        <AuthProvider>
        <DevLoginBanner />
        <TMGPortalLoginModal />
        {children}
      </AuthProvider>
      </body>
    </html>
  );
}
