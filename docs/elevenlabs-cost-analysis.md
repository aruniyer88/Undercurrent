# ElevenLabs & AI Interviewer Cost Analysis

## Interview Assumptions (Baseline Scenario)

**Typical 20-minute qualitative interview:**
- **Total duration**: 20 minutes
- **Number of questions**: 15 questions (mix of sections)
- **Participant speaking time**: ~12 minutes (60% of time)
- **AI interviewer speaking time**: ~8 minutes (40% of time)
- **Probing enabled**: 50% of questions (moderate probing)
- **Average probes per question**: 1.5 follow-ups when enabled

---

## Structured Mode Cost Comparison

### Option A: ElevenLabs TTS + OpenAI Whisper + GPT-4

#### Components:

**1. ElevenLabs Text-to-Speech (turbo-v2)**
- AI speaks 8 minutes of interview
- Average speaking rate: ~150 words/minute = ~750 characters/minute
- Total characters: 8 min × 750 = 6,000 characters
- **Cost**: 6K chars × $0.18/1K = **$1.08 per interview**

**2. OpenAI Whisper Speech-to-Text**
- Participant speaks 12 minutes
- **Cost**: 12 min × $0.006/min = **$0.072 per interview**

**3. OpenAI GPT-4 (AI Response Generation)**
- Per question cycle: System prompt + conversation history + participant response → AI decision + response text
- Assumptions:
  - System prompt: ~1,500 tokens (study config, persona, current section)
  - Conversation history: grows from 0 to ~3,000 tokens over interview
  - Per response generation: ~500 input tokens, ~150 output tokens average
  - 15 main questions + ~11 probes = 26 AI responses

- **Input tokens**:
  - Avg per response: (1,500 system + 1,500 avg history + 500 new) = 3,500 tokens
  - Total: 26 × 3,500 = 91,000 tokens
  - **Cost**: 91K × $0.01/1K = **$0.91**

- **Output tokens**:
  - Total: 26 × 150 = 3,900 tokens
  - **Cost**: 3.9K × $0.03/1K = **$0.12**

**GPT-4 subtotal**: $0.91 + $0.12 = **$1.03 per interview**

**OPTION A TOTAL**: $1.08 + $0.072 + $1.03 = **$2.18 per interview**

---

### Option B: ElevenLabs Conversational AI + GPT-4

#### Components:

**1. ElevenLabs Conversational AI** (handles both TTS and STT)
- Bi-directional voice conversation
- Pricing: Estimated ~$0.36/1K characters for full conversation handling
- AI speaks ~6,000 characters (same as Option A)
- **Cost**: 6K chars × $0.36/1K = **$2.16 per interview**

**2. OpenAI GPT-4** (same as Option A)
- **Cost**: **$1.03 per interview**

**OPTION B TOTAL**: $2.16 + $1.03 = **$3.19 per interview**

---

### Structured Mode Comparison:

| Component | Option A (TTS + Whisper) | Option B (Conversational AI) |
|-----------|-------------------------|------------------------------|
| Voice Output (AI → Participant) | $1.08 | $2.16 |
| Voice Input (Participant → AI) | $0.072 | (included above) |
| AI Logic (GPT-4) | $1.03 | $1.03 |
| **TOTAL PER INTERVIEW** | **$2.18** | **$3.19** |
| **Cost for 100 interviews** | **$218** | **$319** |

**Recommendation for Structured Mode**: **Option A** saves ~32% ($1.01 per interview)

---

## Streaming Mode Cost Analysis

### Option: ElevenLabs Conversational AI + GPT-4

**Note**: Streaming mode requires real-time bidirectional conversation, so Conversational AI is essentially required.

#### Components:

**1. ElevenLabs Conversational AI**
- Same calculation as Structured Option B
- **Cost**: **$2.16 per interview**

**2. OpenAI GPT-4**
- More tokens needed due to free-flowing conversation
- Assumptions:
  - More frequent AI responses (checking topic coverage, transitions)
  - 30-40 AI turns instead of 26
  - Real-time topic tracking requires more system context

- **Input tokens**:
  - Avg per response: ~3,800 tokens (slightly higher for tracking)
  - Total: 35 × 3,800 = 133,000 tokens
  - **Cost**: 133K × $0.01/1K = **$1.33**

- **Output tokens**:
  - Total: 35 × 150 = 5,250 tokens
  - **Cost**: 5.25K × $0.03/1K = **$0.16**

**GPT-4 subtotal**: $1.33 + $0.16 = **$1.49 per interview**

**STREAMING MODE TOTAL**: $2.16 + $1.49 = **$3.65 per interview**

---

## Cost Optimization: Using GPT-4o Instead of GPT-4

GPT-4o is significantly cheaper while maintaining quality for conversational tasks.

**GPT-4o pricing:**
- Input: $0.0025/1K tokens (75% cheaper than GPT-4)
- Output: $0.01/1K tokens (67% cheaper than GPT-4)

### Structured Mode with GPT-4o (Option A):

- Input: 91K × $0.0025/1K = $0.23
- Output: 3.9K × $0.01/1K = $0.04
- **GPT-4o cost**: $0.27 (vs $1.03 with GPT-4)

**New total**: $1.08 (TTS) + $0.072 (Whisper) + $0.27 (GPT-4o) = **$1.42 per interview**

### Streaming Mode with GPT-4o:

- Input: 133K × $0.0025/1K = $0.33
- Output: 5.25K × $0.01/1K = $0.05
- **GPT-4o cost**: $0.38 (vs $1.49 with GPT-4)

**New total**: $2.16 (Conversational AI) + $0.38 (GPT-4o) = **$2.54 per interview**

---

## Final Cost Summary (20-minute interview)

| Mode | GPT Model | Per Interview | Per 100 Interviews |
|------|-----------|---------------|-------------------|
| **Structured** (TTS + Whisper) | GPT-4 | $2.18 | $218 |
| **Structured** (TTS + Whisper) | **GPT-4o** ✅ | **$1.42** | **$142** |
| Structured (Conversational AI) | GPT-4 | $3.19 | $319 |
| Structured (Conversational AI) | GPT-4o | $2.35 | $235 |
| **Streaming** | GPT-4 | $3.65 | $365 |
| **Streaming** | **GPT-4o** ✅ | **$2.54** | **$254** |

---

## Recommendations

### 1. **Use GPT-4o for both modes**
Saves ~65-75% on AI logic costs with negligible quality impact for interview conversations.

### 2. **For Structured Mode: Use ElevenLabs TTS + OpenAI Whisper**
- Saves ~40% compared to using Conversational AI for structured interviews
- Better cost efficiency: **$1.42 per 20-min interview**
- More control over individual components

### 3. **For Streaming Mode: Use ElevenLabs Conversational AI**
- Required for real-time conversation: **$2.54 per 20-min interview**
- Worth the premium for natural conversational experience

### 4. **Cost Guardrails**
- **Structured (20min)**: Budget $1.50 per interview
- **Streaming (20min)**: Budget $2.75 per interview
- **30min interviews**: Add ~50% ($2.25 structured, $4.00 streaming)
- **Implement soft cutoffs** at 90% duration to prevent cost overruns

---

## Cost Factors & Variables

### What drives costs up:
1. **Longer interviews**: Linear cost increase with duration
2. **Heavy probing**: Each probe = additional GPT + TTS costs
3. **Many questions**: More AI responses = more GPT calls
4. **Verbose AI persona**: Longer responses = more TTS characters
5. **Streaming mode**: Inherently more expensive due to Conversational AI

### Cost optimization strategies:
1. **Concise AI responses**: Train AI to be brief but natural
2. **Smart probing**: Only probe when response is genuinely insufficient
3. **Batch processing**: Where possible, pre-generate common phrases
4. **Caching**: Cache AI responses for common acknowledgments ("I see", "Thank you")
5. **Monitor per-question costs**: Flag expensive questions for optimization

---

## Storage Costs (Bonus)

**Audio storage** (Supabase):
- 20-min interview at 64kbps: ~9.6MB
- Supabase storage: $0.021/GB/month
- Per interview: ~$0.0002/month (negligible)
- 1,000 interviews: ~$0.20/month

**Note**: Storage costs are essentially zero compared to API costs.

---

## Example Budget Scenarios

### Small Study (20 participants, 20min each):
- **Structured**: 20 × $1.42 = **$28.40**
- **Streaming**: 20 × $2.54 = **$50.80**

### Medium Study (50 participants, 25min each):
- **Structured**: 50 × $1.78 = **$89.00**
- **Streaming**: 50 × $3.18 = **$159.00**

### Large Study (200 participants, 20min each):
- **Structured**: 200 × $1.42 = **$284.00**
- **Streaming**: 200 × $2.54 = **$508.00**

---

## Conclusion

**Recommended Architecture:**

- **Structured Mode**: ElevenLabs TTS (turbo-v2) + OpenAI Whisper + GPT-4o
  - **Cost**: ~$1.42 per 20-min interview
  - **Best for**: Question-specific analysis, stimulus-based research, quantitative elements

- **Streaming Mode**: ElevenLabs Conversational AI + GPT-4o
  - **Cost**: ~$2.54 per 20-min interview
  - **Best for**: Exploratory research, natural conversations, relationship-based interviews

**Budget rule of thumb**: $1.50 structured, $2.75 streaming per 20 minutes.
