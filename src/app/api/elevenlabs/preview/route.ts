import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PREVIEW_TEXT =
  "Hello, this is a preview of my voice. I hope you like how I sound. This voice can be used for conducting research interviews.";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { voice_id } = body;

    if (!voice_id) {
      return NextResponse.json(
        { error: "voice_id is required" },
        { status: 400 }
      );
    }

    // Call ElevenLabs Text-to-Speech API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: PREVIEW_TEXT,
          model_id: "eleven_multilingual_v2",
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
      console.error("ElevenLabs TTS error:", errorText);

      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401 }
        );
      }
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Voice not found. It may have been deleted." },
          { status: 404 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Failed to generate voice preview" },
        { status: response.status }
      );
    }

    // Get audio as array buffer and convert to base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({
      audio_url: audioDataUrl,
    });
  } catch (error) {
    console.error("Error generating voice preview:", error);
    return NextResponse.json(
      { error: "Failed to generate voice preview" },
      { status: 500 }
    );
  }
}
