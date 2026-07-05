import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "A simple AI chat application",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen m-0 p-0">{children}</body>
    </html>
  );
}
