import { NextResponse } from "next/server";

/**
 * Adds a shared voice from the ElevenLabs Voice Library to our account.
 * This ensures the voice is accessible for TTS during interviews.
 * Non-fatal: if it fails (409 = already added, etc.), we return success anyway.
 */
export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { public_owner_id, voice_id, name } = await request.json();

    if (!public_owner_id || !voice_id) {
      return NextResponse.json(
        { error: "public_owner_id and voice_id are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/voices/add/${public_owner_id}/${voice_id}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_name: name || "Shared Voice" }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ voice_id: data.voice_id });
    }

    // 409 = already added, treat as success
    if (response.status === 409) {
      return NextResponse.json({ voice_id });
    }

    // Other errors are non-fatal — log but return success
    const errorText = await response.text();
    console.warn(
      `Failed to add shared voice ${voice_id} (${response.status}):`,
      errorText
    );
    return NextResponse.json({ voice_id });
  } catch (error) {
    console.warn("Error adding shared voice:", error);
    // Non-fatal — return success so the caller can continue
    return NextResponse.json({ voice_id: null });
  }
}
