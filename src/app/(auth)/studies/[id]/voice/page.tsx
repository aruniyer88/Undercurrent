import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VoiceSetup } from "@/components/features/voice-setup";
import { Study, VoiceProfile } from "@/lib/types/database";
import { PresetVoice } from "@/lib/elevenlabs/types";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface VoiceSetupPageProps {
  params: Promise<{ id: string }>;
}

// Fallback preset voices in case API fails
const FALLBACK_PRESET_VOICES: PresetVoice[] = [
  {
    id: "preset-21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    type: "preset",
    description: "American, young, calm and conversational",
    provider_voice_id: "21m00Tcm4TlvDq8ikWAM",
    preview_url: null,
    labels: { accent: "American", age: "young" }
  },
  {
    id: "preset-AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    type: "preset",
    description: "American, young, expressive and confident",
    provider_voice_id: "AZnzlk1XvdvUeBnXmlld",
    preview_url: null,
    labels: { accent: "American", age: "young" }
  },
  {
    id: "preset-EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    type: "preset",
    description: "American, young, soft and warm",
    provider_voice_id: "EXAVITQu4vr4xnSDxMaL",
    preview_url: null,
    labels: { accent: "American", age: "young" }
  },
  {
    id: "preset-pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    type: "preset",
    description: "American, middle-aged, deep and authoritative",
    provider_voice_id: "pNInz6obpgDQGcFmaJgB",
    preview_url: null,
    labels: { accent: "American", age: "middle-aged" }
  }
];

async function fetchPresetVoices(): Promise<PresetVoice[]> {
  try {
    // Fetch from our API route (which calls ElevenLabs)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/elevenlabs/voices`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      console.error("Failed to fetch preset voices:", response.status);
      return FALLBACK_PRESET_VOICES;
    }

    const data = await response.json();
    return data.voices || FALLBACK_PRESET_VOICES;
  } catch (error) {
    console.error("Error fetching preset voices:", error);
    return FALLBACK_PRESET_VOICES;
  }
}

export default async function VoiceSetupPage({ params }: VoiceSetupPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch study and preset voices in parallel
  const [studyResult, presetVoices] = await Promise.all([
    supabase.from("studies").select("*").eq("id", id).single(),
    fetchPresetVoices()
  ]);

  const { data: study, error: studyError } = studyResult;

  if (studyError || !study) {
    notFound();
  }

  // Fetch user's custom voice profiles
  const { data: customVoices } = await supabase
    .from("voice_profiles")
    .select("*")
    .eq("type", "cloned")
    .order("created_at", { ascending: false });

  return (
    <VoiceSetup
      study={study as Study}
      presetVoices={presetVoices}
      customVoices={(customVoices as VoiceProfile[]) || []}
    />
  );
}

