import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit, getClientIp } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 5 completions per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`complete-session:${ip}`, { maxRequests: 5 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const { session_id, distribution_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Mark session as complete
    const { error: sessionError } = await supabase
      .from('interview_sessions')
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (sessionError) {
      console.error('Failed to complete session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to complete session' },
        { status: 500 }
      );
    }

    // Increment distribution response count if applicable
    if (distribution_id) {
      const { error: distError } = await supabase.rpc(
        'increment_distribution_responses',
        { dist_id: distribution_id }
      );

      if (distError) {
        // Non-critical — log but don't fail
        console.error('Failed to increment distribution count:', distError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in complete-session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
