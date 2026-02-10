# AI Interviewer Implementation Plan
## Complete ElevenLabs Integration & Workflow

---

## Executive Summary

This document outlines the complete implementation plan for the AI-powered interviewer system in Undercurrent, including ElevenLabs voice integration, OpenAI conversation logic, and two distinct study types (structured and streaming).

**Timeline Estimate**: 6-8 weeks for full implementation
**Cost per interview**: $1.42 (structured) | $2.54 (streaming) for 20-minute interviews

---

## Key Design Decisions

### 1. Two Independent Axes: Interview Mode + Study Type
- **`interview_mode`** (existing): `'voice' | 'video'` — How participants record responses
- **`study_type`** (new): `'structured' | 'streaming'` — How the AI conducts the interview

These are orthogonal. A study can be voice+structured, voice+streaming, video+structured, or video+streaming.

### 2. AI Persona Is Generated Once and Stored
No new persona input fields for users. After the user completes Project Basics and the Study Flow, the system **generates an AI persona prompt via GPT-4o** and stores it in a dedicated column (`ai_persona_prompt` on `studies`).

**Generation inputs** (all existing fields):
- `about_interviewer` — Who the researcher is and the persona they want the AI to adopt
- `audience` — Who the participants are
- `objective` — What the research aims to discover (includes interviewer persona context)
- `language` — What language to use
- Study flow questions/sections — What topics will be covered

**Why store instead of derive at runtime?**
- The persona is a **fixed, explicit prompt** customized for that study
- No ambiguity — the AI doesn't have to synthesize context on-the-fly each interview
- Reviewable and debuggable — researchers (or admins) can inspect the generated persona
- Consistent across all participant interviews for the same study

**When is it generated?**
- Triggered after completing Step 2 (Study Flow), or when entering Step 4 (Test Interview)
- Can be regenerated if the user changes Project Basics or Study Flow
- Uses a dedicated API endpoint: `/api/ai/generate-persona`

### 3. Interview Mode (voice/video) Moves to Project Basics
The interview mode selector (voice/video radio + camera_required toggle) is being **moved from Step 2 (Study Flow Builder) to Step 1 (Project Basics)**. This is a study-level decision that should be made upfront, not buried in the flow builder. The existing `InterviewModeSelector` component is reused — just relocated.

### 4. Preserve All Existing Functionality
- **`camera_required`** toggle stays (shown when `interview_mode='video'`, now in Step 1)
- **Probing** uses existing `probingMode: 'auto' | 'disabled'` in `item_config` JSONB — no new columns
- **AI conversation** max duration stays at 5 minutes (300s)
- **`about_interviewer`** column stays as-is

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PLATFORM USER                           │
│                                                             │
│  Step 1: Project Basics (+ study_type, interview_mode)      │
│  Step 2: Study Flow Builder (adapts to study_type)          │
│          → AI persona generated after Step 2 completion     │
│  Step 3: Voice Setup (Preset or Clone)                      │
│  Step 4: Test Interview                                     │
│  Step 5: Publish Study                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PARTICIPANT INTERVIEW                     │
│                                                             │
│  ┌─────────────────────┐       ┌─────────────────────┐    │
│  │  STRUCTURED MODE    │       │  STREAMING MODE     │    │
│  │                     │       │                     │    │
│  │  • Step through     │       │  • Natural          │    │
│  │    questions        │       │    conversation     │    │
│  │  • Show stimulus    │       │  • Time-based       │    │
│  │  • Probe if enabled │       │    sections         │    │
│  │  • All question     │       │  • Open-ended only  │    │
│  │    types supported  │       │  • Real-time flow   │    │
│  │  • Voice or Video   │       │  • Voice or Video   │    │
│  └─────────────────────┘       └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   AI PROCESSING ENGINE                       │
│                                                             │
│  Speech Input → GPT-4o (decision) → ElevenLabs (voice)     │
│  - Pre-generated persona prompt (stored in studies table)    │
│  - Context awareness                                        │
│  - Flow adherence                                           │
│  - Time management                                          │
│  - Cost tracking                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATA STORAGE & ANALYSIS                    │
│                                                             │
│  • Full audio/video recordings                              │
│  • Real-time transcripts                                    │
│  • Response segmentation by question                        │
│  • Cost tracking per interview                              │
│  • Unified analysis pipeline                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Schema Updates

### Modified Tables

#### 1. Update `studies` table
```sql
ALTER TABLE studies
ADD COLUMN study_type TEXT CHECK (study_type IN ('structured', 'streaming')) DEFAULT 'structured',
ADD COLUMN ai_persona_prompt TEXT; -- AI-generated persona prompt, stored after study setup

-- KEEP EXISTING columns as-is:
--   interview_mode TEXT ('voice' | 'video') DEFAULT 'voice'
--   camera_required BOOLEAN DEFAULT false
--   about_interviewer TEXT
--   language TEXT DEFAULT 'English'
--
-- ai_persona_prompt is generated by GPT-4o from:
--   about_interviewer, audience, objective, language, study flow questions
-- It is NOT user-authored. Generated after completing Step 2 (Study Flow).
```

#### 2. Update `flow_sections` table (streaming mode only)
```sql
ALTER TABLE flow_sections
ADD COLUMN time_limit_seconds INTEGER; -- For streaming mode: auto-calculated time budget per section
```

> **Note**: This column is auto-calculated based on the number of questions in the section. It is NOT user-editable. It's stored so the streaming interview engine can reference it.

#### 3. `flow_items` table — NO CHANGES
Probing is already handled via `item_config.probing_mode` ('auto' | 'disabled' | 'custom') in the JSONB column. No new columns needed.

#### 4. Update `flow_responses` table
```sql
ALTER TABLE flow_responses
ADD COLUMN turn_number INTEGER,            -- Conversation turn number
ADD COLUMN is_probe BOOLEAN DEFAULT false,  -- Whether this is a follow-up probe response
ADD COLUMN topic_tags TEXT[],              -- AI-assigned topic tags (streaming mode)
ADD COLUMN response_start_time TIMESTAMPTZ, -- When participant started responding
ADD COLUMN response_end_time TIMESTAMPTZ;   -- When participant finished responding
```

#### 5. New table: `interview_sessions`
```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID REFERENCES studies(id) ON DELETE CASCADE,
  participant_id UUID,

  -- Mode info (denormalized from study for query convenience)
  study_type TEXT NOT NULL,      -- 'structured' | 'streaming'
  interview_mode TEXT NOT NULL,  -- 'voice' | 'video'

  -- Session metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  current_section_index INTEGER DEFAULT 0,
  current_item_index INTEGER DEFAULT 0,

  -- Recording
  recording_url TEXT,              -- Full interview recording in Supabase storage
  recording_duration_seconds INTEGER,

  -- Cost tracking
  elevenlabs_characters_used INTEGER DEFAULT 0,
  elevenlabs_cost_cents INTEGER DEFAULT 0,
  openai_input_tokens INTEGER DEFAULT 0,
  openai_output_tokens INTEGER DEFAULT 0,
  openai_cost_cents INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,

  -- Timing
  estimated_duration_seconds INTEGER,
  actual_duration_seconds INTEGER,
  duration_warning_shown BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interview_sessions_study ON interview_sessions(study_id);
```

#### 6. New table: `conversation_turns`
```sql
CREATE TABLE conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  flow_item_id UUID REFERENCES flow_items(id) ON DELETE SET NULL,
  flow_section_id UUID REFERENCES flow_sections(id) ON DELETE SET NULL,

  turn_number INTEGER NOT NULL,
  speaker TEXT CHECK (speaker IN ('ai', 'participant')),

  -- Content
  text_content TEXT NOT NULL,
  audio_url TEXT,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds DECIMAL,

  -- AI metadata (for AI turns)
  is_probe BOOLEAN DEFAULT false,
  ai_decision_reasoning TEXT,

  -- Cost tracking (for AI turns)
  elevenlabs_characters INTEGER,
  openai_input_tokens INTEGER,
  openai_output_tokens INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversation_turns_session ON conversation_turns(session_id);
CREATE INDEX idx_conversation_turns_flow_item ON conversation_turns(flow_item_id);
```

---

## Phase 2: Project Basics Updates (Step 1)

### What Changes

Two new sections are added to the Project Basics page:

#### 1. Study Type Selection (new)
```typescript
<div className="space-y-2">
  <Label>Study Type</Label>
  <RadioGroup value={studyType} onValueChange={setStudyType}>
    <RadioGroupItem value="structured">
      <strong>Structured Interview</strong>
      <p>AI follows your study flow step-by-step, asks specific questions,
         shows stimulus, uses all question types.</p>
      <p className="text-muted">Best for: Specific insights, stimulus testing,
         quantitative elements</p>
    </RadioGroupItem>

    <RadioGroupItem value="streaming">
      <strong>Streaming Conversation</strong>
      <p>AI has a natural conversation covering your topics within time limits.
         More exploratory and conversational.</p>
      <p className="text-muted">Best for: Exploratory research, building rapport,
         open-ended discovery</p>
    </RadioGroupItem>
  </RadioGroup>
</div>
```

#### 2. Interview Mode + Camera Toggle (moved from Step 2)
The existing `InterviewModeSelector` component is relocated from the Study Flow Builder to Project Basics. It renders the voice/video radio group and the conditional "Require camera always on" toggle.

```typescript
// Reuse existing component — just move where it's rendered
<InterviewModeSelector
  interviewMode={interviewMode}
  cameraRequired={cameraRequired}
  onInterviewModeChange={handleInterviewModeChange}
  onCameraRequiredChange={handleCameraRequiredChange}
/>
```

**Step 2 cleanup**: Remove the `InterviewModeSelector` rendering from `study-flow-builder/index.tsx`. The study flow builder will still read `study.interview_mode` and `study.camera_required` when needed (e.g., for response mode defaults), but the selector UI moves to Step 1.

### What Does NOT Change
- All 5 existing fields remain: Project Name, About You, About Your Audience, Objective & Context, Interview Language
- No AI persona fields added — persona is AI-generated after Step 2, not user-authored
- `InterviewModeSelector` component itself is unchanged — just relocated

### Updated Data Flow
When user completes Step 1:
1. Validate existing fields + study_type + interview_mode selections
2. Save `study_type`, `interview_mode`, `camera_required` to `studies` table alongside existing fields
3. Pass `study_type` and `interview_mode` to Step 2 so the flow builder can adapt

### Fields on Project Basics After Implementation

| # | Field | DB Column | Type | Status |
|---|-------|-----------|------|--------|
| 1 | Project Name | `title` | Input | Existing |
| 2 | About You | `about_interviewer` | Textarea | Existing |
| 3 | About Your Audience | `audience` | Textarea | Existing |
| 4 | Objective & Context | `objective` | Textarea + AI enhance | Existing |
| 5 | Interview Language | `language` | Select dropdown | Existing |
| 6 | Study Type | `study_type` | Radio: Structured / Streaming | **New** |
| 7 | Interview Mode | `interview_mode` | Radio: Voice / Video | **Moved from Step 2** |
| 8 | Camera Required | `camera_required` | Toggle (shown if video) | **Moved from Step 2** |

**Total: 8 fields** (5 existing + 1 new + 2 moved from Step 2)

---

## Phase 3: Study Flow Builder Adaptations (Step 2)

### What Already Exists (No Changes Needed)
- **Probing toggle** on open-ended questions (`probingMode: 'auto' | 'disabled'` in `item_config`) — stays as-is
- **AI conversation editor** with duration up to 5 minutes (300s) — stays as-is
- **All 7 question types** — stay as-is

### What Gets Removed from Step 2
- **Interview mode selector** (voice/video + camera_required toggle) — **moved to Step 1 (Project Basics)**. Remove the `<InterviewModeSelector>` rendering from `study-flow-builder/index.tsx` and the associated `handleInterviewModeChange` / `handleCameraRequiredChange` handlers (these move to the Project Basics step wrapper).

### New: Conditional UI Based on Study Type

#### 1. Add Item Menu Filtering (Streaming Mode)

**Location**: `src/components/features/study-flow-builder/add-item-menu.tsx`

```typescript
const getAvailableItemTypes = (studyType: 'structured' | 'streaming') => {
  if (studyType === 'streaming') {
    // Streaming: only open-ended conversation types
    return [
      { type: 'open_ended', label: 'Open-Ended Question', icon: MessageSquare },
      { type: 'ai_conversation', label: 'AI Conversation', icon: MessageCircle },
      { type: 'instruction', label: 'Instruction', icon: FileText },
    ];
  }

  // Structured: all types available (current behavior)
  return ALL_ITEM_TYPES;
};
```

#### 2. Duration Estimation Display (Both Modes)

Show users a read-only estimate of total interview duration based on questions added.

**Location**: `src/components/features/study-flow-builder/index.tsx`

```typescript
const calculateEstimatedDuration = () => {
  let total = 30; // Welcome screen overhead

  sections.forEach(section => {
    section.items.forEach(item => {
      switch (item.type) {
        case 'open_ended':
          total += 60; // 1 min base per open-ended
          if (item.probingMode === 'auto') total += 45; // +45s for probing
          break;
        case 'ai_conversation':
          total += item.durationSeconds || 120;
          break;
        case 'single_select':
        case 'multi_select':
          total += 15;
          break;
        case 'rating_scale':
        case 'ranking':
          total += 20;
          break;
        case 'instruction':
          total += 10;
          break;
      }
    });

    // Stimulus viewing time
    if (section.stimulus_type === 'image') total += 30;
    if (section.stimulus_type === 'website') total += 90;
    if (section.stimulus_type === 'youtube') total += 120;

    total += 10; // Section transition
  });

  return total;
};

// Display in builder header
<div className="flex items-center gap-2 text-sm text-muted">
  <Clock className="h-4 w-4" />
  <span>Estimated duration: {formatDuration(calculateEstimatedDuration())}</span>
</div>
```

> **Note**: For streaming mode, the auto-calculated `time_limit_seconds` per section is derived from this same logic (sum of item estimates within each section) and written to the DB on save, so the streaming interview engine knows the time budget per section.

#### 3. Cost Estimation Display (Internal/Admin Only)
```typescript
const estimateInterviewCost = () => {
  const durationMinutes = calculateEstimatedDuration() / 60;
  const costPerMinute = studyType === 'structured' ? 0.071 : 0.127;
  return (durationMinutes * costPerMinute).toFixed(2);
};

// Display for platform admins only
{user.role === 'admin' && (
  <div className="text-xs text-muted">
    Est. cost per interview: ${estimateInterviewCost()}
  </div>
)}
```

### AI Persona Generation (After Step 2 Completion)

When the user completes Step 2 and moves forward, the system generates the AI persona prompt and stores it in `studies.ai_persona_prompt`. This also triggers on entering Step 4 (Test Interview) if the persona hasn't been generated yet, or if basics/flow have changed.

#### API Endpoint
**File**: `src/app/api/ai/generate-persona/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { study_id } = await request.json();

  // Fetch study + flow data
  const study = await getStudy(study_id);
  const flow = await getStudyFlow(study_id);

  const prompt = `You are designing an AI interviewer persona for a qualitative research study.

RESEARCHER CONTEXT:
${study.about_interviewer}

STUDY OBJECTIVE:
${study.objective}

TARGET AUDIENCE:
${study.audience}

INTERVIEW LANGUAGE: ${study.language || 'English'}
STUDY TYPE: ${study.study_type} (${study.study_type === 'structured' ? 'step-by-step questions' : 'natural conversation'})

QUESTIONS THE INTERVIEWER WILL ASK:
${flow.sections.flatMap(s => s.items)
  .filter(i => i.question_text)
  .map((item, i) => `${i + 1}. ${item.question_text}`)
  .join('\n')}

Based on all of the above, write a concise AI interviewer persona prompt (2-4 paragraphs) that describes:
1. Who the AI should act as (role, expertise, background)
2. How it should behave (communication style, tone, pacing)
3. What personality traits to adopt (warmth, curiosity, formality level)

The persona should feel natural for the research context and put the target audience at ease.
Write in second person ("You are..."). Be specific and actionable.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
  });

  const personaPrompt = completion.choices[0].message.content;

  // Store in studies table
  await supabase
    .from('studies')
    .update({ ai_persona_prompt: personaPrompt })
    .eq('id', study_id);

  return NextResponse.json({ persona_prompt: personaPrompt });
}
```

#### When It Runs
- **Auto-triggered**: When navigating from Step 2 → Step 3 (if persona is null or stale)
- **Re-triggered**: If user goes back and edits Project Basics or Study Flow, the persona is regenerated
- **Viewable**: The generated persona can be shown in a read-only preview in Step 4 (Test Interview) so the researcher knows how the AI will behave

---

## Phase 4: Voice Setup (Step 3)

### Current Implementation Status
✅ **Already built**: Preset voice selection and voice cloning UI

### Enhancements Needed

**Location**: `src/components/features/voice-setup-step.tsx`

#### 1. Voice Cloning with Fallback Handling
```typescript
const handleVoiceCloning = async (audioSamples: File[]) => {
  setCloneStatus('uploading');

  try {
    const formData = new FormData();
    audioSamples.forEach(file => formData.append('samples', file));
    formData.append('voice_name', voiceName);

    const response = await fetch('/api/elevenlabs/clone', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Voice cloning failed');

    setCloneStatus('processing');
    const voiceId = await pollForCloneCompletion(response.data.cloneId);
    setCloneStatus('completed');
    setSelectedVoiceId(voiceId);

  } catch (error) {
    console.error('Voice cloning error:', error);
    setShowFallbackDialog(true);
  }
};

// Fallback dialog offers: "Choose Preset Voice" or "Try Again"
```

#### 2. Voice Preview with Study Context
```typescript
const generateContextualPreview = async () => {
  // Generate preview using actual first question from study
  const firstQuestion = studyFlow.sections[0]?.items[0]?.question_text ||
                        "Welcome to this interview. Let's begin.";

  const response = await fetch('/api/elevenlabs/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voice_id: selectedVoiceId,
      text: firstQuestion,
    }),
  });

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
};
```

---

## Phase 5: API Route Implementation

### 1. ElevenLabs Voice Cloning
**File**: `src/app/api/elevenlabs/clone/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const samples = formData.getAll('samples') as File[];
  const voiceName = formData.get('voice_name') as string;

  const cloneFormData = new FormData();
  cloneFormData.append('name', voiceName);
  samples.forEach(sample => cloneFormData.append('files', sample));

  const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
    body: cloneFormData,
  });

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error: error.detail }, { status: 400 });
  }

  const data = await response.json();
  return NextResponse.json({ voice_id: data.voice_id, status: 'processing' });
}
```

### 2. ElevenLabs TTS (Structured Mode)
**File**: `src/app/api/elevenlabs/synthesize/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { voice_id, text, session_id } = await request.json();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!response.ok) {
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }

  const audioBuffer = await response.arrayBuffer();

  // Track cost: $0.18 per 1K chars = 18 cents
  const characterCount = text.length;
  await trackElevenLabsCost(session_id, characterCount);

  return new NextResponse(audioBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}
```

### 3. OpenAI Whisper STT
**File**: `src/app/api/openai/transcribe/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audio = formData.get('audio') as File;

  const transcription = await openai.audio.transcriptions.create({
    file: audio,
    model: 'whisper-1',
  });

  return NextResponse.json({ text: transcription.text });
}
```

### 4. AI Response Generation (GPT-4o)
**File**: `src/app/api/ai/generate-interviewer-response/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const {
    study,
    currentSection,
    currentItem,
    conversationHistory,
    participantResponse,
    timeRemaining,
    sessionId,
  } = await request.json();

  // Build system prompt — uses pre-generated persona from studies.ai_persona_prompt
  const systemPrompt = buildInterviewerSystemPrompt(study, currentSection, timeRemaining);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(turn => ({
      role: turn.speaker === 'ai' ? 'assistant' : 'user',
      content: turn.text_content,
    })),
    { role: 'user', content: participantResponse },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
    max_tokens: 200,
  });

  const aiResponse = completion.choices[0].message.content;
  const usage = completion.usage;

  // Use existing probing_mode from flow item config
  const decision = analyzeResponse(participantResponse, currentItem, conversationHistory);

  await trackOpenAICost(sessionId, usage.prompt_tokens, usage.completion_tokens);

  return NextResponse.json({
    response: aiResponse,
    decision: decision.action, // 'probe' | 'continue' | 'move_next'
    reasoning: decision.reasoning,
  });
}

/**
 * Build the interviewer system prompt.
 * Uses the pre-generated ai_persona_prompt stored on the study.
 * The persona was generated by GPT-4o after the user completed Project Basics + Study Flow.
 */
function buildInterviewerSystemPrompt(study, section, timeRemaining) {
  return `You are an AI interviewer conducting a qualitative research study.

YOUR PERSONA:
${study.ai_persona_prompt}

STUDY CONTEXT:
- Objective: ${study.objective}
- Target Audience: ${study.audience}
- Study Type: ${study.study_type}
- Language: ${study.language || 'English'}

CURRENT SECTION:
- Topic: ${section.title}
- Questions to cover: ${section.items.map(i => i.question_text).join(', ')}
- Time remaining: ${Math.floor(timeRemaining / 60)} minutes

INSTRUCTIONS:
1. Fully embody the persona described above.
2. Keep the study objective and target audience in mind with every question.
3. Ask follow-up questions if responses are vague, superficial, or off-topic (when probing is enabled for that question).
4. Use gentle redirection if participant goes off-topic: acknowledge, then redirect.
5. Be concise but natural. Aim for 1-3 sentences per response.
6. ${study.study_type === 'structured'
     ? 'Follow the study flow strictly. Ask questions in order.'
     : 'Cover all topics within the time limit. Transition naturally between questions.'}
7. Manage time: with ${timeRemaining}s left, pace accordingly.
8. Conduct the interview in ${study.language || 'English'}.`;
}

/**
 * Decide whether to probe based on EXISTING probing_mode in item_config.
 * No new probing columns — uses the item's probing_mode from the flow builder.
 */
function analyzeResponse(participantResponse, currentItem, history) {
  const probingMode = currentItem.item_config?.probing_mode || 'disabled';

  if (probingMode === 'disabled') {
    return { action: 'continue', reasoning: 'Probing disabled for this question' };
  }

  // Auto probing: check response depth
  const responseLength = participantResponse.split(' ').length;
  const isVague = responseLength < 10;
  const probeCount = history.filter(t => t.is_probe && t.flow_item_id === currentItem.id).length;

  if (isVague && probeCount < 2) {
    return { action: 'probe', reasoning: 'Response too brief, probing for more detail' };
  }

  return { action: 'continue', reasoning: 'Response sufficient' };
}
```

---

## Phase 6: Participant Interview Flow

### Architecture: Two Separate Components

The interview router selects the component based on `study_type`, while both components support voice AND video via `interview_mode` + `camera_required`.

#### Main Interview Router
**File**: `src/app/interview/[token]/page.tsx`

```typescript
export default async function InterviewPage({ params }) {
  const { token } = params;
  const study = await getStudyByToken(token);

  if (!study) return <div>Invalid interview link</div>;

  // Route based on study_type (structured vs streaming)
  // Both components handle voice/video via study.interview_mode + study.camera_required
  if (study.study_type === 'structured') {
    return <StructuredInterview studyId={study.id} token={token} />;
  } else {
    return <StreamingInterview studyId={study.id} token={token} />;
  }
}
```

#### 1. Structured Interview Component
**File**: `src/components/features/structured-interview.tsx`

Key behaviors:
- Steps through questions in order per study flow
- Shows stimulus per section
- Uses existing `probingMode` from each item's config to decide follow-ups
- Records via voice or video based on `study.interview_mode`
- If `study.camera_required`, enforces camera-on (pauses if camera turned off)
- AI speaks via ElevenLabs TTS, listens via Whisper STT
- Progress bar shows question X of Y

```typescript
export function StructuredInterview({ studyId, token }) {
  const { session, currentSection, currentItem, conversationHistory, nextItem, submitResponse }
    = useInterviewSession(studyId, 'structured');

  const handleItemResponse = async (response: string, isProbe = false) => {
    await submitResponse({
      flow_item_id: currentItem.id,
      response_text: response,
      is_probe: isProbe,
    });

    const aiDecision = await fetch('/api/ai/generate-interviewer-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        study,
        currentSection,
        currentItem,
        conversationHistory,
        participantResponse: response,
        timeRemaining: getRemainingTime(),
        sessionId: session.id,
      }),
    }).then(r => r.json());

    if (aiDecision.decision === 'probe') {
      await speakAIResponse(aiDecision.response);
      return; // Wait for participant's probe response
    }

    await speakAIResponse(aiDecision.response);
    nextItem();
  };

  // ... recording UI (voice mic or video recorder based on study.interview_mode)
  // ... stimulus display, progress bar, etc.
}
```

#### 2. Streaming Interview Component
**File**: `src/components/features/streaming-interview.tsx`

Key behaviors:
- Natural conversation, not step-by-step
- Time-budgeted per section (auto-calculated `time_limit_seconds`)
- Only open-ended, ai_conversation, and instruction item types
- Uses ElevenLabs Conversational AI SDK for real-time voice
- Records via voice or video based on `study.interview_mode`
- Shows live transcript and topic-coverage checklist
- Push-to-talk or auto-detect based on configuration

```typescript
export function StreamingInterview({ studyId, token }) {
  const { session, currentSection, conversationHistory, nextSection }
    = useInterviewSession(studyId, 'streaming');

  // System prompt uses pre-generated persona from studies.ai_persona_prompt
  const buildStreamingSystemPrompt = (study, section) => {
    return `You are an AI interviewer conducting a qualitative research study.

YOUR PERSONA:
${study.ai_persona_prompt}

STUDY OBJECTIVE: ${study.objective}
TARGET AUDIENCE: ${study.audience}
LANGUAGE: ${study.language || 'English'}

CURRENT SECTION: ${section.title}
TIME LIMIT: ${section.time_limit_seconds} seconds
TOPICS TO COVER:
${section.items.map((item, i) => `${i + 1}. ${item.question_text}`).join('\n')}

Have a natural conversation covering all topics within the time limit.
Fully embody the persona described above.`;
  };

  // ... ElevenLabs Conversational AI setup
  // ... live transcript, topic checklist, timer UI
}
```

---

## Phase 7: Post-Interview Analysis

### Transcript Segmentation for Streaming Mode

**File**: `src/lib/analysis/segment-streaming-transcript.ts`

Since streaming conversations don't follow a strict question order, we use GPT-4o to segment the transcript by topic after the interview completes:

```typescript
export async function segmentStreamingTranscript(sessionId: string) {
  const session = await getSession(sessionId);
  const study = await getStudy(session.study_id);
  const conversationTurns = await getConversationTurns(sessionId);

  const fullTranscript = conversationTurns
    .map(turn => `${turn.speaker.toUpperCase()}: ${turn.text_content}`)
    .join('\n\n');

  const segmentationPrompt = `Analyze this interview transcript. The interviewer was covering these topics:

${study.flow.sections.flatMap(s => s.items).map((item, i) =>
  `${i + 1}. ${item.question_text} (ID: ${item.id})`
).join('\n')}

Transcript:
${fullTranscript}

For each topic, extract the relevant conversation excerpts. Return as JSON:
{
  "segments": [
    {
      "flow_item_id": "uuid",
      "excerpt": "relevant conversation excerpt",
      "participant_response_summary": "key points from participant"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: segmentationPrompt }],
    response_format: { type: 'json_object' },
  });

  const segments = JSON.parse(completion.choices[0].message.content).segments;

  // Store segmented responses in flow_responses table
  for (const segment of segments) {
    await supabase.from('flow_responses').insert({
      session_id: sessionId,
      flow_item_id: segment.flow_item_id,
      response_text: segment.participant_response_summary,
      response_excerpt: segment.excerpt,
    });
  }

  return segments;
}
```

---

## Phase 8: Testing & Quality Assurance

### Test Interview (Step 4)

**File**: `src/components/features/test-interview-step.tsx`

```typescript
export function TestInterviewStep({ studyId }) {
  const [testMode, setTestMode] = useState<'preview' | 'live'>('preview');
  const [testSession, setTestSession] = useState(null);

  return (
    <div className="space-y-8">
      <h2>Test Your Interview</h2>

      {testMode === 'preview' ? (
        <Card>
          {/* Show: study_type, interview_mode, estimated duration, question count, voice */}
          <Button onClick={startTestInterview}>Start Test Interview</Button>
        </Card>
      ) : (
        // Route to appropriate component based on study_type
        study.study_type === 'structured'
          ? <StructuredInterview studyId={studyId} token={testSession.token} />
          : <StreamingInterview studyId={studyId} token={testSession.token} />
      )}
    </div>
  );
}
```

---

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Database migration: add `study_type` + `ai_persona_prompt` to studies, `time_limit_seconds` to flow_sections, new columns on flow_responses
- [ ] Create `interview_sessions` and `conversation_turns` tables
- [ ] Update `database.ts` types
- [ ] Update Project Basics UI: add study_type radio, move InterviewModeSelector from Step 2
- [ ] Remove InterviewModeSelector from study-flow-builder, update save handlers
- [ ] API routes for ElevenLabs (TTS, voice cloning)
- [ ] API routes for OpenAI (Whisper, GPT-4o)
- [ ] API route for persona generation (`/api/ai/generate-persona`)

### Week 3-4: Flow Builder & Voice
- [ ] Adapt add-item-menu for streaming mode (filter question types)
- [ ] Add duration estimation display in flow builder header
- [ ] Auto-calculate `time_limit_seconds` per section on save
- [ ] Trigger AI persona generation on Step 2 completion
- [ ] Voice setup enhancements (fallback handling, contextual preview)

### Week 5-6: Interview Flow
- [ ] Structured interview component
- [ ] Streaming interview component
- [ ] Interview session management hook (`useInterviewSession`)
- [ ] Cost tracking implementation
- [ ] Voice/video support in both components (using existing `interview_mode` + `camera_required`)

### Week 7: Analysis & Testing
- [ ] Transcript segmentation for streaming mode
- [ ] Test interview feature (Step 4)
- [ ] End-to-end testing
- [ ] Performance optimization

### Week 8: Polish & Launch
- [ ] Bug fixes
- [ ] Duration guardrails
- [ ] Error handling
- [ ] Documentation
- [ ] Soft launch with test users

---

## Success Metrics

### Technical Metrics
- [ ] Interview completion rate > 85%
- [ ] Average latency < 3s for AI responses
- [ ] Cost per interview within budget ($1.50 structured, $2.75 streaming)
- [ ] Voice cloning success rate > 90%

### User Experience Metrics
- [ ] Participant satisfaction score > 4/5
- [ ] Platform user setup time < 20 minutes
- [ ] Test interview usage rate > 80%
- [ ] Interview abandonment rate < 15%

### Quality Metrics
- [ ] Transcript accuracy > 95%
- [ ] AI stays on topic > 90% of time
- [ ] Probing triggers appropriately > 80% of time
- [ ] Duration estimates within ±20% of actual

---

## Risk Mitigation

### Risk 1: ElevenLabs API Costs Exceed Budget
**Mitigation**:
- Implement hard cutoffs at 120% of estimated cost
- Cache common phrases ("Thank you", "I see", transitions)
- Monitor per-study costs daily, alert if anomalies

### Risk 2: Voice Cloning Quality Issues
**Mitigation**:
- Always offer preset fallback
- Provide sample requirements upfront (1-3 min, clear audio)
- Manual review option for important studies

### Risk 3: AI Goes Off-Script in Streaming Mode
**Mitigation**:
- Strong system prompts with guardrails
- Real-time topic tracking
- Platform user can review/flag problematic interviews

### Risk 4: Participant Audio Quality Issues
**Mitigation**:
- Pre-interview device check
- Encourage quiet environment (instructions)
- Graceful degradation (offer text input backup)

### Risk 5: Long Interviews Exhaust Participants
**Mitigation**:
- Soft warnings at 90% duration
- Keep initial studies short (15-20 min max)
- Pause/resume capability (future enhancement)

---

## Future Enhancements

### Phase 9 (Post-MVP):
- [ ] Multi-language support
- [ ] Real-time sentiment analysis during interview
- [ ] Adaptive question skipping (if already answered)
- [ ] Participant pause/resume capability
- [ ] Live monitoring dashboard for platform users
- [ ] Advanced probing strategies (e.g., "5 Whys" methodology)
- [ ] Integration with participant CRM for context

---

## Appendix: Key Files Reference

### Database Migrations
- `supabase/migrations/009_ai_interviewer_schema.sql` (next migration number after 008)

### API Routes
- `/api/elevenlabs/synthesize` — TTS for structured mode
- `/api/elevenlabs/clone` — Voice cloning
- `/api/elevenlabs/conversational` — Streaming mode setup
- `/api/openai/transcribe` — Whisper STT
- `/api/ai/generate-interviewer-response` — GPT-4o response generation
- `/api/ai/generate-persona` — Generate AI persona prompt from study context

### Components
- `src/components/features/project-basics-step.tsx` — Updated with study_type + interview_mode (moved from Step 2)
- `src/components/features/study-flow-builder/` — Duration estimate, item filtering, InterviewModeSelector removed
- `src/components/features/study-flow-builder/interview-mode-selector.tsx` — Reused in Project Basics (no changes to component itself)
- `src/components/features/voice-setup-step.tsx` — Fallback handling, contextual preview
- `src/components/features/structured-interview.tsx` — New
- `src/components/features/streaming-interview.tsx` — New
- `src/components/features/test-interview-step.tsx` — Updated

### Hooks
- `src/hooks/use-interview-session.ts` — Session management (new)
- `src/hooks/use-audio-recorder.ts` — Audio recording (new)
- `src/hooks/use-video-recorder.ts` — Video recording (existing)

### Utils
- `src/lib/analysis/segment-streaming-transcript.ts` — New
- `src/lib/cost-tracking.ts` — New
- `src/lib/duration-estimation.ts` — New

---

## Questions for User (Outstanding)

1. Should we support multiple languages in MVP or English-only to start?
2. Do you want platform users to see cost estimates in the UI, or keep internal only?
3. Should participants be able to pause/resume interviews, or must complete in one session?
4. For video recording mode: should AI responses be audio-only or do you want avatar/visual representation?
5. What's the maximum interview duration we should support? (Recommendation: 45 minutes hard cap)

---

**End of Implementation Plan**
