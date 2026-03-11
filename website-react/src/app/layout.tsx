import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "即时翻译 - 集成 Google、AI 双引擎，翻译双向回译核对",
  description: "双向回译核对技术，自动将结果译回源语言，通过二次比对助您直观判断语义，确保沟通万无一失。",
  icons: {
    icon: "/assets/logo.png",
    apple: "/assets/logo.png",
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
