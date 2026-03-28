# Music Recommender — Claude Instructions

## What this app is

A personal music discovery web app for a single user. It reads Last.FM scrobbles, shows what's currently playing with rich visuals (Fanart.tv backgrounds, Cover Art Archive album art), recommends artists based on listening habits, and surfaces new releases from favourite artists. It is **not** a player.

Deployed on a private Linux server, accessible only over Tailscale. No authentication layer — network access is the security boundary.

## Stack

- **Next.js 15** App Router, TypeScript throughout
- **Tailwind v4** — CSS `@import "tailwindcss"` only, no config file
- **PostgreSQL** via **Prisma 6** ORM
- **Redis** via **ioredis** (caching and now-playing state)
- **Docker Compose** — `app`, `db`, `cache` services
- **Vitest** for tests
- **Husky + lint-staged** — runs Prettier and tests on every commit

## Commands

```bash
npm run dev          # start dev server
npm run test         # vitest watch
npm run test:run     # vitest single run (CI)
npm run db:migrate   # prisma migrate deploy (production)
npm run db:push      # prisma db push (dev schema sync)
npm run db:generate  # prisma generate
docker compose up    # full stack
```

## Architecture

### External clients (`lib/lastfm`, `lib/musicbrainz`, `lib/fanart`, `lib/coverart`)

Four typed API clients. Each is a class with a small public interface. All are well-tested with mocked `fetch`. Do not add business logic here — clients only translate HTTP responses into typed values.

- `LastFMClient` — artist info, top artists/tracks/albums/tags, similar artists, now playing, album info
- `MusicBrainzClient` — artist MBID lookup, release-group search. Has a 1 req/s rate limiter (pass `0` in tests to skip delay)
- `FanartTVClient` — artist background/thumbnail/logo by MBID
- `CoverArtArchiveClient` — front cover art by release or release-group MBID

### Business logic (`lib/recommendations`, `lib/new-releases`, `lib/enrichment`)

- `lib/recommendations/engine.ts` — pure `recommend()` function; no I/O. Score = `(similarMatch × playCountWeight) + tagBonus` (tag bonus capped at 0.3)
- `lib/new-releases/service.ts` — `NewReleasesService` orchestrates Last.FM → MusicBrainz → dedup by MBID → sort by playCount. Uses `Promise.allSettled` for partial-failure resilience
- `lib/enrichment/now-playing.ts` — `enrichNowPlaying()` adds bio, artist images, album art to a raw now-playing track. `stripBio()` strips HTML and "Read more on Last.fm"

### Background jobs (`lib/jobs`, `lib/poller`)

All started in `instrumentation.ts` on server boot (Node.js runtime only). Each job checks staleness (<20h old → skip) before running.

- `lib/poller/now-playing.ts` — polls Last.FM every 30s, writes `EnrichedNowPlaying` to Redis key `now-playing` with 60s TTL
- `lib/jobs/recommendations.ts` — daily; fetches top 20 artists + similar artists + tags, runs `recommend()`, deletes + recreates `Recommendation` rows
- `lib/jobs/new-releases.ts` — daily; runs `NewReleasesService`, fetches cover art, deletes + recreates `NewRelease` rows

### API routes (`app/api`)

Thin handlers. Complex orchestration (e.g. `app/api/artist/[name]`) assembles data from multiple clients and caches in Redis.

| Route                  | Source               | Cache                            |
| ---------------------- | -------------------- | -------------------------------- |
| `/api/now-playing`     | Redis `now-playing`  | —                                |
| `/api/recommendations` | Prisma               | —                                |
| `/api/new-releases`    | Prisma               | —                                |
| `/api/artist/[name]`   | All 4 clients        | Redis `artist-page:{name}`, 6h   |
| `/api/artist-image`    | MusicBrainz + Fanart | Redis `artist-image:{name}`, 24h |

### Infrastructure (`lib/redis.ts`, `lib/prisma.ts`)

Module-level singletons using `globalThis` guard (Next.js dev hot-reload safe).

## Database schema

Four models: `Artist`, `Recommendation`, `NewRelease`, `ArtistImage`. Migrations live in `prisma/migrations/` and are applied automatically by `entrypoint.sh` on container startup (`prisma migrate deploy`).

## Testing conventions

- Tests live next to the source file (`client.test.ts` beside `client.ts`)
- Mock `fetch` with `vi.spyOn(global, "fetch")` — never use `vi.mock` for fetch
- Pass `0` as `minRequestInterval` to `new MusicBrainzClient(0)` in tests to skip rate-limiting delays
- Test behaviour through public interfaces only — no testing of private methods or internal state
- 42 tests across 6 test files; all must pass before commit (enforced by lint-staged)

## Key env vars

```
LASTFM_API_KEY         # Last.FM API key
LASTFM_USERNAME        # Last.FM username to scrobble from
FANART_TV_API_KEY      # Fanart.tv API key
DATABASE_URL           # PostgreSQL connection string
REDIS_URL              # Redis connection string
NEW_RELEASES_DAYS_WINDOW  # Days back to look for new releases (default: 90)
```

## Open RFC

**rogertinsley/music-recommender#13** — centralise client construction in `lib/clients.ts`. Currently all 4 clients are instantiated inline in 5 locations. Proposed: `export const clients = { lastfm, musicBrainz, fanartTV, coverArt }` singleton, matching the `lib/prisma.ts` and `lib/redis.ts` pattern.
