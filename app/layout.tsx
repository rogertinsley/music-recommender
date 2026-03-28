import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music Recommender",
  description: "Personal music discovery powered by Last.FM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
