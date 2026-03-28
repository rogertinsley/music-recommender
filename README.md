# Music Recommender

A personal music discovery app that reads your Last.FM scrobbles to show what's playing, recommend new artists, and surface new releases from your favourite artists.

## Features

- **Now Playing** — full-bleed artist backgrounds (Fanart.tv), album art, bio excerpt. Polls every 30 seconds.
- **Recommendations** — scored by similarity + tag overlap, weighted by your play counts. Refreshed daily.
- **New Releases** — albums, EPs, and singles from artists you listen to, within a configurable date window. Refreshed daily.
- **Artist pages** — bio, top tracks, albums with cover art, similar artists.

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma
- Redis (now-playing cache, artist image cache)
- Tailwind v4
- Docker Compose

## Setup

### 1. Copy env file

```bash
cp .env.example .env
```

Fill in:

| Variable            | Where to get it                        |
| ------------------- | -------------------------------------- |
| `LASTFM_API_KEY`    | https://www.last.fm/api/account/create |
| `LASTFM_USERNAME`   | Your Last.FM username                  |
| `FANART_TV_API_KEY` | https://fanart.tv/get-an-api-key       |

### 2. Run with Docker

```bash
docker compose up
```

The app will be available at `http://localhost:3000`. Database migrations run automatically on startup.

### 3. Run locally (dev)

Requires PostgreSQL and Redis running locally.

```bash
npm install
npm run db:push      # sync schema to local DB
npm run dev
```

## Development

```bash
npm run test         # vitest watch mode
npm run test:run     # single run
npm run db:migrate   # apply migrations (production)
npm run db:generate  # regenerate Prisma client after schema changes
```

## Architecture

Background jobs start automatically when the server boots:

- **Now-playing poller** — every 30s, writes enriched track data to Redis
- **Recommendations job** — daily, writes to `Recommendation` table
- **New releases job** — daily, writes to `NewRelease` table

Each job skips if data is less than 20 hours old, so server restarts don't trigger redundant API calls.

External APIs used:

- [Last.FM](https://www.last.fm/api) — scrobbles, artist/album metadata
- [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API) — artist MBIDs, release groups (rate-limited: 1 req/s)
- [Fanart.tv](https://fanart.tv/api-docs/music-api/) — artist backgrounds and thumbnails
- [Cover Art Archive](https://coverartarchive.org/) — album art (no key required)
