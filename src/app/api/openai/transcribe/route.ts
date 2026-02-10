import { NextRequest, NextResponse } from 'next/server';
import { validateInterviewSession } from '@/lib/api/validate-session';
import { rateLimit, getClientIp } from '@/lib/api/rate-limit';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB (Whisper API limit)

export async function POST(request: NextRequest) {
  // Rate limit: 30 requests per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`transcribe:${ip}`, { maxRequests: 30 });
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
    const formData = await request.formData();

    // Validate session
    const sessionId = formData.get('session_id') as string | null;
    if (!(await validateInterviewSession(sessionId))) {
      return NextResponse.json(
        { error: 'Invalid or missing session_id' },
        { status: 401 }
      );
    }

    const audioFile = formData.get('audio') as File | null;

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json(
        { error: 'audio file is required and must not be empty' },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: 'Audio file exceeds 25 MB limit' },
        { status: 400 }
      );
    }

    // Re-create the blob with explicit type to preserve MIME across the proxy.
    // MediaRecorder typically produces audio/webm;codecs=opus — Whisper accepts webm.
    const arrayBuffer = await audioFile.arrayBuffer();
    const fileType = audioFile.type || 'audio/webm';
    const extension = fileType.includes('mp4') ? 'mp4'
      : fileType.includes('ogg') ? 'ogg'
      : 'webm';
    const blob = new Blob([arrayBuffer], { type: fileType });

    // Forward to OpenAI Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', blob, `recording.${extension}`);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('response_format', 'json');

    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper transcription error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to transcribe audio' },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      text: result.text,
    });
  } catch (error) {
    console.error('Error in transcribe:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
