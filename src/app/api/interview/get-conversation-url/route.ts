import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ensureStudyAgent } from '@/lib/elevenlabs/agents';

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { study_id } = body;

    if (!study_id) {
      return NextResponse.json(
        { error: 'study_id is required' },
        { status: 400 }
      );
    }

    // Look up the study's dedicated agent
    const supabase = createServiceClient();
    const { data: study, error: studyError } = await supabase
      .from('studies')
      .select('elevenlabs_agent_id')
      .eq('id', study_id)
      .single();

    if (studyError || !study) {
      return NextResponse.json(
        { error: 'Study not found' },
        { status: 404 }
      );
    }

    // Create agent JIT if missing (e.g. test interviews before publish)
    let agentId = study.elevenlabs_agent_id;
    if (!agentId) {
      agentId = await ensureStudyAgent(study_id);
    }

    // Get a signed URL for this study's agent
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs signed URL error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to get conversation URL' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      signed_url: data.signed_url,
    });
  } catch (error) {
    console.error('Error in get-conversation-url:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
