"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { EditorialData } from "@/app/api/editorial/route";
import type { NewsItem } from "@/lib/news/service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function reveal(delay = 0): React.CSSProperties {
  return {
    animation: "fadeInUp 0.6s ease both",
    animationDelay: `${delay}ms`,
  };
}

// ── Lead Story ────────────────────────────────────────────────────────────────

function LeadStory({ lead }: { lead: NonNullable<EditorialData["lead"]> }) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section
      className="relative w-full overflow-hidden rounded-2xl mb-14"
      style={{ minHeight: "85vh" }}
    >
      {/* Background image */}
      {lead.backgroundUrl ? (
        <Image
          src={lead.backgroundUrl}
          alt={lead.artistName}
          fill
          className="object-cover object-top"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-warm-800" />
      )}

      {/* Gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* ── Top masthead strip ── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-10 py-5"
        style={reveal(0)}
      >
        <p className="font-mono text-[0.65rem] text-white/40 uppercase tracking-[0.25em]">
          Encore · Editorial
        </p>
        <p className="font-mono text-[0.65rem] text-white/35 uppercase tracking-[0.2em]">
          {today}
        </p>
      </div>

      {/* ── "NOW SPINNING" sticker ── */}
      <div className="absolute top-14 right-6 md:right-10" style={reveal(150)}>
        <div
          className="relative flex items-center justify-center w-20 h-20 rounded-full border border-amber-accent/40 bg-black/30 backdrop-blur-sm"
          style={{ transform: "rotate(12deg)" }}
        >
          <div className="text-center">
            <p className="font-mono text-amber-accent text-[0.5rem] uppercase tracking-[0.2em] leading-tight">
              Now
              <br />
              Spinning
            </p>
          </div>
          {/* orbit ring */}
          <div
            className="absolute inset-0 rounded-full border border-amber-accent/15"
            style={{ margin: "-4px" }}
          />
        </div>
      </div>

      {/* ── Bottom content ── */}
      <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-8 md:pb-12">
        {/* Album art floated left on md+ */}
        {lead.albumArtUrl && (
          <div
            className="hidden md:block float-right ml-8 mb-4 shrink-0 w-28 h-28 rounded-xl overflow-hidden shadow-2xl border border-white/10"
            style={reveal(100)}
          >
            <Image
              src={lead.albumArtUrl}
              alt={lead.albumName ?? lead.artistName}
              width={112}
              height={112}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        {/* Artist name — viewport-scaled */}
        <h1
          className="font-display font-light text-white leading-none tracking-tight mb-3 clear-none"
          style={{
            fontSize: "clamp(3rem, 10vw, 7.5rem)",
            ...reveal(80),
          }}
        >
          <Link
            href={`/artist/${encodeURIComponent(lead.artistName)}`}
            className="hover:text-warm-200 transition-colors"
          >
            {lead.artistName}
          </Link>
        </h1>

        {lead.albumName && (
          <p
            className="font-display italic text-white/50 mb-6 leading-tight"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)", ...reveal(140) }}
          >
            {lead.albumName}
          </p>
        )}

        {/* Pullquote — centrepiece, no border */}
        {lead.pullQuote && (
          <p
            className="font-display italic text-white/80 leading-snug mb-6 max-w-2xl"
            style={{ fontSize: "clamp(1.2rem, 2.8vw, 2rem)", ...reveal(200) }}
          >
            &ldquo;{lead.pullQuote}&rdquo;
          </p>
        )}

        {/* Review — subtle glass panel */}
        <div className="max-w-xl" style={reveal(280)}>
          <div className="text-sm text-white/55 leading-relaxed space-y-2 bg-black/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/5">
            {lead.review
              .split("\n\n")
              .slice(0, 2)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </div>
        </div>
        <div style={{ clear: "both" }} />
      </div>
    </section>
  );
}

// ── Weekly Digest ─────────────────────────────────────────────────────────────

function WeeklyDigest({ content }: { content: string }) {
  return (
    <section
      className="mb-14 py-10 border-y border-warm-700/50 text-center"
      style={reveal(0)}
    >
      <p className="font-mono text-amber-accent/70 text-[0.65rem] uppercase tracking-[0.35em] mb-6">
        ✦ &nbsp; This Week in Your Listening &nbsp; ✦
      </p>
      <p
        className="font-display italic text-warm-200 leading-relaxed mx-auto font-light"
        style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)", maxWidth: "42rem" }}
      >
        {content}
      </p>
    </section>
  );
}

// ── Album Reviews ─────────────────────────────────────────────────────────────

function AlbumReviews({ reviews }: { reviews: EditorialData["albumReviews"] }) {
  if (reviews.length === 0) return null;

  const [featured, ...rest] = reviews;

  return (
    <section className="mb-14" style={reveal(0)}>
      {/* Section label */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-warm-700/50" />
        <p className="font-mono text-warm-500 text-[0.65rem] uppercase tracking-[0.3em] shrink-0">
          Albums of the Week
        </p>
        <div className="h-px flex-1 bg-warm-700/50" />
      </div>

      {/* Featured album — horizontal spread */}
      {featured && (
        <article
          className="relative grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-0 rounded-2xl overflow-hidden mb-6 border border-warm-700/60 group"
          style={reveal(60)}
        >
          {/* Large decorative number */}
          <span
            className="absolute bottom-2 right-4 font-display font-light text-warm-800/70 select-none pointer-events-none leading-none"
            style={{ fontSize: "10rem" }}
          >
            01
          </span>

          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-warm-800">
            {featured.imageUrl ? (
              <Image
                src={featured.imageUrl}
                alt={featured.albumName}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl text-warm-600">♪</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-warm-900/20" />
          </div>

          {/* Text */}
          <div className="relative bg-warm-900 p-7 md:p-9 flex flex-col justify-center gap-4 z-10">
            <div>
              <p className="font-mono text-amber-accent/70 text-[0.6rem] uppercase tracking-[0.3em] mb-2">
                ★ Featured
              </p>
              <Link
                href={`/artist/${encodeURIComponent(featured.artistName)}`}
                className="font-mono text-xs text-warm-500 uppercase tracking-widest hover:text-warm-300 transition-colors block mb-1"
              >
                {featured.artistName}
              </Link>
              <h3 className="font-display text-2xl md:text-3xl font-light text-warm-100 leading-tight">
                {featured.albumName}
              </h3>
            </div>

            {featured.pullQuote && (
              <p className="font-display italic text-lg md:text-xl text-warm-300 leading-snug">
                &ldquo;{featured.pullQuote}&rdquo;
              </p>
            )}

            <p className="text-sm text-warm-500 leading-relaxed line-clamp-4">
              {featured.review}
            </p>
          </div>
        </article>
      )}

      {/* Remaining albums — equal-column grid */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rest.map((r, i) => (
            <article
              key={`${r.artistName}-${r.albumName}`}
              className="relative flex gap-5 rounded-xl bg-warm-900 border border-warm-700/60 p-5 overflow-hidden group hover:border-warm-600/80 transition-colors"
              style={reveal(120 + i * 60)}
            >
              {/* Decorative number */}
              <span
                className="absolute bottom-0 right-3 font-display font-light text-warm-800/60 select-none pointer-events-none leading-none"
                style={{ fontSize: "6rem" }}
              >
                {String(i + 2).padStart(2, "0")}
              </span>

              {/* Image */}
              <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-warm-800">
                {r.imageUrl ? (
                  <Image
                    src={r.imageUrl}
                    alt={r.albumName}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl text-warm-600">♪</span>
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="relative min-w-0 flex flex-col gap-1.5 z-10">
                <Link
                  href={`/artist/${encodeURIComponent(r.artistName)}`}
                  className="font-mono text-[0.6rem] text-warm-500 uppercase tracking-wider hover:text-warm-300 transition-colors"
                >
                  {r.artistName}
                </Link>
                <h3 className="font-display text-lg font-light text-warm-100 leading-tight">
                  {r.albumName}
                </h3>
                {r.pullQuote && (
                  <p className="font-display italic text-sm text-warm-400 leading-snug line-clamp-2">
                    &ldquo;{r.pullQuote}&rdquo;
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Artist Spotlight ──────────────────────────────────────────────────────────

function ArtistSpotlight({
  spotlight,
}: {
  spotlight: NonNullable<EditorialData["artistSpotlight"]>;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl mb-14 border border-amber-accent/20 bg-gradient-to-br from-amber-accent/8 via-amber-accent/4 to-transparent p-7 md:p-9"
      style={reveal(0)}
    >
      {/* Decorative star */}
      <span
        className="absolute right-6 top-1/2 -translate-y-1/2 font-display font-light text-amber-accent/10 select-none pointer-events-none leading-none"
        style={{ fontSize: "12rem" }}
      >
        ★
      </span>

      <div className="relative flex gap-6 items-start max-w-2xl">
        {spotlight.imageUrl && (
          <div className="shrink-0 w-20 h-20 rounded-full overflow-hidden ring-2 ring-amber-accent/30">
            <Image
              src={spotlight.imageUrl}
              alt={spotlight.artistName}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        <div className="min-w-0">
          <p className="font-mono text-amber-accent/70 text-[0.6rem] uppercase tracking-[0.3em] mb-2">
            ★ Did You Know?
          </p>
          <Link
            href={`/artist/${encodeURIComponent(spotlight.artistName)}`}
            className="font-display text-xl font-light text-warm-100 hover:text-white transition-colors block mb-3"
          >
            {spotlight.artistName}
          </Link>
          <p className="text-sm text-warm-300 leading-relaxed">
            {spotlight.content}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── In the Press ──────────────────────────────────────────────────────────────

function InThePress({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10" style={reveal(0)}>
      {/* Section label */}
      <div className="flex items-center gap-4 mb-7">
        <div className="h-px flex-1 bg-warm-700/50" />
        <p className="font-mono text-warm-500 text-[0.65rem] uppercase tracking-[0.3em] shrink-0">
          In the Press
        </p>
        <div className="h-px flex-1 bg-warm-700/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
        {items.map((item, i) => (
          <article
            key={i}
            className="py-5 border-b border-warm-800/50 flex flex-col gap-2"
            style={reveal(i * 40)}
          >
            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[0.6rem] px-2 py-0.5 rounded bg-warm-800 text-warm-300 uppercase tracking-wider">
                {item.source}
              </span>
              <Link
                href={`/artist/${encodeURIComponent(item.matchedArtist)}`}
                className="text-xs text-warm-500 hover:text-warm-300 transition-colors"
              >
                {item.matchedArtist}
              </Link>
              {item.publishedAt && (
                <span className="font-mono text-xs text-warm-600 tabular-nums">
                  {new Date(item.publishedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>

            {/* Headline */}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group text-warm-100 text-sm font-medium hover:text-amber-accent transition-colors leading-snug inline-flex items-start gap-1"
            >
              <span>{item.title}</span>
              <span className="opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5 text-amber-accent">
                →
              </span>
            </a>

            {item.summary && (
              <p className="text-warm-500 text-xs leading-relaxed line-clamp-2">
                {item.summary}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div
        className="rounded-2xl bg-warm-800/40"
        style={{ minHeight: "85vh" }}
      />
      <div className="border-y border-warm-800 py-10 flex flex-col items-center gap-4">
        <div className="h-2 bg-warm-800 rounded w-48" />
        <div className="h-6 bg-warm-800 rounded w-full max-w-lg" />
        <div className="h-6 bg-warm-800 rounded w-4/5 max-w-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] rounded-2xl overflow-hidden">
        <div className="aspect-square bg-warm-800" />
        <div className="bg-warm-900 p-8 space-y-4">
          <div className="h-3 bg-warm-800 rounded w-20" />
          <div className="h-8 bg-warm-800 rounded w-3/4" />
          <div className="h-5 bg-warm-800 rounded w-full" />
          <div className="h-4 bg-warm-800 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function EditorialView() {
  const [data, setData] = useState<EditorialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/editorial")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d: EditorialData) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-warm-500 text-sm">
          Could not load editorial content.
        </p>
      </div>
    );
  }

  const hasContent =
    data.lead ||
    data.weeklyDigest ||
    data.albumReviews.length > 0 ||
    data.artistSpotlight ||
    data.news.length > 0;

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-warm-500 text-sm italic font-display text-lg">
          Start playing music to generate your editorial.
        </p>
      </div>
    );
  }

  return (
    <div>
      {data.lead && <LeadStory lead={data.lead} />}
      {data.weeklyDigest && <WeeklyDigest content={data.weeklyDigest} />}
      {data.albumReviews.length > 0 && (
        <AlbumReviews reviews={data.albumReviews} />
      )}
      {data.artistSpotlight && (
        <ArtistSpotlight spotlight={data.artistSpotlight} />
      )}
      {data.news.length > 0 && <InThePress items={data.news} />}
    </div>
  );
}
