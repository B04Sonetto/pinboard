# Pinboard

A university academic community and knowledge-sharing platform. Students can publish class notes, browse community-built courses, save material, and generate AI study reviewers and quizzes from selected notes.

Built with **SvelteKit 2**, **Svelte 5**, **TypeScript**, **Tailwind CSS 4**, and **Supabase** (Auth, Postgres, Row Level Security, Storage).

> Pinboard is a community study space, not an official university records system. Community-submitted and community-verified material is labelled clearly and is separate from official university information.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

The app needs a Supabase project with the Pinboard schema before sign-in will work. Follow the setup steps below once per project.

### Requirements

- Node.js 20 or newer
- npm
- A Supabase project (free tier is fine)
- Supabase SQL editor access

---

## Supabase setup

### 1. Configure environment variables

`.env` is already present for the configured project. To point the app at a different project, copy `.env.example` and fill in:

```env
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Use the **publishable (anon) key**, never a service-role key, in this app.

### 2. Create the schema

Open **Supabase Dashboard → SQL Editor**, paste the full contents of [`supabase/setup.sql`](supabase/setup.sql), and run it.

This creates:

- Enums, tables, indexes, triggers, and helper functions
- Row Level Security policies for students, moderators, and admins
- The private `note-files` storage bucket and its access policies
- Full-text search on notes

The script is idempotent and safe to re-run.

### 3. Add demo content (optional, recommended)

Paste and run [`supabase/seed.sql`](supabase/seed.sql) in the SQL Editor. It adds:

- Five departments, ten programs, fifteen subjects, and their topics
- Twelve demo profiles, fifteen published notes, and activity
- Demo suggestions and moderation content

The seed is safe to re-run.

### 4. Email confirmation

New sign-ups must confirm their email by default. For a quick local demo, either:

- **Disable confirmation:** Supabase Dashboard → **Authentication → Providers → Email** → turn off **Confirm email**, or
- **Confirm manually:** Authentication → **Users** → open the user → confirm the email.

The app redirects confirmation links to `/auth/callback`.

### 5. Promote your account

The demo profiles in `seed.sql` are content authors only; they are not login accounts. After you sign up, promote your own profile to test moderator or admin screens:

```sql
update public.profiles
   set role = 'admin' -- or 'moderator'
 where id = (select id from auth.users where email = 'you@example.com');
```

Sign out and back in after changing roles.

### 6. Verify the connection

Visit <http://localhost:5173/setup>. It checks the configured project and tells you whether the schema is ready.

If tables are missing, every app route redirects to sign-in and the login page links to the setup guide.

---

## Using Pinboard

### Roles

| Role | What they can do |
| --- | --- |
| **Student** | Publish notes, browse and save notes and topics, generate study material, take quizzes, submit suggestions, edit their profile |
| **Moderator** | Everything a student can do, plus review submitted notes, decide suggestions, and resolve reports |
| **Admin** | Everything a moderator can do, plus manage departments, programs, subjects, topics, and user roles |

Change a role from **Admin → Role management**, or with SQL as shown above.

### Labels

Every note carries a source label:

- **Community Submitted** — shared by a student, not yet reviewed
- **Community Verified** — reviewed and approved by a moderator
- **AI Generated** — produced by the study engine from selected notes

### Screens

| Route | Purpose |
| --- | --- |
| `/login`, `/register`, `/forgot-password` | Email/password accounts and password recovery |
| `/dashboard` | Personal overview, recent activity, saved items, quick actions |
| `/notes` | Browse and search community notes with filters and sorting |
| `/notes/[id]` | Read a note, save it, download it, report it, or moderate it |
| `/notes/new` | Write in Markdown or upload a PDF/DOCX/TXT/MD file to prefill the editor |
| `/topics` | Explore the taxonomy and follow topics |
| `/courses` | Community curriculum grouped by department and program |
| `/courses/[subjectId]` | Subject hub with topics, notes, and sibling subjects |
| `/study` | AI Study Assistant: pick department, program, subject, topic, and source notes |
| `/study/[id]` | Generated reviewer, summary, quiz, or keyword list |
| `/study/[id]/quiz` | Interactive quiz with server-side scoring and explanations |
| `/study/history` | Past generations and quiz attempts |
| `/suggestions` | Suggest courses, subjects, lessons, corrections, or platform changes |
| `/collection` | Saved notes, followed topics, quiz history, and recent contributions |
| `/profile` | Profile details, academic context, and contribution history |
| `/moderation` | Moderator queue for notes, suggestions, and reports |
| `/admin` | Admin overview, taxonomy management, and role management |

### Study Assistant

The assistant runs a deterministic, server-side extractive engine (`src/lib/server/study-engine.ts`) over the notes you select:

- **Reviewer** — structured study guide with key ideas and definitions
- **Summary** — condensed overview of the selected material
- **Quiz** — multiple-choice and cloze questions with explanations
- **Keywords** — weighted terms and definitions

No external LLM key is needed. You can also attach your own notes in the assistant, and all output is labelled **AI Generated** with its sources listed.

### File uploads

- Supported: PDF, DOCX, TXT, MD
- Text is extracted server-side (`unpdf`, `mammoth`) to prefill the editor
- Files are stored in the private `note-files` bucket and served through authenticated download endpoints
- Upload a file to prefill, then review and edit before publishing

---

## Development

```bash
npm run dev       # start the dev server
npm run check     # svelte-check + TypeScript
npm run build     # production build
npm run preview   # preview the production build
```

### Project layout

```text
src/
  app.css                  design tokens, component classes, prose styles
  hooks.server.ts          per-request auth, profile, and setup detection
  lib/
    components/            shared UI (note cards, badges, shell, nav, forms)
    server/
      queries.ts           shared note selects, taxonomy, bookmark helpers
      study-engine.ts      extractive summary/reviewer/quiz/keywords
      extract.ts           PDF/DOCX/TXT/MD text extraction
    supabase/              browser and server Supabase clients
    types.ts               domain and database types
  routes/
    (app)/                 authenticated application shell
    api/                   bookmarks, extraction, downloads, quiz, study
    auth/                  confirmation and password recovery callbacks
supabase/
  setup.sql                schema, RLS, functions, storage
  seed.sql                 demo taxonomy, notes, and profiles
```

### Deployment

The project uses `@sveltejs/adapter-auto`. Deploy to Vercel, Netlify, Cloudflare, or another supported host, then set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the host's environment settings.

For production, re-enable email confirmation and configure SMTP under **Authentication → Emails**.

---

## Troubleshooting

**Routes keep redirecting to sign-in**

The schema has not been applied, or the environment points at the wrong Supabase project. Run `supabase/setup.sql`, then open `/setup` to confirm.

**Sign-up succeeds but you cannot sign in**

Email confirmation is enabled. Confirm the address from the email, or disable confirmation for local testing.

**A note or subject is missing**

Row Level Security only exposes verified notes and your own submissions to regular students. Moderators and admins see everything.

**`42P17: generation expression is not immutable` while running setup**

You are running an older copy of `supabase/setup.sql`. Re-copy the current file; it wraps keyword concatenation in the `public.keywords_to_text(text[])` helper so the generated `notes.search_vector` column can be created.

**`42501: must be owner of table objects` while running setup**

Do not add `alter table storage.objects ...` statements. Supabase already enables RLS there and blocks ownership changes; this script only creates policies, which the SQL Editor is allowed to do.

**A generated quiz has few questions**

The engine needs enough unique sentences in the selected notes. Select more or longer source notes, or attach your own notes.

**Role changes do not take effect**

Sign out and sign in again so the session reloads the profile and role.
