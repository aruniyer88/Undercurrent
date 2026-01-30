import { NextResponse } from "next/server";
import {
  ElevenLabsVoicesResponse,
  PresetVoice,
} from "@/lib/elevenlabs/types";

// Cache preset voices for 24 hours (they rarely change)
export const revalidate = 86400;

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch preset/premade voices from ElevenLabs v2 API
    const response = await fetch(
      "https://api.elevenlabs.io/v2/voices?category=premade&page_size=10",
      {
        headers: {
          "xi-api-key": apiKey,
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("ElevenLabs API error:", error);
      return NextResponse.json(
        { error: "Failed to fetch voices from ElevenLabs" },
        { status: response.status }
      );
    }

    const data: ElevenLabsVoicesResponse = await response.json();

    // Transform to our PresetVoice format
    const presetVoices: PresetVoice[] = data.voices.map((voice) => ({
      id: `preset-${voice.voice_id}`,
      name: voice.name,
      type: "preset" as const,
      description: voice.description || getDescriptionFromLabels(voice.labels),
      provider_voice_id: voice.voice_id,
      preview_url: voice.preview_url,
      labels: voice.labels,
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

// Helper to generate description from labels if description is missing
function getDescriptionFromLabels(labels: Record<string, string>): string {
  const parts: string[] = [];

  if (labels.gender) {
    parts.push(labels.gender);
  }
  if (labels.age) {
    parts.push(labels.age);
  }
  if (labels.accent) {
    parts.push(`${labels.accent} accent`);
  }
  if (labels.description) {
    parts.push(labels.description);
  }
  if (labels.use_case) {
    parts.push(`Good for ${labels.use_case}`);
  }

  return parts.length > 0
    ? parts.join(", ")
    : "Professional voice for interviews";
}
