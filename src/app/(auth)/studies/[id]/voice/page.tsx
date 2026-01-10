import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VoiceSetup } from "@/components/features/voice-setup";
import { Study, VoiceProfile } from "@/lib/types/database";

interface VoiceSetupPageProps {
  params: Promise<{ id: string }>;
}

// Preset voices (would come from ElevenLabs in production)
const PRESET_VOICES: Partial<VoiceProfile>[] = [
  {
    id: "preset-1",
    name: "Alex",
    type: "preset",
    description: "Warm and friendly, conversational tone",
    provider_voice_id: "21m00Tcm4TlvDq8ikWAM",
    style_config: { tone: "warm", pacing: "normal" }
  },
  {
    id: "preset-2", 
    name: "Morgan",
    type: "preset",
    description: "Professional and clear, neutral delivery",
    provider_voice_id: "AZnzlk1XvdvUeBnXmlld",
    style_config: { tone: "neutral", pacing: "normal" }
  },
  {
    id: "preset-3",
    name: "Jamie",
    type: "preset",
    description: "Enthusiastic and energetic, upbeat style",
    provider_voice_id: "EXAVITQu4vr4xnSDxMaL",
    style_config: { tone: "warm", pacing: "fast" }
  },
  {
    id: "preset-4",
    name: "Sam",
    type: "preset",
    description: "Calm and reassuring, measured pace",
    provider_voice_id: "pNInz6obpgDQGcFmaJgB",
    style_config: { tone: "neutral", pacing: "slow" }
  }
];

export default async function VoiceSetupPage({ params }: VoiceSetupPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Fetch study
  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("*")
    .eq("id", id)
    .single();

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
      presetVoices={PRESET_VOICES as VoiceProfile[]}
      customVoices={(customVoices as VoiceProfile[]) || []}
    />
  );
}

