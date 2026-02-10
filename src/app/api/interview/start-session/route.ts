import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit, getClientIp } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 5 session creations per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`start-session:${ip}`, { maxRequests: 5 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const { study_id, study_type, interview_mode, participant_name, participant_email, language } = body;

    if (!study_id || !study_type || !interview_mode) {
      return NextResponse.json(
        { error: 'study_id, study_type, and interview_mode are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify the study exists and is live (or being tested)
    const { data: study, error: studyError } = await supabase
      .from('studies')
      .select('id, status')
      .eq('id', study_id)
      .single();

    if (studyError || !study) {
      return NextResponse.json({ error: 'Study not found' }, { status: 404 });
    }

    const allowedStatuses = ['live', 'ready_for_test', 'tested', 'draft', 'paused'];
    if (!allowedStatuses.includes(study.status)) {
      return NextResponse.json(
        { error: 'This study is not currently accepting responses' },
        { status: 403 }
      );
    }

    // Create the session
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .insert({
        study_id,
        study_type,
        interview_mode,
        participant_name: participant_name || null,
        participant_email: participant_email || null,
        language: language || null,
        current_section_index: 0,
        current_item_index: 0,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to create interview session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in start-session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
