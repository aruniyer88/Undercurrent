# ElevenLabs Agents Architecture Analysis
## Exploring Agents-Based Approach for AI Interviewer

---

## Executive Summary

ElevenLabs Agents (formerly Conversational AI) offers a potentially simpler architecture for the AI interviewer system. This document compares three approaches:

1. **Original**: ElevenLabs TTS + OpenAI Whisper + GPT-4o
2. **Agents-Only**: ElevenLabs Agents handle everything
3. **Agents-Hybrid**: ElevenLabs Agents + GPT-4o orchestration

**Key Finding**: ElevenLabs Agents could significantly simplify the streaming mode implementation, but the original approach may be better for structured mode due to more precise control.

---

## What Are ElevenLabs Agents?

ElevenLabs Agents (launched 2025) are voice-enabled AI assistants that handle:

- **Bidirectional voice conversation** (both listening and speaking)
- **Built-in STT** (speech-to-text from participant)
- **Built-in TTS** (text-to-speech for AI responses)
- **Conversation management** (turn-taking, interruptions, natural flow)
- **Context awareness** (maintains conversation state)
- **Ultra-low latency** (75ms with Flash v2.5 model)

### Key Capabilities for Our Use Case

1. **Custom System Prompts** (up to ~2000 tokens)
   - Define AI persona, behavior, personality, role
   - Set goals and conversation guardrails
   - Provide step-by-step instructions

2. **Knowledge Base** (up to 20MB / 300k chars for non-enterprise)
   - Upload study context: objective, audience, questions
   - Agent retrieves relevant info during conversation
   - RAG support for larger knowledge bases (+500ms latency)

3. **Dynamic Variables & Overrides**
   - Inject runtime values (participant name, current section, time remaining)
   - Personalize each conversation without creating multiple agents

4. **Workflows**
   - Structure multi-step conversations
   - Define state transitions
   - Handle complex interview flows

5. **31 Languages Supported** (future-proofing)

---

## Pricing Comparison (Updated January 2026)

### ElevenLabs Agents Pricing

**Per-Minute Billing**: $0.10/minute (50% price cut as of Jan 2026)

**Important Notes**:
- Testing/setup calls billed at **half cost** ($0.05/min)
- **LLM costs currently absorbed** by ElevenLabs (will be passed through eventually)
- No cost to create agents
- Billed by minute, not character count

**For a 20-minute interview**:
- Base cost: 20 min × $0.10 = **$2.00**
- When LLM costs added (estimate): **+$0.30-0.50**
- **Projected total: $2.30-2.50 per interview**

---

## Architecture Comparison

### Approach 1: Original (TTS + Whisper + GPT-4o)

```
Participant speaks → OpenAI Whisper → GPT-4o (decision logic) → ElevenLabs TTS → Play audio
```

**Components**:
- ElevenLabs TTS (turbo-v2): $0.18/1K chars
- OpenAI Whisper: $0.006/min
- GPT-4o: $0.0025/1K input + $0.01/1K output

**Cost per 20-min interview**:
- **Structured Mode**: $1.42
  - TTS: $1.08
  - Whisper: $0.07
  - GPT-4o: $0.27
- **Streaming Mode**: $2.54
  - Conversational AI: $2.16
  - GPT-4o: $0.38

**Pros**:
✅ Maximum control over conversation logic
✅ Lowest cost for structured mode
✅ Easy to implement complex decision trees
✅ Can optimize each component independently

**Cons**:
❌ Complex architecture (3 separate APIs)
❌ Higher latency (sequential API calls)
❌ More code to maintain
❌ Manual turn-taking management

---

### Approach 2: ElevenLabs Agents Only

```
Participant speaks ←→ ElevenLabs Agent (handles everything) ←→ Participant hears response
```

**Architecture**:
- Single ElevenLabs Agent per study
- Agent configured with:
  - System prompt (persona + study context)
  - Knowledge base (questions, objectives, audience)
  - Workflows (section transitions)
  - Dynamic variables (time remaining, current section)

**Cost per 20-min interview**:
- **Both modes**: $2.00-2.50
  - Voice conversation: $2.00 (20 min × $0.10)
  - LLM costs (when added): ~$0.30-0.50 estimated

**Pros**:
✅ **Simplest architecture** (single API)
✅ **Ultra-low latency** (75ms)
✅ **Natural conversation flow** (built-in turn-taking, interruptions)
✅ **Less code to maintain**
✅ **Perfect for streaming mode**
✅ Testing at half cost

**Cons**:
❌ Less control over decision logic
❌ Harder to implement strict structured flow
❌ LLM costs will be added later (unknown timing)
❌ 2000-token system prompt limit
❌ May be overkill for simple structured questions

---

### Approach 3: Hybrid (Agents + GPT-4o Orchestration)

```
GPT-4o orchestrator decides → ElevenLabs Agent executes conversation → Reports back to GPT-4o
```

**Architecture**:
- GPT-4o: High-level orchestration (which question next, analyze responses, decide probing)
- ElevenLabs Agent: Handle the actual voice conversation for each question
- Our backend: Coordinate between the two

**Cost per 20-min interview**:
- **Both modes**: $2.30-2.80
  - Agent calls: $2.00
  - GPT-4o orchestration: $0.30-0.50
  - LLM costs in agent (when added): included above

**Pros**:
✅ Best of both worlds (natural voice + precise control)
✅ Complex decision-making in GPT-4o
✅ Natural conversation in Agent
✅ Good for both structured and streaming modes

**Cons**:
❌ Most complex architecture
❌ Highest cost
❌ Coordination overhead
❌ May be over-engineered

---

## Recommended Approach by Interview Mode

### For Streaming Mode: **ElevenLabs Agents Only** ✅

**Why**:
- Streaming mode is inherently conversational → perfect fit for Agents
- Agent handles natural flow, interruptions, transitions automatically
- Simpler than managing turn-taking manually
- Can use workflows to structure sections with time limits

**Implementation**:
```javascript
// Create agent per study at publish time
const agent = await ElevenLabs.Agents.create({
  name: `${study.title} - Interviewer`,

  // System prompt with persona
  prompt: `You are ${study.ai_persona_role}.

  Behavior: ${study.ai_persona_behavior}
  Personality: ${study.ai_persona_personality}

  STUDY OBJECTIVE: ${study.objective}
  TARGET AUDIENCE: ${study.audience}

  INTERVIEW STRUCTURE:
  ${study.flow.sections.map((section, i) => `
  Section ${i+1}: ${section.title} (${section.time_limit_seconds}s)
  Topics to cover:
  ${section.items.map(item => `- ${item.question_text}`).join('\n')}
  `).join('\n')}

  INSTRUCTIONS:
  - Have a natural conversation covering all topics
  - Transition between sections when time limit reached
  - Mark topics as covered internally
  - Stay focused on research objective
  - Use gentle redirection if participant goes off-topic
  `,

  // Voice selection
  voice_id: study.voice_profile.voice_id,

  // Enable knowledge base for additional context
  knowledge_base: {
    documents: [
      { name: 'study_details', content: JSON.stringify(study) }
    ]
  },

  // Dynamic variables for runtime context
  variables: {
    participant_name: '{{participant_name}}',
    current_section: '{{current_section}}',
    time_remaining: '{{time_remaining}}',
  },
});

// During interview
const conversation = await agent.startConversation({
  variables: {
    participant_name: participant.name,
    current_section: sections[currentIndex].title,
    time_remaining: calculateTimeRemaining(),
  },

  // Callbacks
  onMessage: (message) => {
    // Log conversation turn
    logTurn(message);
  },

  onComplete: () => {
    // Interview finished
    processTranscript();
  },
});
```

**Estimated Cost**: $2.00 per 20-min interview (+ LLM fees when added)

---

### For Structured Mode: **Original Approach** ✅

**Why**:
- Need precise control over question sequence
- Must display questions on screen while AI speaks
- Need to show stimulus (images, videos) at exact moments
- Different question types require different UIs
- Want to minimize cost for potentially shorter interactions

**Implementation**:
```javascript
// Current approach remains best
for (const item of section.items) {
  // Show question UI
  displayQuestion(item);

  // AI asks question
  const audio = await synthesizeTTS(item.question_text);
  await playAudio(audio);

  // Collect response
  const response = await recordAndTranscribe();

  // Decide: probe or continue?
  if (item.probing_enabled) {
    const decision = await analyzeWithGPT4o(response);
    if (decision.shouldProbe) {
      const probe = await generateProbe(response);
      // Loop for probe response
    }
  }

  // Next question
}
```

**Estimated Cost**: $1.42 per 20-min interview

---

## Detailed Cost Comparison Table

| Mode | Approach | Per Interview (20min) | Per 100 Interviews | Pros | Cons |
|------|----------|----------------------|-------------------|------|------|
| **Structured** | Original (TTS+Whisper+GPT) | $1.42 | $142 | Lowest cost, max control | Complex code |
| Structured | Agents Only | $2.00-2.50 | $200-250 | Simplest code | Higher cost, less control |
| Structured | Hybrid | $2.30-2.80 | $230-280 | Good control | Most complex |
| **Streaming** | Original (Conversational AI) | $2.54 | $254 | Control | Manual flow management |
| **Streaming** | **Agents Only** ✅ | **$2.00-2.50** | **$200-250** | **Natural flow, simple** | **Less control** |
| Streaming | Hybrid | $2.30-2.80 | $230-280 | Best of both | Over-engineered |

---

## Implementation Recommendation

### **Mixed Approach**: Best of Both Worlds

Use different architectures for different modes:

1. **Structured Mode**: Original approach (TTS + Whisper + GPT-4o)
   - **Cost**: $1.42 per interview
   - **Reason**: Precise control, lowest cost, UI-driven

2. **Streaming Mode**: ElevenLabs Agents only
   - **Cost**: $2.00-2.50 per interview
   - **Reason**: Natural conversation, simplest code, perfect fit

### Why This Works

- **Different needs**: Structured requires step-by-step control, Streaming benefits from natural flow
- **Cost optimization**: Use cheaper approach where possible (structured), use Agents where they shine (streaming)
- **Code simplicity**: Each mode has optimal implementation
- **Best user experience**: Structured feels guided, Streaming feels conversational

---

## Implementation Details: Agents for Streaming Mode

### Agent Creation (Step 5: Publish Study)

**File**: `src/lib/elevenlabs/create-agent.ts`

```typescript
import ElevenLabs from 'elevenlabs-node';

export async function createStudyAgent(study: Study) {
  const client = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  // Build system prompt
  const systemPrompt = buildAgentPrompt(study);

  // Create agent
  const agent = await client.agents.create({
    name: `${study.title} - AI Interviewer`,

    prompt: systemPrompt,

    voice: {
      voice_id: study.voice_profile.voice_id,
      model_id: 'eleven_flash_v2_5', // Lowest latency
    },

    conversation_config: {
      max_duration_seconds: study.estimated_duration_seconds || 1800, // 30min max
      turn_timeout_seconds: 10, // If participant silent for 10s, AI prompts
    },

    language: 'en', // Start with English only
  });

  // Store agent ID in study
  await supabase
    .from('studies')
    .update({ elevenlabs_agent_id: agent.id })
    .eq('id', study.id);

  return agent;
}

function buildAgentPrompt(study: Study): string {
  return `You are an AI interviewer conducting a qualitative research study.

ROLE & PERSONA:
- You are: ${study.ai_persona_role}
- Behavior: ${study.ai_persona_behavior}
- Personality: ${study.ai_persona_personality}

STUDY CONTEXT:
- Objective: ${study.objective}
- Target Audience: ${study.audience}
- Language: English
- Interview Mode: Streaming Conversation

INTERVIEW STRUCTURE:
You will conduct this interview in ${study.flow.sections.length} sections. Here's what to cover:

${study.flow.sections.map((section, i) => `
SECTION ${i + 1}: ${section.title}
Time Limit: ${section.time_limit_seconds} seconds
${section.stimulus_type ? `Stimulus: ${section.stimulus_type} - ${section.stimulus_url}` : ''}

Topics to explore:
${section.items.map((item, j) => `${j + 1}. ${item.question_text}`).join('\n')}
`).join('\n\n')}

CONVERSATION GUIDELINES:

1. **Opening**:
   - Greet the participant warmly
   - Briefly explain what you'll discuss
   - Set a comfortable, conversational tone

2. **During Sections**:
   - Cover all topics naturally in conversation
   - Don't read questions verbatim - weave them into dialogue
   - Ask follow-up questions if responses are vague or superficial
   - Listen actively and build on participant's answers
   - Use gentle redirection if they go off-topic: "That's interesting. Coming back to [topic]..."

3. **Time Management**:
   - You have approximately ${Math.floor(study.estimated_duration_seconds / 60)} minutes total
   - Pace yourself to cover all sections
   - When approaching time limit for a section, gracefully transition: "I'd love to hear your thoughts on one more thing..."

4. **Transitions**:
   - Move smoothly between sections
   - Don't announce section numbers
   - Use natural bridges: "That brings me to another question..." or "I'm curious about..."

5. **Probing Strategy**:
   ${study.flow.sections
      .flatMap(s => s.items)
      .some(i => i.probing_enabled)
      ? `- For questions marked as probe-enabled, dig deeper if responses lack detail
   - Use: "Can you tell me more about that?", "What made you think that?", "Can you give me an example?"`
      : `- Accept responses as given, don't over-probe`}

6. **Closing**:
   - Thank participant for their time and insights
   - Let them know their feedback is valuable
   - End on a positive note

CRITICAL RULES:
- Stay focused on the study objective at all times
- Never share personal information or go off-script into non-research topics
- If participant asks about compensation or technical issues, politely defer: "Please reach out to the study coordinator for that."
- If participant is uncomfortable with a topic, move on gracefully
- Maintain professional boundaries while being warm and engaging

Remember: You're here to understand the participant's perspective deeply. Be curious, empathetic, and genuinely interested in their experiences.`;
}
```

### Conversation Execution (Participant Interview)

**File**: `src/components/features/streaming-interview-agents.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Conversation } from '@11labs/client';

export function StreamingInterviewAgents({ study, token }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [status, setStatus] = useState<'initializing' | 'active' | 'paused' | 'completed'>('initializing');
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string }>>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    // Create interview session
    const session = await createInterviewSession(study.id, token);
    setSessionId(session.id);

    // Initialize ElevenLabs conversation
    const conv = await Conversation.startSession({
      agentId: study.elevenlabs_agent_id,

      // Dynamic variables for this specific session
      overrides: {
        agent: {
          prompt: {
            variables: {
              participant_name: session.participant_name || 'there',
              time_remaining: study.estimated_duration_seconds,
            },
          },
        },
      },

      // Event callbacks
      callbacks: {
        onConnect: () => {
          console.log('Connected to agent');
          setStatus('active');
        },

        onDisconnect: () => {
          console.log('Disconnected');
          handleInterviewComplete();
        },

        onMessage: (message) => {
          // Log transcript
          const turn = {
            speaker: message.source === 'agent' ? 'ai' : 'participant',
            text: message.message,
            timestamp: new Date(),
          };

          setTranscript(prev => [...prev, turn]);

          // Save to database
          saveConversationTurn(sessionId, turn);
        },

        onModeChange: (mode) => {
          // Agent is thinking, speaking, or listening
          console.log('Mode:', mode);
        },
      },
    });

    setConversation(conv);
  };

  const handlePause = async () => {
    if (conversation) {
      await conversation.pause();
      setStatus('paused');

      // Save pause state
      await saveSessionPause(sessionId);
    }
  };

  const handleResume = async () => {
    if (conversation) {
      await conversation.resume();
      setStatus('active');

      // Update session
      await updateSessionResume(sessionId);
    }
  };

  const handleEndEarly = async () => {
    if (conversation) {
      await conversation.endSession();
      setStatus('completed');
    }
  };

  const handleInterviewComplete = async () => {
    setStatus('completed');

    // Get full transcript from session
    const fullTranscript = await conversation.getTranscript();

    // Process and segment transcript
    await segmentAndAnalyzeTranscript(sessionId, fullTranscript);

    // Show completion screen
    router.push(`/interview/${token}/complete`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">{study.title}</h2>
          <div className="flex items-center gap-2">
            {status === 'active' && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
                <span className="text-sm">Live</span>
              </div>
            )}
            {status === 'paused' && (
              <span className="text-sm text-amber-600">Paused</span>
            )}
          </div>
        </div>

        {/* Time remaining (approximate) */}
        <div className="text-sm text-muted">
          Estimated time: {Math.floor(study.estimated_duration_seconds / 60)} minutes
        </div>
      </div>

      {/* Live Transcript Feed */}
      <div className="mb-8">
        <h3 className="text-sm font-medium mb-4">Conversation</h3>
        <div className="max-h-[500px] overflow-y-auto space-y-3">
          {transcript.map((turn, i) => (
            <div
              key={i}
              className={cn(
                'p-4 rounded-lg',
                turn.speaker === 'ai'
                  ? 'bg-blue-50 dark:bg-blue-950 mr-12'
                  : 'bg-gray-100 dark:bg-gray-800 ml-12'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {turn.speaker === 'ai' ? (
                  <Bot className="h-4 w-4 text-blue-600" />
                ) : (
                  <User className="h-4 w-4 text-gray-600" />
                )}
                <span className="text-xs font-medium">
                  {turn.speaker === 'ai' ? 'AI Interviewer' : 'You'}
                </span>
                <span className="text-xs text-muted">
                  {format(turn.timestamp, 'HH:mm:ss')}
                </span>
              </div>
              <p className="text-sm">{turn.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {status === 'active' && (
          <>
            <Button
              variant="outline"
              onClick={handlePause}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>

            <Button
              variant="ghost"
              onClick={handleEndEarly}
            >
              End Early
            </Button>
          </>
        )}

        {status === 'paused' && (
          <>
            <Button
              onClick={handleResume}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>

            <Button
              variant="ghost"
              onClick={handleEndEarly}
            >
              End Interview
            </Button>
          </>
        )}

        {status === 'completed' && (
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-medium">Interview Complete</p>
            <p className="text-sm text-muted">Processing your responses...</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {status === 'active' && (
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>💬 Just speak naturally</strong> - The AI will listen and respond to you.
            Feel free to pause, take your time, and have a natural conversation.
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Pause/Resume Implementation

### Session State Management

**Database**: `interview_sessions` table

```sql
ALTER TABLE interview_sessions
ADD COLUMN paused_at TIMESTAMP,
ADD COLUMN resumed_at TIMESTAMP,
ADD COLUMN pause_count INTEGER DEFAULT 0,
ADD COLUMN total_paused_duration_seconds INTEGER DEFAULT 0;
```

### Pause/Resume Logic

```typescript
async function saveSessionPause(sessionId: string) {
  await supabase
    .from('interview_sessions')
    .update({
      paused_at: new Date().toISOString(),
      pause_count: sql`pause_count + 1`,
    })
    .eq('id', sessionId);
}

async function updateSessionResume(sessionId: string) {
  const { data: session } = await supabase
    .from('interview_sessions')
    .select('paused_at')
    .eq('id', sessionId)
    .single();

  if (session?.paused_at) {
    const pausedDuration = Date.now() - new Date(session.paused_at).getTime();

    await supabase
      .from('interview_sessions')
      .update({
        resumed_at: new Date().toISOString(),
        total_paused_duration_seconds: sql`total_paused_duration_seconds + ${Math.floor(pausedDuration / 1000)}`,
        paused_at: null,
      })
      .eq('id', sessionId);
  }
}
```

### Duration Calculation (Excluding Pauses)

```typescript
function calculateActualInterviewTime(session: InterviewSession): number {
  const totalElapsed =
    (session.completed_at || new Date()).getTime() -
    session.started_at.getTime();

  const actualTime = totalElapsed - (session.total_paused_duration_seconds * 1000);

  return Math.floor(actualTime / 1000); // Return seconds
}
```

---

## 30-Minute Hard Cap Implementation

### Duration Guardrails

```typescript
const MAX_INTERVIEW_DURATION = 30 * 60; // 30 minutes in seconds

// Configure agent with max duration
const agent = await client.agents.create({
  // ... other config

  conversation_config: {
    max_duration_seconds: MAX_INTERVIEW_DURATION,

    // Warning at 90% (27 minutes)
    duration_warning_seconds: Math.floor(MAX_INTERVIEW_DURATION * 0.9),
  },
});

// During interview, track time
useEffect(() => {
  if (status !== 'active') return;

  const interval = setInterval(() => {
    const elapsed = calculateElapsedTime(session);

    // 90% warning
    if (elapsed >= MAX_INTERVIEW_DURATION * 0.9 && !warningShown) {
      showDurationWarning();
      setWarningShown(true);

      // Tell agent to wrap up
      conversation.sendSystemMessage(
        "You're approaching the time limit. Please wrap up the current topic and conclude the interview within the next 3 minutes."
      );
    }

    // Hard stop at 30 minutes
    if (elapsed >= MAX_INTERVIEW_DURATION) {
      handleForceEnd();
    }
  }, 10000); // Check every 10 seconds

  return () => clearInterval(interval);
}, [status]);

function handleForceEnd() {
  // Gracefully end conversation
  conversation.sendSystemMessage(
    "Time limit reached. Please thank the participant and end the interview now."
  );

  // Force disconnect after 30 seconds grace period
  setTimeout(() => {
    if (status === 'active') {
      conversation.endSession();
    }
  }, 30000);
}
```

---

## Cost Tracking with Agents

### Track Usage During Interview

```typescript
// ElevenLabs Agents bill per minute
async function trackAgentCost(sessionId: string, durationSeconds: number) {
  const durationMinutes = Math.ceil(durationSeconds / 60);
  const agentCost = durationMinutes * 10; // $0.10/min = 10 cents/min

  // Note: LLM costs currently absorbed, will be added later
  const estimatedLLMCost = Math.ceil(durationMinutes * 1.5); // Estimate ~1.5 cents/min for LLM

  await supabase
    .from('interview_sessions')
    .update({
      elevenlabs_cost_cents: agentCost,
      openai_cost_cents: 0, // Not using OpenAI directly
      estimated_future_llm_cost_cents: estimatedLLMCost,
      total_cost_cents: agentCost, // Will increase when LLM costs added
      actual_duration_seconds: durationSeconds,
    })
    .eq('id', sessionId);
}
```

---

## Migration Path

### Phase 1: Implement Original Approach (Weeks 1-6)
- Build structured mode with TTS + Whisper + GPT-4o
- Build streaming mode with Conversational AI + GPT-4o
- Get both modes working and tested

### Phase 2: Add Agents for Streaming (Week 7)
- Implement ElevenLabs Agents for streaming mode
- Run A/B test: Conversational AI vs Agents
- Compare cost, quality, participant experience

### Phase 3: Optimize (Week 8+)
- Keep best approach for each mode based on data
- Fine-tune prompts and configurations
- Optimize costs

This de-risks the implementation while exploring the new Agents capability.

---

## Open Questions for ElevenLabs

Before fully committing to Agents, clarify:

1. **LLM Cost Pass-Through Timeline**: When will LLM costs be added? What will the pricing be?
2. **Transcript Segmentation**: Can Agents tag which topics/questions they're addressing in real-time?
3. **Workflows for Structured Mode**: Can Agents handle strict step-by-step flows with screen-based UI?
4. **Knowledge Base Limits**: Is 300k chars sufficient, or should we explore RAG?
5. **Analytics**: What conversation metrics does the Agents platform provide?

---

## Final Recommendation

**START WITH MIXED APPROACH**:

1. **Structured Mode**: Original (TTS + Whisper + GPT-4o) - **$1.42/interview**
   - Proven, precise control, lowest cost

2. **Streaming Mode**: ElevenLabs Agents Only - **$2.00-2.50/interview**
   - Natural conversation, simplest code, perfect fit

3. **Future**: Monitor Agents platform, migrate structured mode if benefits justify cost increase

**Cost Projection** (100 interviews each mode):
- Structured: 100 × $1.42 = $142
- Streaming: 100 × $2.25 = $225
- **Total: $367 for 200 interviews**

This balances cost optimization, code simplicity, and user experience across both modes.

---

**Sources**:
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [ElevenLabs Agents Cost Structure](https://help.elevenlabs.io/hc/en-us/articles/29298065878929-How-much-does-ElevenLabs-Agents-formerly-Conversational-AI-cost)
- [Conversational AI Price Reduction](https://elevenlabs.io/blog/we-cut-our-pricing-for-conversational-ai)
- [Agents Prompting Guide](https://elevenlabs.io/docs/agents-platform/best-practices/prompting-guide)
- [Knowledge Base Configuration](https://elevenlabs.io/docs/agents-platform/customization/knowledge-base)
- [Dynamic Variables & Overrides](https://elevenlabs.io/docs/agents-platform/customization/personalization/overrides)
