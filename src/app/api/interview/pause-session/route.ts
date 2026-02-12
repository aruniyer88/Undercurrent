import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit, getClientIp } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`pause-session:${ip}`, { maxRequests: 10 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const { session_id, current_section_index, current_item_index } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const updateData: Record<string, unknown> = {
      session_status: 'paused',
      paused_at: new Date().toISOString(),
    };

    if (current_section_index !== undefined) {
      updateData.current_section_index = current_section_index;
    }
    if (current_item_index !== undefined) {
      updateData.current_item_index = current_item_index;
    }

    // Increment pause_count
    const { data: session, error } = await supabase
      .from('interview_sessions')
      .update(updateData)
      .eq('id', session_id)
      .select()
      .single();

    if (error) {
      console.error('Failed to pause session:', error);
      return NextResponse.json({ error: 'Failed to pause session' }, { status: 500 });
    }

    // Increment pause_count separately (can't do atomic increment in update)
    try {
      await supabase.rpc('increment_pause_count', { sid: session_id });
    } catch {
      // Non-critical — the function may not exist yet before migration
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error in pause-session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
