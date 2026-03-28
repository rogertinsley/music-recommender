"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ArtistImages } from "@/lib/fanart/client";

interface Recommendation {
  id: string;
  artistName: string;
  sourceArtist: string;
  tags: string[];
}

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/artist-image?name=${encodeURIComponent(rec.artistName)}`)
      .then((r) => r.json())
      .then((images: ArtistImages | null) =>
        setThumbnail(images?.thumbnail ?? null)
      )
      .catch(() => null);
  }, [rec.artistName]);

  return (
    <Link
      href={`/artist/${encodeURIComponent(rec.artistName)}`}
      className="flex flex-col gap-3 bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-colors"
    >
      <div className="relative w-full aspect-square bg-zinc-800">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={rec.artistName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-zinc-600">♪</span>
          </div>
        )}
      </div>
      <div className="px-3 pb-4 flex flex-col gap-2">
        <h3 className="text-white font-semibold text-sm leading-tight">
          {rec.artistName}
        </h3>
        <p className="text-zinc-500 text-xs">
          Because you listen to{" "}
          <span className="text-zinc-400">{rec.sourceArtist}</span>
        </p>
        {rec.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {rec.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
