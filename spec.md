# The Lot — Spec

## Typography

**Fonts:** [Outfit](https://fonts.google.com/specimen/Outfit) (headings & buttons) + [Inter](https://fonts.google.com/specimen/Inter) (body text)

| Use | Font | Weight |
|-----|------|--------|
| H1 / Hero text | Outfit | 600–700 |
| H2–H3 | Outfit | 500 |
| Body text | Inter | 400 |
| Captions / Labels | Inter | 500 |
| Buttons / CTAs | Outfit | 600 |

---

## Tech Stack

| Tool | Role |
|------|------|
| **TypeScript** | Language |
| **Bun** | Runtime + package manager |
| **Next.js 14 (App Router)** | Fullstack framework |
| **PlanetScale** | Hosted PostgreSQL database |
| **Drizzle ORM** | Type-safe database queries |
| **Zod** | Runtime data validation |

---

## Project Structure

```
thelot/
├── v1/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, global styles)
│   │   ├── page.tsx                # THE page — combined storyboard + editor
│   │   └── api/
│   │       ├── scenes/
│   │       │   ├── route.ts        # GET/POST /api/scenes
│   │       │   └── [sceneId]/
│   │       │       ├── route.ts    # GET/PUT/DELETE /api/scenes/:id
│   │       │       └── shots/
│   │       │           └── route.ts # GET/POST /api/scenes/:id/shots
│   │       └── shots/
│   │           └── [shotId]/
│   │               └── route.ts    # GET/PUT/DELETE /api/shots/:id
│   ├── components/
│   │   ├── SceneList.tsx           # Left sidebar — list of scenes + shots
│   │   ├── ShotDetail.tsx          # Center panel — all shot fields
│   │   ├── FramePreview.tsx        # Right panel — start/end frame + playback
│   │   ├── Timeline.tsx            # Bottom strip — all shots horizontally
│   │   └── ui/
│   │       └── ...                 # Shared buttons, inputs, modals
│   ├── db/
│   │   ├── schema.ts               # Drizzle table definitions
│   │   ├── index.ts                # Database connection
│   │   └── migrations/             # Auto-generated SQL migrations
│   ├── lib/
│   │   ├── validators.ts           # Zod schemas for API validation
│   │   └── utils.ts                # Shared helper functions
│   ├── public/                     # Static assets (images, fonts)
│   ├── .env.local                  # Database URL + secrets (git-ignored)
│   ├── package.json
│   ├── tsconfig.json
│   └── drizzle.config.ts           # Drizzle ORM config
├── spec.md
└── CLAUDE.md
```

---

## Database Schema (Drizzle ORM)

Bare minimum tables to make the page functional. Expand later as needed.

### `scenes`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar (cuid) | Primary key |
| title | varchar | e.g. "Support for Protocol" |
| order | int | Position in the scene list |
| createdAt | timestamp | |

### `shots`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar (cuid) | Primary key |
| sceneId | varchar | FK → scenes |
| title | varchar | e.g. "Window gazing" |
| order | int | Position within the scene |
| duration | int | Seconds |
| action | text | Action description |
| internalMonologue | text | Character thoughts |
| cameraNotes | text | Lens, framing, movement |
| videoUrl | varchar(2048) | Path to video in public folder (e.g. `/videos/shot1.mp4`) |
| createdAt | timestamp | |

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/scenes` | List all scenes |
| POST | `/api/scenes` | Create a scene |
| GET | `/api/scenes/:id` | Get scene details |
| PUT | `/api/scenes/:id` | Update scene (title, order) |
| DELETE | `/api/scenes/:id` | Delete a scene |
| GET | `/api/scenes/:id/shots` | List shots in a scene |
| POST | `/api/scenes/:id/shots` | Add a shot to a scene |
| GET | `/api/shots/:id` | Get full shot details |
| PUT | `/api/shots/:id` | Update shot fields |
| DELETE | `/api/shots/:id` | Delete a shot |

---

## Setup Instructions

### 1. Prerequisites
- Install [Bun](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
- Create a [PlanetScale](https://planetscale.com) account and database

### 2. Initialize the project
```bash
cd v1
# Already initialized via create-next-app — skip if v1/ is cloned from repo
# To re-init from scratch: bunx --bun create-next-app@latest ./ --typescript --app --src-dir --import-alias "@/*" --use-bun
```

### 3. Install dependencies
```bash
bun add zod @planetscale/database drizzle-orm cuid2
bun add -d drizzle-kit
```

### 4. Environment setup
Create `.env.local` at the project root:
```
DATABASE_URL=mysql://<user>:<password>@<host>/<database>?ssl={"rejectUnauthorized":true}
```
Get this connection string from PlanetScale dashboard → Connect → Node.js.

### 5. Database setup
1. Define tables in `db/schema.ts` following the schema above
2. Configure `drizzle.config.ts` to point at your schema and PlanetScale
3. Generate migrations: `bunx drizzle-kit generate`
4. Push to PlanetScale: `bunx drizzle-kit push`

### 6. Run the dev server
```bash
bun run dev
```
App runs at `http://localhost:3000`.
