# Project Context

## Purpose
Build a web-only, allowlisted AI-led qualitative research product that is fully functional and “classy,” while staying lightweight enough for a solo PM to ship and learn. The product:
- Takes an open-ended research brief via chat and converts it into a structured study setup (objective, topics, success criteria, audience, guidelines, participant intro).
- Generates an interview guide.
- Supports interviewer voices: preset voices plus voice cloning with style controls (dialect, pacing, key phrases).
- Requires human review before launch, including a “test interview” mode to experience the flow as a participant.
- Invites participants via shareable links.
- Captures interview recordings (audio/video when feasible) and transcripts.
- Produces a shareable report (minimum: summary + key insights + access to transcripts/recordings).

Primary learning goal: build end-to-end workflows (setup → interview → analysis → report) with a tight scope and strong UX.

## Tech Stack
- Next.js (App Router) + React
- TypeScript
- Tailwind CSS
- shadcn/ui (Radix-based components)
- Supabase Auth (allowlist-only login; no public signup)
- Supabase Postgres (primary DB)
- Supabase Storage (media + transcripts + report artifacts)
- Lightweight async processing:
  - Supabase `jobs` table + single worker process for long-running tasks (transcription + synthesis) (Assumption)
- Deployment:
  - Vercel for Next.js
  - Supabase hosted project
  - Optional: Render/Fly/Railway for worker-only hosting (if needed)

## Project Conventions

### Code Style
- Optimize for readability and iteration speed; keep conventions minimal and consistent.
- TypeScript:
  - `strict` enabled.
  - Zod schemas for boundary validation (forms, server actions/route handlers).
  - Naming: `camelCase` (vars/functions), `PascalCase` (components/types), `SCREAMING_SNAKE_CASE` (env vars).
- Database:
  - Tables/columns in `snake_case`.
  - Explicit foreign keys.
  - Enum-like status fields for workflows (study/interview/job states).
- Formatting/Linting:
  - ESLint + Prettier only.
- Error handling:
  - All provider calls return structured errors (`provider`, `operation`, `retryable`, `message`).
  - No silent failures; safe UI errors plus server-side logs with correlation IDs.

### Architecture Patterns
- “One app” architecture for v1:
  - Next.js handles UI + orchestration + CRUD via route handlers/server actions.
  - Supabase is the source of truth (auth/db/storage).
  - One optional worker handles long-running tasks; avoid Celery/Redis.
- Keep domain modules limited to four:
  - `studies`: brief → structured setup → guide → test → publish
  - `voice_profiles`: preset voices + cloned voices + style settings + consent metadata
  - `interviews`: participant sessions, recordings, transcripts, completion
  - `reports`: synthesis outputs, insight objects, evidence links
- Treat the workflow as a state machine:
  - Study: `draft` → `ready_for_test` → `tested` → `live` → `closed`
  - Interview: `created` → `in_progress` → `completed` → `failed`
  - Job: `queued` → `running` → `done` → `failed` (with retries)
- Lightweight async jobs:
  - Insert work into `jobs` table.
  - Worker polls `queued` jobs, processes, updates results.
  - Simple retry with backoff and max attempts.
- Traceability principle:
  - Insights should link to transcript snippets/interviews where feasible.

### Testing Strategy
- Keep automated tests thin and focused on workflow correctness.
- Automated tests (minimum):
  - 8–15 unit tests covering:
    - brief-to-structured output includes required fields
    - state transitions (publish requires test/approve)
    - job enqueue/completion writes expected artifacts
- Prompt “golden sets”:
  - Maintain ~5 sample briefs with expected structured outputs.
  - Check schema presence and basic sanity (not subjective grading).
- Manual testing:
  - Manual happy-path checklist before each deployment:
    - create study → generate guide → voice clone setup → test interview → publish link → complete interview → report view
- Avoid heavy E2E frameworks until necessary (Assumption).

### Git Workflow
- Trunk-based solo workflow:
  - Work directly on `main` with frequent small commits.
  - Use short-lived branches only for risky refactors.
- Commit conventions:
  - Clear descriptive messages; optional light `feat:`/`fix:` prefixes, but not required.
- Releases:
  - Tag milestones or deployments (e.g., `v0.1-test-interview`, `v0.2-voice-clone`).

## Domain Context
- This is qualitative research (interviews + synthesis), not surveys.
- A “Study” includes:
  - Free-form brief (chat)
  - Structured setup fields (objective, topics, success criteria, audience, guidelines, participant intro)
  - Interview guide (questions + probes)
  - Voice configuration (preset or cloned voice + style/dialect notes)
  - Participant invite link(s)
  - Interview sessions with recordings and transcripts
  - Report artifacts (minimum: summary + key insights; evolves later)
- Voice cloning is a differentiator to improve completion/engagement in known communities (instructors, CEOs, community leaders).
- “Test Interview” is mandatory before publishing links:
  - Creator experiences participant flow and listens to configured voice.
- Trust risks to manage:
  - Interview quality must be coherent and non-leading.
  - Insights must be grounded in transcripts (no invented claims).
  - Moderate guardrails against manipulation.

## Important Constraints
- Solo builder, learning-focused: minimize moving parts and infra.
- Web-only v1.
- No public signup:
  - Landing page has “Book a meeting” / “Contact me”.
  - Allowlisted login only to control costs (LLM + TTS + ASR).
- Timeline: v1 targeted for ~6–8 weeks.
- Report structure intentionally minimal in v1.
- Voice cloning requires consent handling and deletion capability.

## External Dependencies
- Supabase:
  - Auth (allowlist login)
  - Postgres database
  - Storage for media and artifacts
- LLM provider(s) for:
  - brief → structured setup
  - guide generation
  - interview reasoning/probing (text)
  - synthesis + report generation
- ElevenLabs API for:
  - TTS voices
  - voice cloning
- Speech-to-text provider for transcription (Assumption)
- Vercel for Next.js deployment
- Optional worker hosting (Render/Fly/Railway) if async jobs exceed platform limits
