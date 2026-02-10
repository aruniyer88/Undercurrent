import { createServiceClient } from '@/lib/supabase/service';

/**
 * Validates that a session_id corresponds to an active interview session.
 * Uses the service role client (bypasses RLS) since participants are anonymous.
 */
export async function validateInterviewSession(
  sessionId: unknown
): Promise<boolean> {
  if (!sessionId || typeof sessionId !== 'string') return false;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('id')
    .eq('id', sessionId)
    .single();

  return !error && !!data;
}
