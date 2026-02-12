import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit, getClientIp } from '@/lib/api/rate-limit';

const STALE_SESSION_MINUTES = 30;
const MAX_PAUSE_DURATION_DAYS = 7;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`check-session:${ip}`, { maxRequests: 20 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id query param is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: session, error } = await supabase
      .from('interview_sessions')
      .select('id, session_status, paused_at, completed_at, study_id, participant_name, participant_email, updated_at')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ resumable: false, reason: 'not_found' });
    }

    // Already completed
    if (session.session_status === 'completed' || session.completed_at) {
      return NextResponse.json({ resumable: false, reason: 'completed' });
    }

    // Check if study is still live
    const { data: study } = await supabase
      .from('studies')
      .select('status')
      .eq('id', session.study_id)
      .single();

    if (!study || study.status !== 'live') {
      return NextResponse.json({ resumable: false, reason: 'study_closed' });
    }

    // If paused, check expiry
    if (session.session_status === 'paused' && session.paused_at) {
      const daysSincePause = (Date.now() - new Date(session.paused_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePause > MAX_PAUSE_DURATION_DAYS) {
        return NextResponse.json({ resumable: false, reason: 'expired' });
      }
    }

    // If "active" but stale (no activity for 30 min), auto-pause it
    if (session.session_status === 'active' && session.updated_at) {
      const minutesSinceUpdate = (Date.now() - new Date(session.updated_at).getTime()) / (1000 * 60);
      if (minutesSinceUpdate > STALE_SESSION_MINUTES) {
        await supabase
          .from('interview_sessions')
          .update({
            session_status: 'paused',
            paused_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      }
    }

    return NextResponse.json({
      resumable: true,
      session_summary: {
        participant_name: session.participant_name,
        participant_email: session.participant_email,
      },
    });
  } catch (error) {
    console.error('Error in check-session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
