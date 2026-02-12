import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VoiceSetup } from "@/components/features/voice-setup";
import { Study, VoiceProfile } from "@/lib/types/database";
import { PresetVoice, STUDY_LANGUAGE_TO_ISO } from "@/lib/elevenlabs/types";

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
    labels: { accent: "American", age: "young" },
    language: "en",
    public_owner_id: "",
  },
  {
    id: "preset-AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    type: "preset",
    description: "American, young, expressive and confident",
    provider_voice_id: "AZnzlk1XvdvUeBnXmlld",
    preview_url: null,
    labels: { accent: "American", age: "young" },
    language: "en",
    public_owner_id: "",
  },
  {
    id: "preset-EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    type: "preset",
    description: "American, young, soft and warm",
    provider_voice_id: "EXAVITQu4vr4xnSDxMaL",
    preview_url: null,
    labels: { accent: "American", age: "young" },
    language: "en",
    public_owner_id: "",
  },
  {
    id: "preset-pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    type: "preset",
    description: "American, middle-aged, deep and authoritative",
    provider_voice_id: "pNInz6obpgDQGcFmaJgB",
    preview_url: null,
    labels: { accent: "American", age: "middle-aged" },
    language: "en",
    public_owner_id: "",
  }
];

async function fetchPresetVoices(language: string = "en"): Promise<PresetVoice[]> {
  try {
    // Fetch from our API route (which calls ElevenLabs)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/elevenlabs/voices?language=${language}`, {
      next: { revalidate: 86400 }, // Cache for 24 hours (per-language via unique URL)
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

  // Fetch study first (need language for voice filtering)
  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("*")
    .eq("id", id)
    .single();

  if (studyError || !study) {
    notFound();
  }

  // Fetch preset voices with study language
  const langCode = STUDY_LANGUAGE_TO_ISO[study.language || "English"] || "en";
  const presetVoices = await fetchPresetVoices(langCode);

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

