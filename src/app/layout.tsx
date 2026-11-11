import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QueueLess",
  description: "Simple virtual queues for small businesses."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
