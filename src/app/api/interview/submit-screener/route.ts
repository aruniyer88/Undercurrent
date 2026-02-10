import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit, getClientIp } from '@/lib/api/rate-limit';

interface ScreenerAnswer {
  screener_question_id: string;
  answer: string;
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 screener submissions per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`submit-screener:${ip}`, { maxRequests: 10 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const { session_id, answers } = body as {
      session_id: string;
      answers: ScreenerAnswer[];
    };

    if (!session_id || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'session_id and answers are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch the screener questions to evaluate answers
    // First get the study_id from the session
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('study_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { data: questions, error: questionsError } = await supabase
      .from('screener_questions')
      .select('id, qualifying_answers, is_required')
      .eq('study_id', session.study_id);

    if (questionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch screener questions' },
        { status: 500 }
      );
    }

    const questionMap = new Map(
      (questions || []).map((q) => [q.id, q])
    );

    // Evaluate each answer and build responses
    let allPassed = true;
    const responses = answers.map((a) => {
      const question = questionMap.get(a.screener_question_id);
      const passed = question
        ? question.qualifying_answers.length === 0 ||
          question.qualifying_answers.includes(a.answer)
        : true;

      if (!passed) allPassed = false;

      return {
        session_id,
        screener_question_id: a.screener_question_id,
        answer: a.answer,
        passed,
      };
    });

    // Insert all responses
    const { error: insertError } = await supabase
      .from('screener_responses')
      .insert(responses);

    if (insertError) {
      console.error('Failed to insert screener responses:', insertError);
      return NextResponse.json(
        { error: 'Failed to save screener responses' },
        { status: 500 }
      );
    }

    // If screened out, fetch redirect URL
    let redirectUrl: string | null = null;
    if (!allPassed) {
      const { data: dist } = await supabase
        .from('distributions')
        .select('redirect_screenout_url')
        .eq('study_id', session.study_id)
        .eq('is_active', true)
        .maybeSingle();

      redirectUrl = dist?.redirect_screenout_url || null;
    }

    return NextResponse.json({
      passed: allPassed,
      redirect_url: redirectUrl,
    });
  } catch (error) {
    console.error('Error in submit-screener:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
