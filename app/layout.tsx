// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import SessionWrapper from "@/components/ui/SessionWrapper";

export const metadata: Metadata = {
  title: "ThreadBot — AI Clothing Store",
  description: "Shop t-shirts and pants with your AI assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
