import { NextRequest, NextResponse } from 'next/server';
import { validateInterviewSession } from '@/lib/api/validate-session';
import { rateLimit, getClientIp } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 30 requests per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`synthesize:${ip}`, { maxRequests: 30 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    );
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid or empty request body' },
        { status: 400 }
      );
    }
    const { text, voice_id, session_id, language } = body;

    // Require a valid interview session
    if (!(await validateInterviewSession(session_id))) {
      return NextResponse.json(
        { error: 'Invalid or missing session_id' },
        { status: 401 }
      );
    }

    if (!text || !voice_id) {
      return NextResponse.json(
        { error: 'text and voice_id are required' },
        { status: 400 }
      );
    }

    // Strip 'preset-' prefix — our DB stores preset voices as 'preset-<id>'
    // but ElevenLabs expects the raw voice ID
    const elevenLabsVoiceId = voice_id.replace(/^preset-/, '');

    // Use turbo model for English (low latency), multilingual for other languages
    const isEnglish = !language || language === "en" || language === "English";
    const modelId = isEnglish ? 'eleven_turbo_v2' : 'eleven_multilingual_v2';

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS error:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to synthesize speech' },
        { status: response.status }
      );
    }

    // Stream audio bytes back to client
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'X-ElevenLabs-Characters': text.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error in synthesize:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize speech' },
      { status: 500 }
    );
  }
}
