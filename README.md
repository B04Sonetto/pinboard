# Pinboard

Pinboard is a student-first academic platform for sharing, discovering, and learning from community-generated study material. It brings together notes, course structure, topic discovery, saved collections, and AI-powered study tools in a single SvelteKit app.

The platform is designed for university communities where students can:

- publish and browse notes
- follow topics and courses
- save useful material to a personal collection
- generate study reviewers, summaries, and quizzes from selected notes
- participate in moderation and community review flows

Pinboard is built for academic collaboration, not as an official university records system. Community-submitted material is clearly labeled and separated from official academic sources.

## Features

- Smart study marketplace for notes and academic resources
- Course and subject organization by department/program
- Topic-based discovery and personal following
- Markdown note publishing with PDF/DOCX/TXT/MD upload support
- AI-generated review summaries, keyword lists, and quizzes
- Student, moderator, and admin roles with different permissions
- Search, filtering, reporting, and moderation workflows
- Supabase-powered authentication, storage, and database access control

## Tech stack

- SvelteKit 2
- Svelte 5
- TypeScript
- Tailwind CSS 4
- Supabase (Auth, Postgres, Storage, RLS)
- Vite
- PDF/DOCX/TXT text extraction via `unpdf` and `mammoth`

## Project structure

```text
pinboard/
├── src/
│   ├── app.css
│   ├── app.d.ts
│   ├── app.html
│   ├── hooks.server.ts
│   ├── lib/
│   │   ├── components/
│   │   ├── server/
│   │   │   ├── extract.ts
│   │   │   ├── queries.ts
│   │   │   └── study-engine.ts
│   │   ├── supabase/
│   │   └── types.ts
│   └── routes/
│       ├── (app)/
│       ├── api/
│       └── auth/
├── supabase/
│   ├── setup.sql
│   └── seed.sql
├── static/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project
- Access to the Supabase SQL editor

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Configure your environment:

```bash
cp .env.example .env
```

Then update the values with your Supabase project details:

```env
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Important: use the publishable anon key, not the service role key.

3. Start the app:

```bash
npm run dev
```

Open http://localhost:5173.

## Supabase setup

The app expects a configured Supabase database and storage schema before sign-in works.

### Step 1: Apply the database schema

Open the Supabase Dashboard, go to SQL Editor, and run the contents of:

- `supabase/setup.sql`

This creates the tables, enums, indexes, PostgreSQL functions, Row Level Security policies, and storage setup needed by the app.

For an existing database, also run [`supabase/migrations/20261115000000_generation_owner_updates.sql`](supabase/migrations/20261115000000_generation_owner_updates.sql) in the Supabase SQL Editor to enable owner-only editing of generated reviewers.

If practice exams fail with `invalid input value for enum study_kind: "exam"`, run this in the SQL Editor:

```sql
alter type public.study_kind add value if not exists 'exam';
```

### Step 2: Add demo data (optional but recommended)

Run:

- `supabase/seed.sql`

This populates sample departments, programs, subjects, topics, profiles, notes, and moderation/demo content.

### Step 3: Email confirmation

New users may need to confirm their email before signing in. For local testing you can either:

- disable email confirmation in Supabase auth settings, or
- confirm the user manually in the dashboard

### Step 4: Verify the app

Visit:

- `/setup`

This route checks whether the connected Supabase project is configured correctly.

## Roles and permissions

| Role | Permissions |
| --- | --- |
| Student | Publish notes, browse resources, save content, generate study materials, manage profile |
| Moderator | All student actions plus moderation, suggestion review, and report resolution |
| Admin | All moderator actions plus taxonomy and role management |

## Main app flows

- `/login`, `/register`, `/forgot-password` — authentication
- `/dashboard` — overview and saved items
- `/notes` — note discovery and filtering
- `/notes/new` — create notes or upload files
- `/topics` — academic taxonomy and topic discovery
- `/courses` — department/program-based curriculum browsing
- `/study` — AI-generated review and quiz material
- `/collection` — saved notes and personal history
- `/moderation` — review queue for submitted content
- `/admin` — system and role management

## Study assistant

Pinboard includes a server-side study engine that turns selected notes into:

- reviewer guides
- summaries
- quizzes
- keyword lists

This workflow is deterministic and does not require an external LLM key. Output is clearly labeled as AI-generated and references the source material used.

## File upload support

Users can upload:

- PDF
- DOCX
- TXT
- MD

The app extracts text server-side and pre-fills the editor before a note is published.

## Development

```bash
npm run dev       # start the app
npm run check     # run TypeScript + Svelte validation
npm run build     # production build
npm run preview   # preview the built app
```

## Deployment

This project uses `@sveltejs/adapter-auto`, so it can be deployed to Vercel, Netlify, Cloudflare, or other supported SvelteKit hosts.

When deploying, set the following environment variables on the host:

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

For production, enable email confirmation and configure SMTP under Supabase Auth settings.

## Troubleshooting

- If routes redirect to sign-in, the Supabase schema may not be set up or the environment may be pointing at the wrong project.
- If signup succeeds but login fails, confirm the email or disable confirmation for testing.
- If some notes or subjects are missing, verify that the project has the correct schema and role permissions in place.

## License

This project does not currently declare a license in the repository metadata.

## Contributing

Contributions are welcome. If you are working on improvements, do the following:

1. Create a branch
2. Make your changes
3. Validate with `npm run check`
4. Open a pull request

## Acknowledgements

Built with SvelteKit, Supabase, and the broader open-source ecosystem for modern web application development.

---

Pinboard is a community study space for collaborative academic learning, built to help students share knowledge and learn effectively together.
