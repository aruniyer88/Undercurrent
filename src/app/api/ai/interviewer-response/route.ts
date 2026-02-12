import { NextRequest, NextResponse } from 'next/server';
import { validateInterviewSession } from '@/lib/api/validate-session';
import { rateLimit, getClientIp } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 30 requests per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`interviewer:${ip}`, { maxRequests: 30 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      session_id,
      study_objective,
      ai_persona_prompt,
      question_text,
      participant_response,
      conversation_history,
      study_type,
    } = body;

    // Require a valid interview session
    if (!(await validateInterviewSession(session_id))) {
      return NextResponse.json(
        { error: 'Invalid or missing session_id' },
        { status: 401 }
      );
    }

    if (!participant_response) {
      return NextResponse.json(
        { error: 'participant_response is required' },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt({
      study_objective,
      ai_persona_prompt,
      study_type,
    });

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      // Include conversation history if provided
      ...(conversation_history || []),
      // Current question context
      ...(question_text
        ? [{ role: 'assistant' as const, content: question_text }]
        : []),
      // Participant's response
      { role: 'user' as const, content: participant_response },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 300,
        response_format: {
          type: 'json_object',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate interviewer response' },
        { status: response.status }
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { action: 'continue', text: '' };
    }

    return NextResponse.json({
      action: parsed.action || 'continue', // 'probe' | 'continue' | 'transition'
      text: parsed.text || '',
      reasoning: parsed.reasoning || null,
      usage: {
        input_tokens: result.usage?.prompt_tokens || 0,
        output_tokens: result.usage?.completion_tokens || 0,
      },
    });
  } catch (error) {
    console.error('Error in interviewer-response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt({
  study_objective,
  ai_persona_prompt,
  study_type,
}: {
  study_objective?: string;
  ai_persona_prompt?: string;
  study_type?: string;
}): string {
  return `You are an AI interviewer conducting a qualitative research interview.

${ai_persona_prompt || 'You are warm, curious, and empathetic. You listen actively and ask thoughtful follow-up questions.'}

Study objective: ${study_objective || 'Understand the participant\'s perspective.'}
Study type: ${study_type || 'structured'}

Your task: Based on the participant's response, decide what to do next.

Respond in JSON format:
{
  "action": "probe" | "continue" | "transition",
  "text": "Your response to the participant (a follow-up question if probing, a brief acknowledgment if continuing)",
  "reasoning": "Brief explanation of why you chose this action"
}

- "probe": Ask a follow-up question to dig deeper into the participant's response
- "continue": The response is sufficient, acknowledge and move to the next question
- "transition": Time to move to the next topic

Guidelines:
- Keep responses concise (1-2 sentences)
- Be conversational, not robotic
- Probe when the response is vague, interesting, or could reveal more insight
- Don't probe more than 2 times on the same question
- Acknowledge the participant's response before probing`;
}
