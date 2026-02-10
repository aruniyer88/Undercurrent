import { createServiceClient } from '@/lib/supabase/service';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1/convai';

// Map full language names to ElevenLabs 2-letter codes
const LANGUAGE_MAP: Record<string, string> = {
  english: 'en', japanese: 'ja', chinese: 'zh', german: 'de',
  hindi: 'hi', french: 'fr', korean: 'ko', portuguese: 'pt',
  italian: 'it', spanish: 'es', indonesian: 'id', dutch: 'nl',
  turkish: 'tr', polish: 'pl', swedish: 'sv', bulgarian: 'bg',
  romanian: 'ro', arabic: 'ar', czech: 'cs', greek: 'el',
  finnish: 'fi', malay: 'ms', danish: 'da', tamil: 'ta',
  ukrainian: 'uk', russian: 'ru', hungarian: 'hu', croatian: 'hr',
  slovak: 'sk', norwegian: 'no', vietnamese: 'vi', filipino: 'tl',
};

function normalizeLanguage(lang: string | undefined | null): string {
  if (!lang) return 'en';
  const lower = lang.toLowerCase().trim();
  if (lower.length <= 3) return lower;
  return LANGUAGE_MAP[lower] || 'en';
}

function buildSystemPrompt(
  study: { ai_persona_prompt?: string | null; objective?: string | null },
  sections: Array<{
    title?: string | null;
    time_limit_seconds?: number | null;
    items?: Array<{ item_type: string; question_text?: string | null }>;
  }>
): string {
  const personaBlock = study.ai_persona_prompt
    ? `## Your Persona\n${study.ai_persona_prompt}\n\n`
    : '';

  const objectiveBlock = study.objective
    ? `## Research Objective\n${study.objective}\n\n`
    : '';

  // Build a flat list of topics/questions grouped by theme (no section numbers or time limits)
  const topicsBlock = sections
    .map((section) => {
      const items = section.items || [];
      const questions = items
        .map((item) => item.question_text || '')
        .filter(Boolean)
        .map((q) => `- ${q}`)
        .join('\n');

      if (!questions) return '';

      // Use section title as a theme header (no numbers, no "section" label)
      if (section.title) {
        return `**${section.title}**\n${questions}`;
      }
      return questions;
    })
    .filter(Boolean)
    .join('\n\n');

  return `You are conducting a qualitative research interview. Your goal is to have a natural, flowing conversation with the participant while covering all the research topics.

${personaBlock}${objectiveBlock}## Topics to Explore
${topicsBlock || 'Have an open conversation exploring the research objective above.'}

## Guidelines
- Have a natural conversation — don't read questions verbatim, weave them into dialogue
- Probe deeper when the participant says something interesting (ask "why", "can you tell me more", "what do you mean by that")
- Transition smoothly between topics
- Be warm, empathetic, and encouraging
- When you've covered all the key topics thoroughly, thank the participant and end the conversation naturally
- Keep the conversation flowing naturally — this should feel like a chat, not a questionnaire`;
}

function buildFirstMessage(
  sections: Array<{ title?: string | null; time_limit_seconds?: number | null }>
): string {
  // Calculate total interview time
  const totalSeconds = sections.reduce((sum, s) => sum + (s.time_limit_seconds || 120), 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  // Format time in a friendly way
  const timePhrase = totalMinutes <= 10
    ? "about 10 minutes"
    : totalMinutes <= 20
    ? "about 15-20 minutes"
    : totalMinutes <= 30
    ? "about 20-30 minutes"
    : `about ${Math.round(totalMinutes / 10) * 10} minutes`;

  return `Hi! Thank you so much for joining this interview today. I'm really excited to hear your thoughts and perspectives.

Before we begin, I want to set some expectations: this conversation should take ${timePhrase}. We'll be chatting in a natural, conversational way — think of it as a relaxed discussion rather than a formal questionnaire.

Feel free to take your time with your responses, and if you need to pause at any point, just let me know and you can come back when you're ready.

Are you comfortable and ready to get started?`;
}

/**
 * Fetches study data needed to configure an agent.
 */
async function fetchStudyAgentData(studyId: string) {
  const supabase = createServiceClient();

  const { data: study, error: studyError } = await supabase
    .from('studies')
    .select('id, title, objective, ai_persona_prompt, language, voice_profile_id, elevenlabs_agent_id')
    .eq('id', studyId)
    .single();

  if (studyError || !study) throw new Error('Study not found');

  const { data: studyFlowRaw } = await supabase
    .from('study_flows')
    .select('*, flow_sections(*, flow_items(*))')
    .eq('study_id', studyId)
    .maybeSingle();

  const sections = (studyFlowRaw?.flow_sections || [])
    .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
    .map((section: Record<string, unknown>) => ({
      ...section,
      items: ((section.flow_items as Array<{ display_order: number }>) || [])
        .sort((a, b) => a.display_order - b.display_order),
    }));

  let voiceId: string | undefined;
  if (study.voice_profile_id) {
    const { data: vp } = await supabase
      .from('voice_profiles')
      .select('provider_voice_id')
      .eq('id', study.voice_profile_id)
      .single();
    if (vp?.provider_voice_id) {
      voiceId = vp.provider_voice_id.replace(/^preset-/, '');
    }
  }

  return { study, sections, voiceId, supabase };
}

/**
 * Builds the conversation_config payload used for both create and update.
 */
function buildConversationConfig(
  study: { title?: string | null; ai_persona_prompt?: string | null; objective?: string | null; language?: string | null },
  sections: Array<{ title?: string | null; time_limit_seconds?: number | null; items?: Array<{ item_type: string; question_text?: string | null }> }>,
  voiceId: string | undefined
) {
  const systemPrompt = buildSystemPrompt(study, sections);
  const firstMessage = buildFirstMessage(sections);
  const language = normalizeLanguage(study.language);

  return {
    agent: {
      first_message: firstMessage,
      language,
      prompt: {
        prompt: systemPrompt,
        llm: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 1000,
      },
    },
    ...(voiceId
      ? { tts: { voice_id: voiceId, model_id: 'eleven_turbo_v2' } }
      : {}),
  };
}

/**
 * Ensures a dedicated ElevenLabs agent exists for this study.
 * Creates one if missing, updates the existing one if already present.
 * Returns the agent_id.
 */
export async function ensureStudyAgent(studyId: string): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured');

  const { study, sections, voiceId, supabase } = await fetchStudyAgentData(studyId);
  const conversationConfig = buildConversationConfig(study, sections, voiceId);
  const agentName = `${study.title || 'Untitled Study'} — Interviewer`;

  // If agent already exists, update it
  if (study.elevenlabs_agent_id) {
    const response = await fetch(`${ELEVENLABS_API_BASE}/agents/${study.elevenlabs_agent_id}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: agentName, conversation_config: conversationConfig }),
    });

    if (response.ok) {
      console.log(`[ElevenLabs] Updated agent ${study.elevenlabs_agent_id} for study ${studyId}`);
      return study.elevenlabs_agent_id;
    }

    // If update fails (e.g. agent was deleted externally), fall through to create
    console.warn(`[ElevenLabs] Update failed (${response.status}), creating new agent`);
  }

  // Create a new agent
  const response = await fetch(`${ELEVENLABS_API_BASE}/agents/create`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: agentName, conversation_config: conversationConfig }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs agent creation failed:', response.status, errorText);
    throw new Error(`Failed to create ElevenLabs agent: ${response.status}`);
  }

  const agentData = await response.json();
  const agentId = agentData.agent_id;
  if (!agentId) throw new Error('ElevenLabs response missing agent_id');

  // Store the agent_id on the study
  const { error: updateError } = await supabase
    .from('studies')
    .update({ elevenlabs_agent_id: agentId })
    .eq('id', studyId);

  if (updateError) {
    console.error('Failed to store agent_id on study:', updateError);
    await deleteAgent(apiKey, agentId);
    throw new Error('Failed to store agent_id on study');
  }

  console.log(`[ElevenLabs] Created agent ${agentId} for study ${studyId}`);
  return agentId;
}

/**
 * Deletes the ElevenLabs agent for a study and clears the agent_id.
 * Silently succeeds if no agent exists.
 */
export async function deleteStudyAgent(studyId: string): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return;

  const supabase = createServiceClient();

  const { data: study } = await supabase
    .from('studies')
    .select('elevenlabs_agent_id')
    .eq('id', studyId)
    .single();

  if (!study?.elevenlabs_agent_id) return;

  await deleteAgent(apiKey, study.elevenlabs_agent_id);

  // Clear the agent_id
  await supabase
    .from('studies')
    .update({ elevenlabs_agent_id: null })
    .eq('id', studyId);

  console.log(`[ElevenLabs] Deleted agent ${study.elevenlabs_agent_id} for study ${studyId}`);
}

async function deleteAgent(apiKey: string, agentId: string): Promise<void> {
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/agents/${agentId}`, {
      method: 'DELETE',
      headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok && response.status !== 404) {
      console.error('ElevenLabs agent deletion failed:', response.status);
    }
  } catch (err) {
    console.error('Error deleting ElevenLabs agent:', err);
  }
}
