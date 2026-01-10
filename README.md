# Undercurrent

**AI-led qualitative research platform** that transforms loose research briefs into structured, AI-run interviews and synthesized insights in about a day.

## Overview

Undercurrent enables brand managers, community managers, instructors, and leaders to run credible qualitative research studies without a research agency. The platform converts an open-ended brief into a structured project setup, generates interview guides, runs asynchronous AI interviews with real participants using preset or voice-cloned interviewers, and delivers transcripts, recordings, and synthesized insights.

### Key Features

- **Chat-Based Brief Creation**: Describe your research goals in plain language
- **AI-Powered Project Setup**: Automatically converts briefs into structured objectives, topics, and success criteria
- **Interview Guide Generation**: AI generates conversational, non-leading interview questions
- **Voice Cloning**: Create personalized interviewers using cloned voices (e.g., instructor, CEO) to increase trust and completion rates
- **Test Interviews**: Preview and refine interviews before going live
- **Asynchronous AI Interviews**: Participants complete interviews on their own time
- **Automated Analysis**: Generate summaries, key insights, and access to transcripts and recordings
- **Report Sharing**: Share read-only reports or export content for presentations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI/LLM**: OpenAI
- **Voice/TTS**: ElevenLabs (for voice cloning and text-to-speech)
- **Deployment**: Ready for Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account and project
- OpenAI API key
- ElevenLabs API key (for voice features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/aruniyer88/Undercurrent.git
cd Undercurrent
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Update `.env` with your credentials:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `OPENAI_API_KEY` - Your OpenAI API key
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key (optional, for voice features)

4. Set up the database:
```bash
# Run migrations in your Supabase project
# See supabase/migrations/001_initial_schema.sql
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/            # Authenticated routes
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   └── studies/       # Study management pages
│   │   ├── (public)/          # Public routes
│   │   │   └── login/         # Login page
│   │   ├── api/               # API routes
│   │   ├── interview/         # Participant interview flow
│   │   └── design-system/     # Design system showcase
│   ├── components/
│   │   ├── features/          # Feature-specific components
│   │   └── ui/                # Reusable UI components
│   ├── lib/
│   │   ├── supabase/          # Supabase client utilities
│   │   └── utils.ts           # Shared utilities
│   └── hooks/                 # React hooks
├── docs/                      # Documentation
│   ├── prd.md                # Product requirements document
│   └── design-system.md       # Design system documentation
├── supabase/
│   └── migrations/           # Database migrations
└── public/                   # Static assets
```

## Key User Flows

### 1. Study Creation
- User logs in and creates a new study via chat interface
- System converts brief into structured project setup
- User reviews and edits objectives, topics, and success criteria

### 2. Interview Guide & Voice Setup
- System generates interview guide with questions and probes
- User edits guide as needed
- User selects preset voice or creates voice clone
- User configures voice style (tone, pace, dialect)

### 3. Testing
- User runs test interview to preview experience
- User iterates on guide and voice until satisfied
- User approves and generates participant link

### 4. Participant Interview
- Participant receives link and starts interview
- AI interviewer (preset or cloned voice) conducts conversation
- Session is recorded and transcribed

### 5. Analysis & Reporting
- System generates project summary and key insights
- User accesses transcripts, recordings, and quotes
- User shares report or exports content

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Design System

The project uses a comprehensive design system built with Radix UI and Tailwind CSS. View the design system at `/design-system` when running the dev server.

## Current Status

This is a v1 MVP focused on:
- Allowlisted access only (no public signup)
- Core study creation and interview flows
- Voice cloning capabilities
- Basic reporting and analysis

## Documentation

- [Product Requirements Document](./docs/prd.md) - Complete product specifications
- [Design System](./docs/design-system.md) - Component library and design guidelines

## License

Private repository - All rights reserved

## Contact

For access or questions, please contact the repository owner.
