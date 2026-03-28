import type { Metadata } from "next";
import { Nav } from "./components/Nav";
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
      <body className="min-h-screen">
        <Nav />
        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
