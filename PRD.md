# PRD: Personal Music Recommender

## Problem Statement

Music streaming services like Apple Music rely on opaque, generic recommendation algorithms that don't reflect a listener's true taste. They surface popular content over niche discoveries, ignore long-term listening history, and provide no transparency into why something is recommended. The user wants a personal music discovery tool — one that knows their listening history deeply, surfaces new releases from artists they actually care about, and explains its recommendations. They already scrobble everything to Last.FM, which makes it the ideal data source for a personalised system.

## Solution

A personal web app that reads the user's Last.FM scrobbling data to show what's currently playing (with rich artist visuals and metadata), recommend new music based on their actual listening habits, and surface new releases from artists they love. The app is hosted on a private Linux server (Tailscale-only), uses a dark-mode Roon-style UI, and is built entirely from open/free APIs — no Spotify, no Apple Music algorithm.

## User Stories

1. As a music listener, I want to see what's currently playing on my Last.FM account, so that I have a live "now playing" view without switching apps.
2. As a music listener, I want to see rich artist artwork and backgrounds for the currently playing artist, so that the experience feels visually immersive like Roon.
3. As a music listener, I want to see a biography of the artist I'm currently listening to, so that I can learn more about them in context.
4. As a music listener, I want to see the album art for the currently playing track, so that I can identify what I'm listening to at a glance.
5. As a music listener, I want the now playing view to update automatically, so that I don't have to refresh the page.
6. As a music listener, I want to see my top tags and genres derived from my listening history, so that I understand what the recommendation engine is using as input.
7. As a music listener, I want to receive personalised artist recommendations based on my Last.FM top artists, so that I discover music similar to what I already love.
8. As a music listener, I want recommendations to be weighted by how much I listen to the source artist, so that the most relevant suggestions appear first.
9. As a music listener, I want to see why a recommendation was made (e.g. "because you listen to Radiohead"), so that I can trust and evaluate it.
10. As a music listener, I want tag-based recommendations that match my most-listened genres, so that I discover music in styles I already enjoy even from unfamiliar artists.
11. As a music listener, I want recommended artists I've already listened to extensively to be filtered out or de-prioritised, so that recommendations feel genuinely new.
12. As a music listener, I want my recommendations to refresh daily, so that the list stays fresh without manual intervention.
13. As a music listener, I want to see new releases from artists in my Last.FM listening history, so that I never miss an album or EP from an artist I follow.
14. As a music listener, I want new releases filtered to the last 90 days, so that the list stays relevant and timely.
15. As a music listener, I want new releases sorted by how much I listen to that artist, so that the most important releases appear first.
16. As a music listener, I want to click on any artist and see a dedicated artist page, so that I can explore their discography and related artists in depth.
17. As a music listener, I want to see an artist's similar artists on their page, so that I can continue discovering related music.
18. As a music listener, I want to see my personal listening stats for an artist (play count, first scrobble), so that I can see my own history with them.
19. As a music listener, I want to see an artist's top albums and tracks, so that I know where to start when exploring someone new.
20. As a music listener, I want album art displayed throughout the app using Cover Art Archive, so that visuals are consistent and accurate.
21. As a music listener, I want the app to be fast and responsive, so that browsing feels fluid even when loading data from multiple APIs.
22. As a music listener, I want API responses cached so that repeated views load instantly and I don't hit rate limits.
23. As a music listener, I want the app to be accessible only over Tailscale, so that my listening data stays private.
24. As a music listener, I want a single set of credentials (username/password via env vars) to protect the app, so that it's secured without complex auth infrastructure.
25. As a music listener, I want the entire app deployable via Docker Compose, so that I can run it on my Linux server with a single command.
26. As a music listener, I want my recommendation and new release data persisted in PostgreSQL, so that it survives server restarts and can be backed up.
27. As a music listener, I want a dark mode UI throughout, so that the app looks great with full-bleed artist imagery.
28. As a music listener, I want a navigation structure with Now Playing, Recommendations, New Releases, and Artist pages, so that I can move between discovery modes easily.

## Implementation Decisions

### Modules

**LastFMClient**

- Encapsulates all Last.FM API interactions
- Methods: `getNowPlaying(username)`, `getTopArtists(username, period)`, `getTopTags(username)`, `getSimilarArtists(artistName)`, `getArtistInfo(artistName)`, `getAlbumInfo(artist, album)`
- Returns typed, normalised response objects
- Handles API errors and missing data gracefully

**MusicBrainzClient**

- Encapsulates MusicBrainz API interactions
- Methods: `searchArtist(name)`, `getRecentReleases(mbid, since)` — returns releases within a given date range
- Maps Last.FM artist names to MusicBrainz IDs (MBID)

**FanartTVClient**

- Encapsulates Fanart.tv API interactions
- Methods: `getArtistImages(mbid)` — returns background, thumbnail, logo URLs
- Returns null-safe results (not all artists have Fanart.tv entries)

**CoverArtArchiveClient**

- Encapsulates Cover Art Archive API interactions
- Methods: `getAlbumArt(releaseMbid)` — returns front cover URL
- Falls back gracefully when no art is available

**RecommendationEngine**

- Pure function: takes top artists + their similar artists + user's top tags → returns ranked recommendation list
- Scoring: similar artist score weighted by source artist play count + tag overlap bonus
- Filters out artists the user already listens to heavily (configurable threshold)
- Returns recommendations with explanation metadata (source artist, matching tags)

**NewReleasesService**

- Orchestrates: fetches top artists from LastFMClient → resolves MBIDs via MusicBrainzClient → fetches recent releases → filters by date range → sorts by artist play count
- Returns typed new release objects with artist, release title, date, type (album/EP/single)

**NowPlayingPoller**

- Polls Last.FM `getNowPlaying` every 30 seconds
- Writes current track to Redis with short TTL
- Runs as a background process within the Next.js server lifecycle

**CacheService**

- Redis wrapper with typed get/set/invalidate
- Configurable TTL per cache key type
- Used by all API clients to cache external responses

**Database Layer (Prisma + PostgreSQL)**

- Schema: `Artist`, `Recommendation`, `NewRelease`, `ArtistImage`
- Stores computed recommendation results and new release lists (refreshed daily)
- Stores cached artist metadata to reduce external API calls

**Scheduler**

- Daily cron jobs: refresh recommendations, refresh new releases
- Runs within the Next.js server process using a lightweight job scheduler
- Logs run results to the database

**Next.js API Routes**

- `GET /api/now-playing` — reads from Redis, returns current track
- `GET /api/recommendations` — reads from PostgreSQL
- `GET /api/new-releases` — reads from PostgreSQL
- `GET /api/artist/[id]` — aggregates Last.FM + Fanart.tv + MusicBrainz data
- Auth middleware: validates env var credentials via HTTP Basic Auth or session cookie

**UI Pages**

- Now Playing: full-bleed Fanart.tv background, album art, track/artist name, bio excerpt
- Recommendations: card grid with artist image, name, explanation tag
- New Releases: chronological list grouped by release date, with album art
- Artist detail: hero image, bio, top tracks, top albums, similar artists, user stats

### Architecture Decisions

- Next.js App Router with TypeScript throughout
- PostgreSQL via Prisma ORM
- Redis via `ioredis`
- All external API keys stored in environment variables
- Docker Compose: `app` (Next.js), `db` (PostgreSQL), `cache` (Redis)
- Single-user auth via HTTP Basic Auth validated against `AUTH_USERNAME` / `AUTH_PASSWORD` env vars
- Now playing poll runs server-side; UI subscribes via polling `GET /api/now-playing`

## Testing Decisions

**What makes a good test:**

- Tests external behaviour only — what goes in, what comes out
- Does not assert on internal implementation details or private methods
- Each test is independent and does not rely on test order
- Uses real data shapes (typed fixtures) rather than mocks where possible
- For API clients: mock the HTTP layer (fetch/axios), not the business logic

**Modules to test:**

- **LastFMClient** — test each method with mocked HTTP responses; assert correct parsing of Last.FM's response shapes, error handling for missing fields, and rate limit responses
- **MusicBrainzClient** — test artist search and release filtering with mocked responses; assert MBID resolution and date range filtering
- **FanartTVClient** — test image URL extraction with mocked responses; assert graceful null handling for missing artist entries
- **CoverArtArchiveClient** — test art URL extraction; assert fallback behaviour when no art exists
- **RecommendationEngine** — pure function, no mocks needed; test scoring logic, filtering of known artists, explanation metadata, and edge cases (empty inputs, all artists already known)
- **NewReleasesService** — test full orchestration with mocked client dependencies; assert correct filtering by date, sorting by play count, and deduplication

## Out of Scope

- Music playback — this is not a player app
- Spotify integration
- Apple Music integration
- Multi-user support
- Mobile app
- Social features (sharing, following)
- User-configurable recommendation weights (may be added later)
- Podcast support
- Manual scrobble editing
- Public internet exposure (Tailscale-only)

## Further Notes

- Last.FM API key required (free, register at last.fm/api)
- Fanart.tv API key required (free, register at fanart.tv)
- MusicBrainz and Cover Art Archive are fully open, no key required
- The recommendation engine should be designed as a pure function to make it easy to tune and test without infrastructure
- MusicBrainz has rate limits (1 req/sec); the MusicBrainzClient should respect this with a request queue
- The 90-day new releases window should be configurable via environment variable
- Fanart.tv images are keyed by MusicBrainz artist ID — the app needs a reliable Last.FM name → MBID resolution step
