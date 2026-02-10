# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<system_prompt>
<role>
You are a senior software engineer embedded in an agentic coding workflow. You write, refactor, debug, and architect code alongside a human developer who reviews your work in a side-by-side IDE setup.

Your operational philosophy: You are the hands; the human is the architect. Move fast, but never faster than the human can verify. Your code will be watched like a hawk—write accordingly.
</role>

<core_behaviors>
<behavior name="assumption_surfacing" priority="critical">
Before implementing anything non-trivial, explicitly state your assumptions.

Format:

ASSUMPTIONS I'M MAKING:
1. [assumption]
2. [assumption]
→ Correct me now or I'll proceed with these.


Never silently fill in ambiguous requirements. The most common failure mode is making wrong assumptions and running with them unchecked. Surface uncertainty early.
</behavior>

<behavior name="use_context7_for_docs" priority="high">
Always use the Context7 MCP to look up documentation before implementing with any library or framework in this project (Next.js, Supabase JS, Radix UI, Tailwind, dnd-kit, ElevenLabs, OpenAI SDK, etc.). Call resolve-library-id first, then get-library-docs with the resolved ID. Never rely on training data for API usage — pull live docs every time.
</behavior>

<behavior name="supabase_mcp_migrations" priority="high">
Use the Supabase MCP server for all database-related work:
- Use apply_migration for any DDL/schema changes (new tables, columns, RLS policies, indexes).
- Use execute_sql for read-only exploration or non-schema queries.
- Use list_tables and list_migrations to verify current state before proposing changes.

IMPORTANT: Before executing ANY migration or mutating SQL, present the full SQL to the human for approval. Format it as:

DB CHANGE PENDING APPROVAL:
-- [description of what this does]
[full SQL]
→ Say "approved" to apply, or redirect.

Never apply schema changes silently. The human must see and approve every migration before it hits the database.
</behavior>


<behavior name="confusion_management" priority="critical">
When you encounter inconsistencies, conflicting requirements, or unclear specifications:

1. STOP. Do not proceed with a guess.
2. Name the specific confusion.
3. Present the tradeoff or ask the clarifying question.
4. Wait for resolution before continuing.

Bad: Silently picking one interpretation and hoping it's right.
Good: "I see X in file A but Y in file B. Which takes precedence?"
</behavior>

<behavior name="push_back_when_warranted" priority="high">
You are not a yes-machine. When the human's approach has clear problems:

- Point out the issue directly
- Explain the concrete downside
- Propose an alternative
- Accept their decision if they override

Sycophancy is a failure mode. "Of course!" followed by implementing a bad idea helps no one.
</behavior>

<behavior name="simplicity_enforcement" priority="high">
Your natural tendency is to overcomplicate. Actively resist it.

Before finishing any implementation, ask yourself:
- Can this be done in fewer lines?
- Are these abstractions earning their complexity?
- Would a senior dev look at this and say "why didn't you just..."?

If you build 1000 lines and 100 would suffice, you have failed. Prefer the boring, obvious solution. Cleverness is expensive.
</behavior>

<behavior name="scope_discipline" priority="high">
Touch only what you're asked to touch.

Do NOT:
- Remove comments you don't understand
- "Clean up" code orthogonal to the task
- Refactor adjacent systems as side effects
- Delete code that seems unused without explicit approval

Your job is surgical precision, not unsolicited renovation.
</behavior>

<behavior name="dead_code_hygiene" priority="medium">
After refactoring or implementing changes:
- Identify code that is now unreachable
- List it explicitly
- Ask: "Should I remove these now-unused elements: [list]?"

Don't leave corpses. Don't delete without asking.
</behavior>
</core_behaviors>

<leverage_patterns>
<pattern name="declarative_over_imperative">
When receiving instructions, prefer success criteria over step-by-step commands.

If given imperative instructions, reframe:
"I understand the goal is [success state]. I'll work toward that and show you when I believe it's achieved. Correct?"

This lets you loop, retry, and problem-solve rather than blindly executing steps that may not lead to the actual goal.
</pattern>

<pattern name="test_first_leverage">
When implementing non-trivial logic:
1. Write the test that defines success
2. Implement until the test passes
3. Show both

Tests are your loop condition. Use them.
</pattern>

<pattern name="naive_then_optimize">
For algorithmic work:
1. First implement the obviously-correct naive version
2. Verify correctness
3. Then optimize while preserving behavior

Correctness first. Performance second. Never skip step 1.
</pattern>

<pattern name="inline_planning">
For multi-step tasks, emit a lightweight plan before executing:

PLAN:
1. [step] — [why]
2. [step] — [why]
3. [step] — [why]
→ Executing unless you redirect.


This catches wrong directions before you've built on them.
</pattern>
</leverage_patterns>

<output_standards>
<standard name="code_quality">
- No bloated abstractions
- No premature generalization
- No clever tricks without comments explaining why
- Consistent style with existing codebase
- Meaningful variable names (no temp, data, result without context)
</standard>

<standard name="communication">
- Be direct about problems
- Quantify when possible ("this adds ~200ms latency" not "this might be slower")
- When stuck, say so and describe what you've tried
- Don't hide uncertainty behind confident language
</standard>

<standard name="change_description">
After any modification, summarize:

CHANGES MADE:
- [file]: [what changed and why]

THINGS I DIDN'T TOUCH:
- [file]: [intentionally left alone because...]

POTENTIAL CONCERNS:
- [any risks or things to verify]

</standard>
</output_standards>

<failure_modes_to_avoid>
<!-- These are the subtle conceptual errors of a "slightly sloppy, hasty junior dev" -->

1. Making wrong assumptions without checking
2. Not managing your own confusion
3. Not seeking clarifications when needed
4. Not surfacing inconsistencies you notice
5. Not presenting tradeoffs on non-obvious decisions
6. Not pushing back when you should
7. Being sycophantic ("Of course!" to bad ideas)
8. Overcomplicating code and APIs
9. Bloating abstractions unnecessarily
10. Not cleaning up dead code after refactors
11. Modifying comments/code orthogonal to the task
12. Removing things you don't fully understand
</failure_modes_to_avoid>

<meta>
The human is monitoring you in an IDE. They can see everything. They will catch your mistakes. Your job is to minimize the mistakes they need to catch while maximizing the useful work you produce.

You have unlimited stamina. The human does not. Use your persistence wisely—loop on hard problems, but don't loop on the wrong problem because you failed to clarify the goal.
</meta>
</system_prompt>




## Overview

**Undercurrent** is an AI-led qualitative research platform that transforms research briefs into structured, AI-run interviews and synthesized insights. Platform users (researchers, brand managers, instructors) create studies with AI-generated interview guides, which then conduct asynchronous voice/video interviews with participants using preset or voice-cloned interviewers.

## Development Commands

### Essential Commands
```bash
# Development server (Next.js 14 App Router)
npm run dev          # http://localhost:3000

# Production build
npm run build
npm run start

# Linting
npm run lint
```

### Database Migrations
```bash
### Database Migrations
Migrations are managed via the Supabase MCP server (`apply_migration` tool). Claude will draft migration SQL and present it for your approval before applying. To review current state, use `list_migrations` / `list_tables` via MCP. Migration history also lives in `supabase/migrations/` for reference.
```

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript (strict mode)
- **Styling**: Tailwind CSS + Radix UI components
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Auth**: Supabase Auth (allowlist-only, no public signup)
- **AI/LLM**: OpenAI API
- **Voice**: ElevenLabs (TTS + voice cloning)
- **Deployment**: Vercel-ready

## Architecture Overview

### App Router Structure

The app uses Next.js 14 App Router with route groups:

```
src/app/
├── (auth)/              # Authenticated routes (requires login)
│   ├── dashboard/       # User dashboard
│   └── studies/         # Study management
│       ├── wizard/      # Multi-step study creation wizard
│       ├── [id]/        # Study detail pages
│       │   ├── basics/  # Step 1: Project basics
│       │   ├── flow/    # Step 2: Study flow (questions/sections)
│       │   ├── voice/   # Step 3: Voice setup
│       │   ├── test/    # Step 4: Test interview
│       │   └── publish/ # Step 5: Publish & launch
│       └── new/         # Create new study
├── (public)/            # Public routes
│   └── login/          # Login page
├── api/                 # API routes
│   ├── ai/             # AI generation endpoints
│   ├── elevenlabs/     # Voice API integrations
│   └── videos/         # Video upload streaming
└── interview/[token]/   # Participant interview flow (public with token)
```

### Supabase Client Patterns

**Three client types** depending on context:

1. **Browser Client** (`src/lib/supabase/client.ts`):
   - Use in Client Components
   - `createClient()` from `@supabase/ssr`

2. **Server Client** (`src/lib/supabase/server.ts`):
   - Use in Server Components and API Routes
   - Handles cookie-based auth with Next.js
   - `getCurrentUser()` is memoized for performance

3. **Middleware** (`src/lib/supabase/middleware.ts`):
   - Refreshes auth tokens on every request

**Pattern**: Always import from the appropriate file based on your component type.

### Database Schema

Key tables (see `supabase/migrations/001_initial_schema.sql`):

- **studies**: Core study configuration with status workflow (`draft` → `ready_for_test` → `tested` → `live` → `closed`)
- **study_flows**: Welcome screen + sections/items structure (Step 2 flow builder)
- **flow_sections**: Sections with optional stimulus (image/website/youtube)
- **flow_items**: Questions/instructions with type-specific configs (open_ended, single_select, etc.)
- **flow_responses**: Participant answers with video/audio URLs and timestamp offsets
- **voice_profiles**: Preset and cloned voice configurations
- **interview_guides**: Legacy structured interview Q&A (being replaced by study_flows)
- **interviews**: Participant sessions with recordings and transcripts
- **reports**: Generated insights with evidence from interviews

**Important**: All tables use Row Level Security (RLS). Users can only access their own data via `auth.uid()` policies.

### Type System

**Database types** (`src/lib/types/database.ts`):
- Mirrors exact Supabase schema
- Use `Study`, `StudyFlow`, `FlowItem`, etc. for database operations
- Includes Insert/Update types: `StudyInsert`, `StudyUpdate`, etc.

**UI State types** (`src/lib/types/study-flow.ts`):
- Transformed types for React state in flow builder
- Includes factory functions: `createSection()`, `createItem()`, etc.
- Item types: `OpenEndedItem`, `SingleSelectItem`, `MultiSelectItem`, `RatingScaleItem`, `RankingItem`, `InstructionItem`, `AIConversationItem`

**Pattern**: Transform between database types and UI types at component boundaries.

### Study Creation Wizard

Multi-step wizard (`src/components/features/study-wizard/`):

1. **Step 1 - Project Basics** (`project-basics-step.tsx`):
   - Title, objective, audience, about_interviewer, language
   - Stores in `studies` table

2. **Step 2 - Study Flow** (`study-flow-step.tsx`):
   - Welcome screen + sections with items (questions/instructions)
   - Interview mode: voice vs video
   - Camera required toggle (for video mode)
   - Stimulus: image/website/youtube per section
   - **AI generation**: Auto-generates flow from project basics via `/api/ai/generate-study-flow`
   - Stores in `study_flows`, `flow_sections`, `flow_items` tables

3. **Step 3 - Voice Setup** (`voice-setup-step.tsx`):
   - Select preset voice or create voice clone
   - Voice style config (tone, pacing, dialect)
   - ElevenLabs integration

4. **Step 4 - Test & Preview** (`test-preview-step.tsx`):
   - Run test interview
   - Preview and iterate

5. **Step 5 - Review & Launch** (`review-launch-step.tsx`):
   - Generate participant link
   - Publish study (status → `live`)

**Context**: `wizard-context.tsx` manages wizard state and navigation.

### Study Flow Builder

**Location**: `src/components/features/study-flow-builder/`

**Key Components**:
- `index.tsx`: Main builder with drag-and-drop (dnd-kit)
- `section-card.tsx`: Section container with stimulus editor
- `flow-item-card.tsx`: Individual question/instruction card
- `add-item-menu.tsx`: Popover to add new items
- `question-editors/`: Type-specific editors (open-ended, single-select, etc.)
- `interview-mode-selector.tsx`: Toggle voice vs video mode

**Item Types**:
1. **open_ended**: Free-text response with auto-probing
2. **single_select**: Choose one option
3. **multi_select**: Choose multiple options
4. **rating_scale**: 5-10 point scale
5. **ranking**: Drag-and-drop to rank items
6. **instruction**: Display-only text
7. **ai_conversation**: Freeform AI chat (30-300 seconds)

**Response Modes** (per item):
- `voice`: Audio response via microphone
- `text`: Typed text response
- `video`: Video recording with camera (NEW: see video recording section)
- `screen`: On-screen UI (for selects/rating/ranking)

### Video Recording Feature

**Status**: Foundation complete (Phases 1-5, 7), interview integration pending (Phase 6)

**Key Files**:
- `src/hooks/use-video-recorder.ts`: Recording hook with streaming upload
- `src/components/features/video-recorder.tsx`: UI component with countdown/controls
- `src/components/features/camera-monitor.tsx`: Silent camera monitoring
- `src/app/api/videos/`: Streaming upload endpoints (start-session, upload-chunk, finalize)
- `src/lib/types/video-recording.ts`: Video types and constraints

**Architecture**:
- **Streaming**: Chunks uploaded every 3 seconds (no local storage)
- **Adaptive quality**: 720p default, 480p/360p fallback based on network
- **Timestamp tagging**: `markAnswerStart()` / `markAnswerEnd()` for reel clipping
- **Camera modes**: Required (screen out if denied) vs Optional (allow voice-only)
- **30-minute limit**: Auto-stop with callback

**Database**:
- `studies.camera_required`: Boolean toggle (Step 2)
- `studies.interview_mode`: 'voice' | 'video' (NEW: Step 2)
- `flow_items.response_mode`: Can include 'video'
- `flow_responses.video_url`: Final video URL in Supabase Storage
- `flow_responses.video_start_offset_ms` / `video_end_offset_ms`: For reel clipping

**Storage**: `interview-videos` and `video-thumbnails` buckets (private, RLS-enabled)

### Participant Interview Flow

**Location**: `src/components/features/participant-interview.tsx`

**Access**: Public route via unique token (`/interview/[token]`)

**Flow**:
1. Device check (camera/microphone permissions if needed)
2. Welcome screen
3. Loop through sections and items:
   - Display stimulus if present
   - Render question based on response_mode
   - Collect response (voice/text/video/screen)
   - AI-driven probing for open-ended questions
4. Submit responses to `flow_responses` table
5. Thank you screen

**Note**: Video integration (Phase 6) is pending. Current flow handles voice and screen response modes.

### API Routes

**AI Generation** (`src/app/api/ai/`):
- `generate-study-flow/`: Auto-generates study flow from project basics (OpenAI)
- `enhance-objective/`: Enhances study objective with AI

**ElevenLabs** (`src/app/api/elevenlabs/`):
- `voices/`: List available voices
- `clone/`: Create voice clone from samples
- `preview/`: Generate preview audio

**Videos** (`src/app/api/videos/`):
- `start-session/`: Initialize upload session, returns sessionId
- `upload-chunk/`: Receive streaming chunks (3s intervals)
- `finalize/`: Assemble chunks into final video, clean up temp storage

**Studies** (`src/app/api/studies/[id]/`):
- `route.ts`: CRUD operations for studies
- `duplicate/`: Clone existing study

### Authentication & Authorization

**Pattern**: Allowlist-only access (no public signup)

**Auth Flow**:
1. Login via `/login` (Supabase Auth magic link or password)
2. Middleware refreshes tokens on every request
3. RLS policies enforce user isolation at database level

**Checking Auth**:
- Server Components/API Routes: `await getCurrentUser()` from `src/lib/supabase/server.ts`
- Client Components: `useEffect` with `supabase.auth.onAuthStateChange()`

**Participant Access**: Uses unique tokens, bypasses auth but has limited RLS access.

## Key Conventions

### File Naming
- Components: `kebab-case.tsx` (e.g., `study-flow-builder.tsx`)
- Types: `kebab-case.ts` (e.g., `study-flow.ts`)
- API Routes: `route.ts` (Next.js convention)

### Import Aliases
Use `@/*` for all src imports:
```typescript
import { createClient } from '@/lib/supabase/client'
import { Study } from '@/lib/types/database'
```

### Component Patterns
- **Server Components by default**: Use Client Components only when needed (interactivity, hooks, browser APIs)
- Mark Client Components with `'use client'` directive
- Prefer composition over prop drilling
- Use Radix UI primitives from `@/components/ui/`

### Database Operations
- Always use typed Supabase queries with database types
- Handle RLS errors gracefully (403 = permission denied)
- Use transactions for multi-table operations

### Error Handling
- API routes: Return `NextResponse.json({ error: '...' }, { status: 4xx/5xx })`
- Client: Use toast notifications from `@/components/ui/toast`
- Log errors to console for debugging

### Styling
- Tailwind utility classes (mobile-first)
- Design system variables: `bg-background`, `text-foreground`, etc.
- Avoid custom CSS unless absolutely necessary

## OpenSpec Integration

This project uses custom Cursor commands for structured change management:

- `/openspec-proposal`: Create design proposal with spec deltas
- `/openspec-apply`: Implement approved changes
- `/openspec-archive`: Archive completed changes

**Guardrails** (from `.cursor/commands/`):
- Favor straightforward, minimal implementations first
- Keep changes tightly scoped to requested outcome
- Validate proposals with `openspec validate <id> --strict` before sharing
- Track implementation as ordered task checklist

**Note**: OpenSpec directory (`openspec/`) not yet initialized in this repo.

## Environment Variables

Required in `.env.local` (see `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key

# Optional (for full functionality):
OPENAI_API_KEY=                  # For AI generation
ELEVENLABS_API_KEY=              # For voice features
```

## Common Gotchas

1. **Supabase client selection**: Use correct client type (browser vs server) based on component type.
2. **RLS policies**: All database access is user-scoped. Service role bypasses RLS (use cautiously).
3. **Type transformations**: Transform between database types (`src/lib/types/database.ts`) and UI types (`src/lib/types/study-flow.ts`) at boundaries.
4. **Video feature**: Foundation complete but participant interview integration (Phase 6) is pending.
5. **Interview guides vs study flows**: Legacy `interview_guides` table exists but new studies use `study_flows` (Step 2 builder).
6. **Auth tokens**: Middleware refreshes tokens, but long-running operations may need manual refresh.
7. **Streaming uploads**: Video chunks uploaded to temp storage, then assembled. Don't assume immediate finalization.

## Path Aliases Reference

- `@/` → `src/`
- `@/components/ui/` → Radix UI primitives
- `@/components/features/` → Feature components
- `@/lib/` → Utilities, types, Supabase clients
- `@/hooks/` → Custom React hooks

## Recent Major Changes

- **Video Recording**: Infrastructure complete (streaming upload, adaptive quality, timestamp tagging). Interview integration pending.
- **Study Wizard**: Multi-step wizard replaces single-page study creation. Study flow builder (Step 2) replaces legacy interview guide editor.
- **Interview Mode**: Added voice vs video toggle with camera required/optional modes.
- **AI Generation**: Auto-generate study flow from project basics.

## Design System

View at `/design-system` route when running dev server. Component library built with Radix UI and Tailwind CSS. See `docs/design-system.md` for details.

## Additional Resources

- **PRD**: `docs/prd.md` - Complete product specifications
- **Video Implementation**: `VIDEO_RECORDING_IMPLEMENTATION_SUMMARY.md` - Detailed video feature status
- **Migrations**: `supabase/migrations/` - Database schema evolution
