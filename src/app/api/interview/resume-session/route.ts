import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit, getClientIp } from '@/lib/api/rate-limit';

const MAX_PAUSE_DURATION_DAYS = 7;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`resume-session:${ip}`, { maxRequests: 10 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Validate session is paused
    if (session.session_status !== 'paused') {
      return NextResponse.json(
        { error: 'Session is not paused' },
        { status: 400 }
      );
    }

    // Validate study is still live
    const { data: study } = await supabase
      .from('studies')
      .select('status')
      .eq('id', session.study_id)
      .single();

    if (!study || study.status !== 'live') {
      return NextResponse.json(
        { error: 'This study is no longer accepting responses' },
        { status: 403 }
      );
    }

    // Validate pause duration
    if (session.paused_at) {
      const pausedAt = new Date(session.paused_at);
      const daysSincePause = (Date.now() - pausedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePause > MAX_PAUSE_DURATION_DAYS) {
        return NextResponse.json(
          { error: 'Session has expired. Please start a new interview.' },
          { status: 410 }
        );
      }
    }

    // Calculate paused duration
    const now = new Date();
    let additionalPausedSeconds = 0;
    if (session.paused_at) {
      additionalPausedSeconds = Math.round((now.getTime() - new Date(session.paused_at).getTime()) / 1000);
    }
    const totalPausedSeconds = (session.total_paused_duration_seconds || 0) + additionalPausedSeconds;

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('interview_sessions')
      .update({
        session_status: 'active',
        resumed_at: now.toISOString(),
        total_paused_duration_seconds: totalPausedSeconds,
      })
      .eq('id', session_id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to resume session:', updateError);
      return NextResponse.json({ error: 'Failed to resume session' }, { status: 500 });
    }

    // Get answered item IDs
    const { data: responses } = await supabase
      .from('flow_responses')
      .select('flow_item_id')
      .eq('participant_id', session_id);

    const answeredItemIds = (responses || []).map((r) => r.flow_item_id);

    return NextResponse.json({
      session: updatedSession,
      answered_item_ids: answeredItemIds,
    });
  } catch (error) {
    console.error('Error in resume-session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
