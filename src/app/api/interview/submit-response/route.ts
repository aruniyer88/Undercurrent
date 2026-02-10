import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit, getClientIp } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`submit-response:${ip}`, { maxRequests: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const {
      session_id,
      flow_item_id,
      text_response,
      selected_options,
      rating_value,
      ranked_items,
      conversation_transcript,
      conversation_duration_seconds,
      conversation_turn,
    } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('id, study_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Streaming interview: save conversation turn
    if (conversation_turn && !flow_item_id) {
      // Count existing turns to get turn_number
      const { count } = await supabase
        .from('conversation_turns')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session_id);

      const { data: turn, error: turnError } = await supabase
        .from('conversation_turns')
        .insert({
          session_id,
          turn_number: (count || 0) + 1,
          speaker: conversation_turn.role === 'assistant' ? 'ai' : 'participant',
          text_content: conversation_turn.content,
          started_at: conversation_turn.timestamp || new Date().toISOString(),
        })
        .select()
        .single();

      if (turnError) {
        console.error('Failed to insert conversation turn:', turnError);
        return NextResponse.json(
          { error: 'Failed to store conversation turn' },
          { status: 500 }
        );
      }

      return NextResponse.json({ turn });
    }

    // Structured interview: save flow response
    if (!flow_item_id) {
      return NextResponse.json(
        { error: 'flow_item_id is required for structured responses' },
        { status: 400 }
      );
    }

    const { data: response, error: responseError } = await supabase
      .from('flow_responses')
      .insert({
        study_id: session.study_id,
        participant_id: session_id,
        flow_item_id,
        text_response: text_response || null,
        selected_options: selected_options || null,
        rating_value: rating_value ?? null,
        ranked_items: ranked_items || null,
        conversation_transcript: conversation_transcript || null,
        conversation_duration_seconds: conversation_duration_seconds ?? null,
      })
      .select()
      .single();

    if (responseError) {
      console.error('Failed to insert flow response:', responseError);
      return NextResponse.json(
        { error: 'Failed to store response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in submit-response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
