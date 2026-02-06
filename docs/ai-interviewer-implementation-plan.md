# AI Interviewer Implementation Plan
## Complete ElevenLabs Integration & Workflow

---

## Executive Summary

This document outlines the complete implementation plan for the AI-powered interviewer system in Undercurrent, including ElevenLabs voice integration, OpenAI conversation logic, and two distinct interview modes (structured and streaming).

**Timeline Estimate**: 6-8 weeks for full implementation
**Cost per interview**: $1.42 (structured) | $2.54 (streaming) for 20-minute interviews

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PLATFORM USER                           │
│                                                             │
│  Step 1: Project Basics → Interview Mode Selection         │
│  Step 2: Study Flow Builder (adapts to mode)               │
│  Step 3: Voice Setup (Preset or Clone)                     │
│  Step 4: Test Interview                                    │
│  Step 5: Publish Study                                     │
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
│  └─────────────────────┘       └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   AI PROCESSING ENGINE                       │
│                                                             │
│  Speech Input → GPT-4o (decision) → ElevenLabs (voice)     │
│  - Persona adoption                                         │
│  - Context awareness                                        │
│  - Flow adherence                                           │
│  - Time management                                          │
│  - Cost tracking                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATA STORAGE & ANALYSIS                    │
│                                                             │
│  • Full audio recordings                                    │
│  • Real-time transcripts                                    │
│  • Response segmentation by question                        │
│  • Cost tracking per interview                              │
│  • Unified analysis pipeline                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Schema Updates

### New/Modified Tables

#### 1. Update `studies` table
```sql
ALTER TABLE studies
ADD COLUMN interview_mode TEXT CHECK (interview_mode IN ('structured', 'streaming')) DEFAULT 'structured',
ADD COLUMN recording_type TEXT CHECK (recording_type IN ('voice', 'video')) DEFAULT 'voice',
ADD COLUMN ai_persona_behavior TEXT, -- "How should the AI behave?"
ADD COLUMN ai_persona_personality TEXT, -- "What personality should it have?"
ADD COLUMN ai_persona_role TEXT; -- "Who should it act as?"

-- Remove camera_required (replaced by recording_type)
-- Keep about_interviewer for backward compatibility
```

#### 2. Update `flow_sections` table
```sql
ALTER TABLE flow_sections
ADD COLUMN time_limit_seconds INTEGER, -- For streaming mode time-based progression
ADD COLUMN auto_calculated_time BOOLEAN DEFAULT true; -- Whether time is auto-calculated
```

#### 3. Update `flow_items` table
```sql
ALTER TABLE flow_items
ADD COLUMN probing_enabled BOOLEAN DEFAULT false, -- Enable/disable probing per question
ADD COLUMN estimated_duration_seconds INTEGER; -- For duration calculation
```

#### 4. Update `flow_responses` table
```sql
ALTER TABLE flow_responses
ADD COLUMN flow_item_id UUID, -- Which question this addresses (for streaming segmentation)
ADD COLUMN turn_number INTEGER, -- Conversation turn number
ADD COLUMN is_probe BOOLEAN DEFAULT false, -- Whether this is a follow-up probe
ADD COLUMN topic_tags TEXT[], -- AI-assigned topic tags for streaming analysis
ADD COLUMN response_start_time TIMESTAMP, -- When participant started responding
ADD COLUMN response_end_time TIMESTAMP; -- When participant finished responding
```

#### 5. New table: `interview_sessions`
```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID REFERENCES studies(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  interview_mode TEXT NOT NULL,
  recording_type TEXT NOT NULL,

  -- Session metadata
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  current_section_index INTEGER DEFAULT 0,
  current_item_index INTEGER DEFAULT 0,

  -- Audio/video recording
  recording_url TEXT, -- Full interview recording in Supabase storage
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

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interview_sessions_study ON interview_sessions(study_id);
CREATE INDEX idx_interview_sessions_participant ON interview_sessions(participant_id);
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
  audio_url TEXT, -- Individual turn audio if needed

  -- Timing
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_seconds DECIMAL,

  -- AI metadata (for AI turns)
  is_probe BOOLEAN DEFAULT false,
  ai_decision_reasoning TEXT, -- Why AI chose to probe/continue

  -- Cost tracking (for AI turns)
  elevenlabs_characters INTEGER,
  openai_input_tokens INTEGER,
  openai_output_tokens INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversation_turns_session ON conversation_turns(session_id);
CREATE INDEX idx_conversation_turns_flow_item ON conversation_turns(flow_item_id);
```

---

## Phase 2: Project Basics Updates (Step 1)

### UI Changes

**Location**: `src/components/features/project-basics-step.tsx`

Add three new sections:

#### 1. Interview Mode Selection
```typescript
<div className="space-y-4">
  <h3>Interview Format</h3>

  {/* Interview Mode */}
  <div>
    <label>How should the AI conduct this interview?</label>
    <RadioGroup value={interviewMode} onValueChange={setInterviewMode}>
      <RadioGroupItem value="structured">
        <div>
          <strong>Structured Interview</strong>
          <p>AI follows your study flow step-by-step, asks specific questions, shows stimulus, uses all question types.</p>
          <p className="text-muted">Best for: Specific insights, stimulus testing, quantitative elements</p>
        </div>
      </RadioGroupItem>

      <RadioGroupItem value="streaming">
        <div>
          <strong>Streaming Conversation</strong>
          <p>AI has natural conversation covering your topics within time limits. More exploratory and conversational.</p>
          <p className="text-muted">Best for: Exploratory research, building rapport, open-ended discovery</p>
        </div>
      </RadioGroupItem>
    </RadioGroup>
  </div>

  {/* Recording Type */}
  <div>
    <label>Recording Type</label>
    <RadioGroup value={recordingType} onValueChange={setRecordingType}>
      <RadioGroupItem value="voice">Voice Only</RadioGroupItem>
      <RadioGroupItem value="video">Video Recording</RadioGroupItem>
    </RadioGroup>
  </div>
</div>
```

#### 2. AI Persona Configuration
```typescript
<div className="space-y-4">
  <h3>AI Interviewer Persona</h3>
  <p className="text-sm text-muted">Define how the AI should behave during interviews.</p>

  {/* Behavior */}
  <div>
    <label>How should the AI behave?</label>
    <textarea
      placeholder="e.g., Professional and empathetic, asking thoughtful follow-up questions"
      value={aiPersonaBehavior}
      onChange={(e) => setAiPersonaBehavior(e.target.value)}
    />
  </div>

  {/* Personality */}
  <div>
    <label>What personality should it have?</label>
    <textarea
      placeholder="e.g., Warm and curious, with a touch of humor to put participants at ease"
      value={aiPersonaPersonality}
      onChange={(e) => setAiPersonaPersonality(e.target.value)}
    />
  </div>

  {/* Role */}
  <div>
    <label>Who should it act as?</label>
    <textarea
      placeholder="e.g., An experienced UX researcher with 10 years in consumer tech"
      value={aiPersonaRole}
      onChange={(e) => setAiPersonaRole(e.target.value)}
    />
  </div>
</div>
```

### Data Flow

When user completes Step 1:
1. Validate all fields including new persona fields
2. Save to `studies` table with `interview_mode` and `recording_type`
3. Pass mode to Step 2 (Study Flow Builder)

---

## Phase 3: Study Flow Builder Adaptations (Step 2)

### Conditional UI Based on Interview Mode

**Location**: `src/components/features/study-flow-builder/`

#### 1. Add Item Menu Filtering
```typescript
// add-item-menu.tsx
const getAvailableItemTypes = (interviewMode: 'structured' | 'streaming') => {
  if (interviewMode === 'streaming') {
    return [
      { type: 'open_ended', label: 'Open-Ended Question', icon: MessageSquare },
      { type: 'ai_conversation', label: 'AI Conversation', icon: MessageCircle },
      { type: 'instruction', label: 'Instruction', icon: FileText },
    ];
  }

  // Structured mode: all types available
  return [
    { type: 'open_ended', label: 'Open-Ended Question', icon: MessageSquare },
    { type: 'single_select', label: 'Single Select', icon: Circle },
    { type: 'multi_select', label: 'Multi Select', icon: CheckSquare },
    { type: 'rating_scale', label: 'Rating Scale', icon: Star },
    { type: 'ranking', label: 'Ranking', icon: ArrowUpDown },
    { type: 'ai_conversation', label: 'AI Conversation', icon: MessageCircle },
    { type: 'instruction', label: 'Instruction', icon: FileText },
  ];
};
```

#### 2. Section Time Configuration (Streaming Mode)
```typescript
// section-card.tsx
{interviewMode === 'streaming' && (
  <div className="mt-4 p-4 bg-muted rounded-md">
    <h4 className="text-sm font-medium mb-2">Section Time Limit</h4>

    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span className="text-sm">
          {section.auto_calculated_time
            ? `Auto: ${formatDuration(calculateSectionTime(section))}`
            : `${section.time_limit_seconds || 0}s`
          }
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleAutoCalculateTime(section.id)}
      >
        {section.auto_calculated_time ? 'Set Manual' : 'Auto-Calculate'}
      </Button>

      {!section.auto_calculated_time && (
        <Input
          type="number"
          value={section.time_limit_seconds || 0}
          onChange={(e) => updateSectionTime(section.id, parseInt(e.target.value))}
          className="w-24"
        />
      )}
    </div>

    <p className="text-xs text-muted mt-2">
      The AI will spend approximately this much time on this section's questions.
    </p>
  </div>
)}
```

#### 3. Probing Toggle (Open-Ended Questions)
```typescript
// question-editors/open-ended-editor.tsx
<div className="mt-4">
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium">Enable AI Probing</label>
    <Switch
      checked={item.probing_enabled}
      onCheckedChange={(checked) => updateItem(item.id, { probing_enabled: checked })}
    />
  </div>
  <p className="text-xs text-muted mt-1">
    When enabled, the AI will ask follow-up questions if the response lacks depth or clarity.
  </p>
</div>
```

#### 4. Duration Estimation Display
```typescript
// study-flow-builder/index.tsx
const calculateTotalDuration = () => {
  let total = 30; // Welcome screen overhead

  sections.forEach(section => {
    if (interviewMode === 'streaming') {
      total += section.time_limit_seconds || 0;
    } else {
      // Structured: sum individual items
      section.items.forEach(item => {
        if (item.type === 'open_ended') {
          total += 60; // Base 1min per open-ended
          if (item.probing_enabled) total += 45; // +45s for probing
        } else if (item.type === 'ai_conversation') {
          total += item.max_duration_seconds || 120;
        } else if (['single_select', 'multi_select'].includes(item.type)) {
          total += 15;
        } else if (['rating_scale', 'ranking'].includes(item.type)) {
          total += 20;
        }
      });

      // Add stimulus viewing time
      if (section.stimulus_type === 'image') total += 30;
      if (section.stimulus_type === 'website') total += 90;
      if (section.stimulus_type === 'youtube') {
        // Parse video duration from URL if possible, or default
        total += 120;
      }
    }

    total += 10; // Section transition
  });

  return total;
};

// Display in header
<div className="flex items-center gap-2 text-sm text-muted">
  <Clock className="h-4 w-4" />
  <span>Estimated duration: {formatDuration(calculateTotalDuration())}</span>
</div>
```

#### 5. Cost Estimation Display (Internal)
```typescript
const estimateInterviewCost = () => {
  const durationMinutes = calculateTotalDuration() / 60;
  const costPerMinute = interviewMode === 'structured' ? 0.071 : 0.127; // From cost analysis
  return (durationMinutes * costPerMinute).toFixed(2);
};

// Display for platform admins only
{user.role === 'admin' && (
  <div className="text-xs text-muted">
    Est. cost per interview: ${estimateInterviewCost()}
  </div>
)}
```

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

    // Poll for completion (ElevenLabs Instant Voice Cloning takes 1-3 minutes)
    const voiceId = await pollForCloneCompletion(response.data.cloneId);

    setCloneStatus('completed');
    setSelectedVoiceId(voiceId);

  } catch (error) {
    console.error('Voice cloning error:', error);

    // Fallback prompt
    setShowFallbackDialog(true);
  }
};

// Fallback dialog
{showFallbackDialog && (
  <AlertDialog open={showFallbackDialog} onOpenChange={setShowFallbackDialog}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Voice Cloning Failed</AlertDialogTitle>
        <AlertDialogDescription>
          We couldn't create a voice clone from your samples. This might be due to:
          • Audio quality issues (background noise, multiple speakers)
          • Samples too short (need at least 1 minute)
          • Technical error with the service

          Would you like to select a preset voice instead?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction onClick={() => {
          setVoiceMode('preset');
          setShowFallbackDialog(false);
        }}>
          Choose Preset Voice
        </AlertDialogAction>
        <AlertDialogCancel onClick={() => {
          setVoiceMode('clone');
          setShowFallbackDialog(false);
        }}>
          Try Again
        </AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
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

  // Play preview
  const audio = new Audio(audioUrl);
  audio.play();
};
```

---

## Phase 5: API Route Implementation

### 1. ElevenLabs Voice Cloning
**File**: `src/app/api/elevenlabs/clone/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const samples = formData.getAll('samples') as File[];
  const voiceName = formData.get('voice_name') as string;

  // Upload to ElevenLabs Instant Voice Cloning
  const cloneFormData = new FormData();
  cloneFormData.append('name', voiceName);
  samples.forEach(sample => cloneFormData.append('files', sample));

  const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
    body: cloneFormData,
  });

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error: error.detail }, { status: 400 });
  }

  const data = await response.json();

  return NextResponse.json({
    voice_id: data.voice_id,
    status: 'processing',
  });
}
```

### 2. ElevenLabs TTS (Structured Mode)
**File**: `src/app/api/elevenlabs/synthesize/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

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
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }

  const audioBuffer = await response.arrayBuffer();

  // Track cost
  const characterCount = text.length;
  await trackElevenLabsCost(session_id, characterCount);

  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
    },
  });
}

async function trackElevenLabsCost(sessionId: string, characters: number) {
  const cost = Math.ceil((characters / 1000) * 18); // $0.18 per 1K chars = 18 cents

  await supabase
    .from('interview_sessions')
    .update({
      elevenlabs_characters_used: sql`elevenlabs_characters_used + ${characters}`,
      elevenlabs_cost_cents: sql`elevenlabs_cost_cents + ${cost}`,
      total_cost_cents: sql`total_cost_cents + ${cost}`,
    })
    .eq('id', sessionId);
}
```

### 3. OpenAI Whisper STT
**File**: `src/app/api/openai/transcribe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audio = formData.get('audio') as File;
  const sessionId = formData.get('session_id') as string;

  const transcription = await openai.audio.transcriptions.create({
    file: audio,
    model: 'whisper-1',
  });

  return NextResponse.json({
    text: transcription.text,
  });
}
```

### 4. AI Response Generation (GPT-4o)
**File**: `src/app/api/ai/generate-interviewer-response/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  // Build system prompt
  const systemPrompt = buildInterviewerSystemPrompt(study, currentSection, timeRemaining);

  // Build conversation messages
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(turn => ({
      role: turn.speaker === 'ai' ? 'assistant' : 'user',
      content: turn.text_content,
    })),
    { role: 'user', content: participantResponse },
  ];

  // Generate response
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
    max_tokens: 200, // Keep responses concise
  });

  const aiResponse = completion.choices[0].message.content;
  const usage = completion.usage;

  // Decide: probe or continue?
  const decision = await analyzeResponse(
    participantResponse,
    currentItem,
    conversationHistory
  );

  // Track costs
  await trackOpenAICost(sessionId, usage.prompt_tokens, usage.completion_tokens);

  return NextResponse.json({
    response: aiResponse,
    decision: decision.action, // 'probe' | 'continue' | 'move_next'
    reasoning: decision.reasoning,
  });
}

function buildInterviewerSystemPrompt(study, section, timeRemaining) {
  return `You are an AI interviewer conducting a qualitative research study.

STUDY CONTEXT:
- Objective: ${study.objective}
- Target Audience: ${study.audience}
- Interview Mode: ${study.interview_mode}

AI PERSONA:
- Behavior: ${study.ai_persona_behavior}
- Personality: ${study.ai_persona_personality}
- Role: ${study.ai_persona_role}

CURRENT SECTION:
- Topic: ${section.title}
- Questions to cover: ${section.items.map(i => i.question_text).join(', ')}
- Time remaining: ${Math.floor(timeRemaining / 60)} minutes

INSTRUCTIONS:
1. Fully embody the persona described above. Speak, ask questions, and react as that character would.
2. Keep the study objective and target audience in mind with every question.
3. Ask follow-up questions if responses are vague, superficial, or off-topic.
4. Use gentle redirection if participant goes off-topic: acknowledge their response, then redirect.
5. Be concise but natural. Aim for 1-3 sentences per response.
6. ${study.interview_mode === 'structured'
     ? 'Follow the study flow strictly. Ask questions in order.'
     : 'Cover all topics within the time limit. Transition naturally between questions.'}
7. Manage time: with ${timeRemaining}s left, pace accordingly to cover remaining material.

Remember: You're here to understand the participant's perspective deeply while staying focused on the research goals.`;
}

async function analyzeResponse(participantResponse, currentItem, history) {
  // Simple heuristic for MVP
  const responseLength = participantResponse.split(' ').length;
  const isVague = responseLength < 10;
  const hasProbed = history.filter(t => t.is_probe && t.flow_item_id === currentItem.id).length;

  if (currentItem.probing_enabled && isVague && hasProbed < 2) {
    return {
      action: 'probe',
      reasoning: 'Response too brief, probing for more detail',
    };
  }

  return {
    action: 'continue',
    reasoning: 'Response sufficient',
  };
}

async function trackOpenAICost(sessionId, inputTokens, outputTokens) {
  // GPT-4o: $0.0025/1K input, $0.01/1K output
  const inputCost = Math.ceil((inputTokens / 1000) * 0.25); // 0.25 cents
  const outputCost = Math.ceil((outputTokens / 1000) * 1.0); // 1.0 cents
  const totalCost = inputCost + outputCost;

  await supabase
    .from('interview_sessions')
    .update({
      openai_input_tokens: sql`openai_input_tokens + ${inputTokens}`,
      openai_output_tokens: sql`openai_output_tokens + ${outputTokens}`,
      openai_cost_cents: sql`openai_cost_cents + ${totalCost}`,
      total_cost_cents: sql`total_cost_cents + ${totalCost}`,
    })
    .eq('id', sessionId);
}
```

---

## Phase 6: Participant Interview Flow

### Architecture: Two Separate Components

#### 1. Structured Interview Component
**File**: `src/components/features/structured-interview.tsx`

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useInterviewSession } from '@/hooks/use-interview-session';

export function StructuredInterview({ studyId, token }) {
  const {
    session,
    currentSection,
    currentItem,
    conversationHistory,
    nextItem,
    submitResponse,
  } = useInterviewSession(studyId, 'structured');

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiSpeaking, setAiSpeaking] = useState(false);

  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  // Main interview loop
  const handleItemResponse = async (response: string, isProbe: boolean = false) => {
    // 1. Save participant response
    await submitResponse({
      flow_item_id: currentItem.id,
      response_text: response,
      is_probe: isProbe,
    });

    // 2. Get AI decision
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

    // 3. Should we probe?
    if (aiDecision.decision === 'probe') {
      await speakAIResponse(aiDecision.response);
      // Wait for participant's probe response (loop back)
      return;
    }

    // 4. Move to next question
    await speakAIResponse(aiDecision.response);
    nextItem();
  };

  const speakAIResponse = async (text: string) => {
    setAiSpeaking(true);

    // Synthesize with ElevenLabs
    const audioResponse = await fetch('/api/elevenlabs/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voice_id: study.voice_profile.voice_id,
        text,
        session_id: session.id,
      }),
    });

    const audioBlob = await audioResponse.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Play audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = audioUrl;
      await audioPlayerRef.current.play();
    }

    setAiSpeaking(false);
  };

  const startRecording = async () => {
    // Use browser MediaRecorder API
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    // ... recording logic
    setIsRecording(true);
  };

  const stopRecording = async () => {
    setIsRecording(false);

    // Transcribe with Whisper
    const transcription = await fetch('/api/openai/transcribe', {
      method: 'POST',
      body: formData, // Audio blob
    }).then(r => r.json());

    setTranscript(transcription.text);
    await handleItemResponse(transcription.text);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress */}
      <div className="mb-8">
        <Progress value={(currentItemIndex / totalItems) * 100} />
        <p className="text-sm text-muted mt-2">
          Question {currentItemIndex + 1} of {totalItems}
        </p>
      </div>

      {/* Current Question */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          {currentItem.question_text}
        </h2>

        {/* Stimulus if present */}
        {currentSection.stimulus_type && (
          <StimulusDisplay stimulus={currentSection} />
        )}
      </div>

      {/* Response Input */}
      {currentItem.response_mode === 'voice' && (
        <div className="space-y-4">
          <Button
            size="lg"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={aiSpeaking}
          >
            {isRecording ? (
              <>
                <MicOff className="mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2" />
                Start Recording
              </>
            )}
          </Button>

          {transcript && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {currentItem.response_mode === 'screen' && (
        <div>
          {/* Render appropriate UI based on question type */}
          {currentItem.type === 'single_select' && (
            <RadioGroup onValueChange={(value) => handleItemResponse(value)}>
              {currentItem.options.map(opt => (
                <RadioGroupItem key={opt.id} value={opt.text}>
                  {opt.text}
                </RadioGroupItem>
              ))}
            </RadioGroup>
          )}

          {/* ... other question types */}
        </div>
      )}

      {/* AI Status */}
      {aiSpeaking && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>AI is speaking...</span>
        </div>
      )}

      {/* Duration Warning */}
      {session.duration_warning_shown && (
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            We're approaching the estimated interview time. The AI will wrap up soon.
          </AlertDescription>
        </Alert>
      )}

      <audio ref={audioPlayerRef} />
    </div>
  );
}
```

#### 2. Streaming Interview Component
**File**: `src/components/features/streaming-interview.tsx`

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useInterviewSession } from '@/hooks/use-interview-session';

export function StreamingInterview({ studyId, token }) {
  const {
    session,
    currentSection,
    conversationHistory,
    nextSection,
  } = useInterviewSession(studyId, 'streaming');

  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [conversationClient, setConversationClient] = useState(null);

  useEffect(() => {
    // Initialize ElevenLabs Conversational AI
    initializeConversationalAI();
  }, []);

  const initializeConversationalAI = async () => {
    // This is pseudocode - actual implementation depends on ElevenLabs SDK
    const client = await ElevenLabs.Conversation.create({
      apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
      agentId: study.voice_profile.conversational_agent_id,

      // System prompt
      systemMessage: buildStreamingSystemPrompt(study, currentSection),

      // Callbacks
      onMessage: (message) => {
        // Log conversation turn
        logConversationTurn({
          speaker: message.role === 'agent' ? 'ai' : 'participant',
          text: message.text,
          flow_section_id: currentSection.id,
        });
      },

      onTopicComplete: (topicId) => {
        // AI determined it's covered a topic/question
        markFlowItemCovered(topicId);
      },
    });

    setConversationClient(client);
  };

  const buildStreamingSystemPrompt = (study, section) => {
    return `${basePersonaPrompt(study)}

CURRENT SECTION: ${section.title}
TIME LIMIT: ${section.time_limit_seconds} seconds
TOPICS TO COVER:
${section.items.map((item, i) => `${i + 1}. ${item.question_text}`).join('\n')}

Your task: Have a natural conversation that covers all these topics within the time limit.
- Mark each topic as covered when you've gotten sufficient information.
- When time is running short, wrap up the current topic and transition to the next.
- After covering all topics, thank the participant and end the section.`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Section Progress */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold">{currentSection.title}</h2>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex-1">
            <Progress value={(elapsedTime / currentSection.time_limit_seconds) * 100} />
          </div>
          <span className="text-sm text-muted">
            {formatDuration(currentSection.time_limit_seconds - elapsedTime)} left
          </span>
        </div>
      </div>

      {/* Live Transcript */}
      <div className="mb-8 max-h-96 overflow-y-auto">
        <h3 className="text-sm font-medium mb-4">Conversation</h3>
        <div className="space-y-4">
          {conversationHistory.map((turn, i) => (
            <div
              key={i}
              className={cn(
                "p-3 rounded-md",
                turn.speaker === 'ai' ? 'bg-blue-50 mr-8' : 'bg-gray-50 ml-8'
              )}
            >
              <span className="text-xs font-medium">
                {turn.speaker === 'ai' ? 'AI Interviewer' : 'You'}
              </span>
              <p className="text-sm mt-1">{turn.text_content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Topics Covered Checklist */}
      <div className="mb-8">
        <h3 className="text-sm font-medium mb-2">Topics to Cover</h3>
        <div className="space-y-2">
          {currentSection.items.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <CheckCircle2
                className={cn(
                  "h-4 w-4",
                  item.covered ? "text-green-500" : "text-gray-300"
                )}
              />
              <span className={cn(
                "text-sm",
                item.covered && "line-through text-muted"
              )}>
                {item.question_text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Push-to-Talk Control */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <Button
          size="lg"
          onMouseDown={() => {
            setIsPushToTalkActive(true);
            conversationClient?.startListening();
          }}
          onMouseUp={() => {
            setIsPushToTalkActive(false);
            conversationClient?.stopListening();
          }}
          onTouchStart={() => {
            setIsPushToTalkActive(true);
            conversationClient?.startListening();
          }}
          onTouchEnd={() => {
            setIsPushToTalkActive(false);
            conversationClient?.stopListening();
          }}
          className={cn(
            "h-16 w-16 rounded-full",
            isPushToTalkActive && "bg-red-500 scale-110"
          )}
        >
          <Mic className="h-6 w-6" />
        </Button>
        <p className="text-xs text-center mt-2 text-muted">
          Hold to speak
        </p>
      </div>

      {/* End Early Option */}
      <div className="mt-8 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEndEarly}
        >
          End Interview Early
        </Button>
      </div>
    </div>
  );
}
```

### Main Interview Router
**File**: `src/app/interview/[token]/page.tsx`

```typescript
export default async function InterviewPage({ params }) {
  const { token } = params;

  // Validate token and get study
  const study = await getStudyByToken(token);

  if (!study) {
    return <div>Invalid interview link</div>;
  }

  // Route to appropriate interview component
  if (study.interview_mode === 'structured') {
    return <StructuredInterview studyId={study.id} token={token} />;
  } else {
    return <StreamingInterview studyId={study.id} token={token} />;
  }
}
```

---

## Phase 7: Post-Interview Analysis

### Transcript Segmentation for Streaming Mode

**File**: `src/lib/analysis/segment-streaming-transcript.ts`

```typescript
export async function segmentStreamingTranscript(sessionId: string) {
  const session = await getSession(sessionId);
  const study = await getStudy(session.study_id);
  const conversationTurns = await getConversationTurns(sessionId);

  // Build full transcript
  const fullTranscript = conversationTurns
    .map(turn => `${turn.speaker.toUpperCase()}: ${turn.text_content}`)
    .join('\n\n');

  // Use GPT-4o to segment by questions
  const segmentationPrompt = `You are analyzing a research interview transcript. The interviewer was supposed to cover these topics:

${study.flow.sections.flatMap(s => s.items).map((item, i) =>
  `${i + 1}. ${item.question_text} (ID: ${item.id})`
).join('\n')}

Here is the full transcript:

${fullTranscript}

Task: For each topic above, extract the relevant excerpts from the transcript where that topic was discussed. Include both the question and the participant's response(s).

Format your response as JSON:
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
      created_at: new Date(),
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

  const startTestInterview = async () => {
    // Create test session
    const session = await createTestSession(studyId);
    setTestSession(session);
    setTestMode('live');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Test Your Interview</h2>
        <p className="text-muted">
          Run through your interview to experience what participants will see and ensure everything works as expected.
        </p>
      </div>

      {testMode === 'preview' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interview Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Mode:</span>
                  <p className="text-sm text-muted">{study.interview_mode}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Duration:</span>
                  <p className="text-sm text-muted">{formatDuration(estimatedDuration)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Questions:</span>
                  <p className="text-sm text-muted">{totalQuestions}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Voice:</span>
                  <p className="text-sm text-muted">{voiceProfile.name}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Study Flow:</h4>
                <ol className="space-y-2">
                  {study.flow.sections.map((section, i) => (
                    <li key={section.id} className="text-sm">
                      <span className="font-medium">{i + 1}. {section.title}</span>
                      <span className="text-muted ml-2">
                        ({section.items.length} questions)
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>

          <Button onClick={startTestInterview} size="lg">
            Start Test Interview
          </Button>
        </div>
      ) : (
        <div>
          {study.interview_mode === 'structured' ? (
            <StructuredInterview studyId={studyId} token={testSession.token} />
          ) : (
            <StreamingInterview studyId={studyId} token={testSession.token} />
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Database schema updates (Phase 1)
- [ ] Update Project Basics UI (Phase 2)
- [ ] API routes for ElevenLabs (TTS, voice cloning)
- [ ] API routes for OpenAI (Whisper, GPT-4o)

### Week 3-4: Flow Builder & Voice
- [ ] Adapt Study Flow Builder for modes (Phase 3)
- [ ] Duration calculation logic
- [ ] Time limit configuration UI
- [ ] Voice setup enhancements (Phase 4)

### Week 5-6: Interview Flow
- [ ] Structured interview component (Phase 6)
- [ ] Streaming interview component (Phase 6)
- [ ] Interview session management
- [ ] Cost tracking implementation

### Week 7: Analysis & Testing
- [ ] Transcript segmentation (Phase 7)
- [ ] Test interview feature (Phase 8)
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
- Pause/resume capability (future enhancement)
- Keep initial studies short (15-20 min max)

---

## Future Enhancements

### Phase 9 (Post-MVP):
- [ ] Multi-language support
- [ ] Real-time sentiment analysis during interview
- [ ] Adaptive question skipping (if already answered)
- [ ] Participant pause/resume capability
- [ ] Live monitoring dashboard for platform users
- [ ] Advanced probing strategies (e.g., "5 Whys" methodology)
- [ ] Custom AI personas per participant (personalization)
- [ ] Integration with participant CRM for context

---

## Appendix: Key Files Reference

### Database Migrations
- `supabase/migrations/007_ai_interviewer_schema.sql`

### API Routes
- `/api/elevenlabs/synthesize` - TTS for structured mode
- `/api/elevenlabs/clone` - Voice cloning
- `/api/elevenlabs/conversational` - Streaming mode setup
- `/api/openai/transcribe` - Whisper STT
- `/api/ai/generate-interviewer-response` - GPT-4o response generation

### Components
- `src/components/features/project-basics-step.tsx`
- `src/components/features/study-flow-builder/`
- `src/components/features/voice-setup-step.tsx`
- `src/components/features/structured-interview.tsx`
- `src/components/features/streaming-interview.tsx`
- `src/components/features/test-interview-step.tsx`

### Hooks
- `src/hooks/use-interview-session.ts` - Session management
- `src/hooks/use-audio-recorder.ts` - Audio recording

### Utils
- `src/lib/analysis/segment-streaming-transcript.ts`
- `src/lib/cost-tracking.ts`
- `src/lib/duration-estimation.ts`

---

## Questions for User (Outstanding)

1. Should we support multiple languages in MVP or English-only to start?
2. Do you want platform users to see cost estimates in the UI, or keep internal only?
3. Should participants be able to pause/resume interviews, or must complete in one session?
4. For video recording mode: should AI responses be audio-only or do you want avatar/visual representation?
5. What's the maximum interview duration we should support? (Recommendation: 45 minutes hard cap)

---

**End of Implementation Plan**
