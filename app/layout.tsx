import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI运营工作台 · 智能培训课件",
  description: "面向运营、门店与技师的AI课件生产工作台",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
