import { NextResponse } from "next/server";
import {
  ElevenLabsSharedVoicesResponse,
  PresetVoice,
} from "@/lib/elevenlabs/types";

export async function GET(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const language = searchParams.get("language") || "en";

  try {
    // Try with use_cases filter first for higher quality conversational voices
    let voices = await fetchSharedVoices(apiKey, language, true);

    // Fallback: if fewer than 6 results, retry without use_cases filter
    if (voices.length < 6) {
      voices = await fetchSharedVoices(apiKey, language, false);
    }

    // Transform to our PresetVoice format
    const presetVoices: PresetVoice[] = voices.map((voice) => ({
      id: `preset-${voice.voice_id}`,
      name: voice.name,
      type: "preset" as const,
      description: getDescriptionFromSharedVoice(voice),
      provider_voice_id: voice.voice_id,
      preview_url: voice.preview_url || null,
      labels: {
        ...(voice.gender && { gender: voice.gender }),
        ...(voice.age && { age: voice.age }),
        ...(voice.accent && { accent: voice.accent }),
        ...(voice.descriptive && { description: voice.descriptive }),
        ...(voice.use_case && { use_case: voice.use_case }),
      },
      language,
      public_owner_id: voice.public_owner_id,
    }));

    return NextResponse.json({ voices: presetVoices });
  } catch (error) {
    console.error("Error fetching ElevenLabs voices:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 }
    );
  }
}

async function fetchSharedVoices(
  apiKey: string,
  language: string,
  useConversationalFilter: boolean
) {
  const params = new URLSearchParams({
    language,
    page_size: "20",
  });
  if (useConversationalFilter) {
    params.set("use_cases", "conversational");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/shared-voices?${params.toString()}`,
    {
      headers: { "xi-api-key": apiKey },
      next: { revalidate: 86400 }, // Cache per unique URL (per-language) for 24h
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("ElevenLabs shared-voices error:", response.status, error);
    return [];
  }

  const data: ElevenLabsSharedVoicesResponse = await response.json();
  return data.voices || [];
}

function getDescriptionFromSharedVoice(voice: {
  gender?: string;
  age?: string;
  accent?: string;
  descriptive?: string;
  use_case?: string;
}): string {
  const parts: string[] = [];
  if (voice.gender) parts.push(voice.gender);
  if (voice.age) parts.push(voice.age);
  if (voice.accent) parts.push(`${voice.accent} accent`);
  if (voice.descriptive) parts.push(voice.descriptive);
  if (voice.use_case) parts.push(`Good for ${voice.use_case}`);
  return parts.length > 0 ? parts.join(", ") : "Professional voice for interviews";
}
