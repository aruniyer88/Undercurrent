"use client";

import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Study, VoiceProfile, VoiceStyleConfig } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  Play,
  Pause,
  Mic2,
  Upload,
  CheckCircle2,
  Volume2,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { VoiceRecorder } from "./voice-recorder";
import { RecordingLanguage, PresetVoice, ISO_TO_LANGUAGE_DISPLAY } from "@/lib/elevenlabs/types";

// Ref interface for wizard integration
export interface VoiceSetupRef {
  validate: () => boolean;
  getData: () => { selectedVoice: string | null; styleConfig: VoiceStyleConfig };
  isDirty: () => boolean;
  save: () => Promise<boolean>;
}

interface VoiceSetupProps {
  study: Study;
  presetVoices: PresetVoice[];
  customVoices: VoiceProfile[];
  // Embedded mode props (for wizard integration)
  embedded?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

type CloneMode = "select" | "upload" | "record";

export const VoiceSetup = forwardRef<VoiceSetupRef, VoiceSetupProps>(
  function VoiceSetup(
    {
      study,
      presetVoices,
      customVoices: initialCustomVoices,
      embedded = false,
      onValidationChange,
    },
    ref
  ) {
  const router = useRouter();
  const { toast } = useToast();
  const initialVoiceRef = useRef(study.voice_profile_id);

  const [selectedVoice, setSelectedVoice] = useState<string | null>(
    study.voice_profile_id
  );
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [customVoices, setCustomVoices] =
    useState<VoiceProfile[]>(initialCustomVoices);

  // Clone dialog state
  const [cloneMode, setCloneMode] = useState<CloneMode>("select");
  const [isCreatingClone, setIsCreatingClone] = useState(false);

  // Cloned voice preview state
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [clonedPreviewUrls, setClonedPreviewUrls] = useState<Map<string, string>>(new Map());

  // Audio refs for preview playback
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Default style configuration (kept for API compatibility)
  const defaultStyleConfig: VoiceStyleConfig = useMemo(() => ({
    tone: "neutral",
    pacing: "normal",
    dialect: "",
    keyPhrases: [],
  }), []);

  // Delete confirmation state
  const [deletingVoiceId, setDeletingVoiceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clone form state
  const [cloneForm, setCloneForm] = useState({
    name: "",
    consentConfirmed: false,
    files: [] as File[],
  });

  // Gender filter state
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");

  // Filter preset voices by gender only (language filtering now happens server-side)
  const filteredPresetVoices = presetVoices.filter((voice) => {
    if (genderFilter !== "all") {
      const voiceGender = voice.labels?.gender?.toLowerCase();
      if (voiceGender !== genderFilter) return false;
    }
    return true;
  });

  // Helper to get standardized description for tooltip
  const getVoiceTooltipDescription = (voice: PresetVoice): string => {
    const parts: string[] = [];
    if (voice.labels?.age) parts.push(voice.labels.age);
    if (voice.labels?.accent) parts.push(`${voice.labels.accent} accent`);
    if (voice.labels?.description) parts.push(voice.labels.description);
    if (voice.labels?.use_case) parts.push(`Best for ${voice.labels.use_case}`);
    return parts.length > 0 ? parts.join(". ") + "." : voice.description || "Professional voice for interviews.";
  };

  // Helper to get voice attribute badges
  const getVoiceAttributes = (voice: PresetVoice): string[] => {
    const attributes: string[] = [];
    if (voice.labels?.description) {
      // Extract keywords from description
      const desc = voice.labels.description.toLowerCase();
      if (desc.includes("professional")) attributes.push("Professional");
      if (desc.includes("casual") || desc.includes("friendly")) attributes.push("Casual");
      if (desc.includes("energetic") || desc.includes("dynamic")) attributes.push("Energetic");
      if (desc.includes("calm") || desc.includes("soothing")) attributes.push("Calm");
      if (desc.includes("warm")) attributes.push("Warm");
      if (desc.includes("authoritative")) attributes.push("Authoritative");
    }
    if (voice.labels?.use_case) {
      const useCase = voice.labels.use_case.toLowerCase();
      if (useCase.includes("narration")) attributes.push("Narration");
      if (useCase.includes("conversation")) attributes.push("Conversational");
    }
    // Limit to 2 attributes max
    return attributes.slice(0, 2);
  };

  // Handle audio preview for preset voices
  const handlePlayVoice = useCallback(
    (voiceId: string, previewUrl?: string | null) => {
      // Stop currently playing audio
      if (playingVoice && playingVoice !== voiceId) {
        const currentAudio = audioRefs.current.get(playingVoice);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      if (playingVoice === voiceId) {
        // Stop this audio
        const audio = audioRefs.current.get(voiceId);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        setPlayingVoice(null);
      } else if (previewUrl) {
        // Play preview audio
        let audio = audioRefs.current.get(voiceId);
        if (!audio) {
          audio = new Audio(previewUrl);
          audio.onended = () => setPlayingVoice(null);
          audio.onerror = () => {
            setPlayingVoice(null);
            toast({
              title: "Preview unavailable",
              description: "Unable to play voice preview.",
              variant: "destructive",
            });
          };
          audioRefs.current.set(voiceId, audio);
        }
        audio.play();
        setPlayingVoice(voiceId);
      } else {
        // No preview URL, show message
        toast({
          title: "Preview unavailable",
          description: "No preview available for this voice.",
        });
      }
    },
    [playingVoice, toast]
  );

  // Handle audio preview for cloned voices (generates TTS preview via API)
  const handlePlayClonedVoice = useCallback(
    async (voiceId: string, providerVoiceId: string) => {
      // Stop currently playing audio
      if (playingVoice && playingVoice !== voiceId) {
        const currentAudio = audioRefs.current.get(playingVoice);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      // If already playing this voice, stop it
      if (playingVoice === voiceId) {
        const audio = audioRefs.current.get(voiceId);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        setPlayingVoice(null);
        return;
      }

      // Check if we have a cached preview URL
      const cachedUrl = clonedPreviewUrls.get(voiceId);
      if (cachedUrl) {
        let audio = audioRefs.current.get(voiceId);
        if (!audio) {
          audio = new Audio(cachedUrl);
          audio.onended = () => setPlayingVoice(null);
          audio.onerror = () => {
            setPlayingVoice(null);
            toast({
              title: "Preview error",
              description: "Unable to play voice preview.",
              variant: "destructive",
            });
          };
          audioRefs.current.set(voiceId, audio);
        }
        audio.play();
        setPlayingVoice(voiceId);
        return;
      }

      // Generate preview via API
      setLoadingPreview(voiceId);
      try {
        const response = await fetch("/api/elevenlabs/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voice_id: providerVoiceId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate preview");
        }

        const { audio_url } = await response.json();

        // Cache the preview URL
        setClonedPreviewUrls((prev) => new Map(prev).set(voiceId, audio_url));

        // Play the audio
        const audio = new Audio(audio_url);
        audio.onended = () => setPlayingVoice(null);
        audio.onerror = () => {
          setPlayingVoice(null);
          toast({
            title: "Preview error",
            description: "Unable to play voice preview.",
            variant: "destructive",
          });
        };
        audioRefs.current.set(voiceId, audio);
        audio.play();
        setPlayingVoice(voiceId);
      } catch (error) {
        toast({
          title: "Preview failed",
          description:
            error instanceof Error ? error.message : "Unable to generate preview.",
          variant: "destructive",
        });
      } finally {
        setLoadingPreview(null);
      }
    },
    [playingVoice, clonedPreviewUrls, toast]
  );

  const handleDeleteClonedVoice = async () => {
    if (!deletingVoiceId) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/elevenlabs/clone", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice_profile_id: deletingVoiceId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete voice");
      }

      // Stop audio if playing this voice
      const audio = audioRefs.current.get(deletingVoiceId);
      if (audio) {
        audio.pause();
        audioRefs.current.delete(deletingVoiceId);
      }
      if (playingVoice === deletingVoiceId) {
        setPlayingVoice(null);
      }

      // Clear cached preview
      setClonedPreviewUrls((prev) => {
        const next = new Map(prev);
        next.delete(deletingVoiceId);
        return next;
      });

      // Remove from local state
      setCustomVoices((prev) => prev.filter((v) => v.id !== deletingVoiceId));

      // Deselect if this was the selected voice
      if (selectedVoice === deletingVoiceId) {
        setSelectedVoice(null);
      }

      toast({
        title: "Voice deleted",
        description: "The cloned voice has been removed.",
      });
    } catch (error) {
      toast({
        title: "Failed to delete voice",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingVoiceId(null);
    }
  };

  const handleSave = async () => {
    if (!selectedVoice) {
      toast({
        title: "Please select a voice",
        description: "Choose a voice for your AI interviewer.",
        variant: "destructive",
      });
      return;
    }

    if (!study?.id) {
      console.error("Cannot save: study ID is missing");
      toast({
        title: "Error saving",
        description: "Study information is missing. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      console.log("Saving voice profile:", { studyId: study.id, voiceId: selectedVoice });

      // Check if this is a preset voice (not a UUID)
      const isPresetVoice = !selectedVoice.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      let voiceProfileId = selectedVoice;

      if (isPresetVoice) {
        // Find the preset voice details
        const presetVoice = presetVoices.find(v => v.id === selectedVoice);
        if (!presetVoice) {
          throw new Error("Selected voice not found");
        }

        // Add shared voice to our ElevenLabs account (ensures TTS works)
        if (presetVoice.public_owner_id) {
          try {
            await fetch('/api/elevenlabs/add-voice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                public_owner_id: presetVoice.public_owner_id,
                voice_id: presetVoice.provider_voice_id,
                name: presetVoice.name,
              }),
            });
          } catch {
            // Non-fatal — TTS may still work without explicit add
            console.warn('Could not add shared voice to account, continuing...');
          }
        }

        // Check if a voice profile already exists for this preset voice
        // Note: This might fail with 406 due to RLS, which is okay - we'll just create a new one
        let existingProfile = null;
        try {
          const { data } = await supabase
            .from("voice_profiles")
            .select("id")
            .eq("provider_voice_id", selectedVoice)
            .eq("user_id", study.user_id)
            .maybeSingle();
          existingProfile = data;
        } catch {
          // Ignore RLS/permission errors, just create a new profile
          console.log("Could not check for existing profile, will create new one");
        }

        if (existingProfile) {
          voiceProfileId = existingProfile.id;
          console.log("Using existing voice profile:", voiceProfileId);
        } else {
          // Create a new voice profile for this preset voice
          const { data: newProfile, error: profileError } = await supabase
            .from("voice_profiles")
            .insert({
              user_id: study.user_id,
              name: presetVoice.name,
              type: "preset" as const,
              description: presetVoice.description || null,
              provider_voice_id: selectedVoice,
              style_config: defaultStyleConfig,
              consent_confirmed: true,
              consent_confirmed_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (profileError) throw profileError;
          if (!newProfile) throw new Error("Failed to create voice profile");

          voiceProfileId = newProfile.id;
          console.log("Created new voice profile:", voiceProfileId);
        }
      }

      // Update the study with the voice profile ID
      const { error } = await supabase
        .from("studies")
        .update({ voice_profile_id: voiceProfileId })
        .eq("id", study.id);

      if (error) throw error;

      console.log("Voice profile saved successfully");
      toast({
        title: "Voice saved",
        description: "Your voice configuration has been updated.",
      });
    } catch (error) {
      console.error("Error saving voice settings:", error);
      toast({
        title: "Error saving",
        description: error instanceof Error ? error.message : "Failed to save voice settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    await handleSave();
    router.push(`/studies/${study.id}/test`);
    router.refresh();
  };

  const handleBack = () => {
    router.push(`/studies/${study.id}/flow`);
    router.refresh();
  };

  // Check if form is valid (voice is selected)
  const isFormValid = selectedVoice !== null;

  // Check if form has been modified
  const isDirty = useCallback(() => {
    return selectedVoice !== initialVoiceRef.current;
  }, [selectedVoice]);

  // Report validation changes to parent (for wizard integration)
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFormValid);
    }
  }, [isFormValid, onValidationChange]);

  // Save function for wizard
  const saveVoice = useCallback(async (): Promise<boolean> => {
    if (!selectedVoice) {
      console.error("Cannot save: no voice selected");
      return false;
    }

    if (!study?.id) {
      console.error("Cannot save: study ID is missing");
      toast({
        title: "Error saving",
        description: "Study information is missing. Please try refreshing the page.",
        variant: "destructive",
      });
      return false;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      console.log("Saving voice profile:", { studyId: study.id, voiceId: selectedVoice });

      // Check if this is a preset voice (not a UUID)
      const isPresetVoice = !selectedVoice.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      let voiceProfileId = selectedVoice;

      if (isPresetVoice) {
        // Find the preset voice details
        const presetVoice = presetVoices.find(v => v.id === selectedVoice);
        if (!presetVoice) {
          throw new Error("Selected voice not found");
        }

        // Add shared voice to our ElevenLabs account (ensures TTS works)
        if (presetVoice.public_owner_id) {
          try {
            await fetch('/api/elevenlabs/add-voice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                public_owner_id: presetVoice.public_owner_id,
                voice_id: presetVoice.provider_voice_id,
                name: presetVoice.name,
              }),
            });
          } catch {
            console.warn('Could not add shared voice to account, continuing...');
          }
        }

        // Check if a voice profile already exists for this preset voice
        // Note: This might fail with 406 due to RLS, which is okay - we'll just create a new one
        let existingProfile = null;
        try {
          const { data } = await supabase
            .from("voice_profiles")
            .select("id")
            .eq("provider_voice_id", selectedVoice)
            .eq("user_id", study.user_id)
            .maybeSingle();
          existingProfile = data;
        } catch {
          // Ignore RLS/permission errors, just create a new profile
          console.log("Could not check for existing profile, will create new one");
        }

        if (existingProfile) {
          voiceProfileId = existingProfile.id;
          console.log("Using existing voice profile:", voiceProfileId);
        } else {
          // Create a new voice profile for this preset voice
          const { data: newProfile, error: profileError } = await supabase
            .from("voice_profiles")
            .insert({
              user_id: study.user_id,
              name: presetVoice.name,
              type: "preset" as const,
              description: presetVoice.description || null,
              provider_voice_id: selectedVoice,
              style_config: defaultStyleConfig,
              consent_confirmed: true,
              consent_confirmed_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (profileError) throw profileError;
          if (!newProfile) throw new Error("Failed to create voice profile");

          voiceProfileId = newProfile.id;
          console.log("Created new voice profile:", voiceProfileId);
        }
      }

      // Update the study with the voice profile ID
      const { error } = await supabase
        .from("studies")
        .update({ voice_profile_id: voiceProfileId })
        .eq("id", study.id);

      if (error) throw error;

      console.log("Voice profile saved successfully");
      return true;
    } catch (error) {
      console.error("Error saving voice settings:", error);
      toast({
        title: "Error saving",
        description: error instanceof Error ? error.message : "Failed to save voice settings. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [selectedVoice, study?.id, study?.user_id, presetVoices, defaultStyleConfig, toast]);

  // Expose methods to parent via ref (for wizard integration)
  useImperativeHandle(ref, () => ({
    validate: () => isFormValid,
    getData: () => ({ selectedVoice, styleConfig: defaultStyleConfig }),
    isDirty,
    save: saveVoice,
  }), [isFormValid, selectedVoice, defaultStyleConfig, isDirty, saveVoice]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Validate file sizes (max 10MB each)
      const validFiles = newFiles.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });
      setCloneForm((prev) => ({
        ...prev,
        files: [...prev.files, ...validFiles],
      }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setCloneForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleCreateCloneFromFiles = async () => {
    if (
      !cloneForm.name ||
      !cloneForm.consentConfirmed ||
      cloneForm.files.length === 0
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and upload voice samples.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingClone(true);

    try {
      const formData = new FormData();
      formData.append("name", cloneForm.name);
      cloneForm.files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/elevenlabs/clone", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create voice clone");
      }

      const { voice } = await response.json();

      toast({
        title: "Voice clone created",
        description: "Your voice clone is ready to use.",
      });

      // Add to custom voices list
      setCustomVoices((prev) => [voice, ...prev]);

      // Select the new voice
      setSelectedVoice(voice.id);

      // Close dialog and reset form
      setShowCloneDialog(false);
      resetCloneForm();
    } catch (error) {
      toast({
        title: "Failed to create voice clone",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingClone(false);
    }
  };

  const handleRecordingComplete = async (
    blob: Blob,
    language: RecordingLanguage
  ) => {
    if (!cloneForm.name || !cloneForm.consentConfirmed) {
      toast({
        title: "Missing information",
        description: "Please fill in voice name first.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingClone(true);

    try {
      // Convert blob to file
      const file = new File([blob], `voice-recording-${Date.now()}.webm`, {
        type: blob.type,
      });

      const formData = new FormData();
      formData.append("name", cloneForm.name);
      formData.append(
        "description",
        `Recorded voice clone in ${language}`
      );
      formData.append("files", file);

      const response = await fetch("/api/elevenlabs/clone", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create voice clone");
      }

      const { voice } = await response.json();

      toast({
        title: "Voice clone created",
        description: "Your voice clone is ready to use.",
      });

      // Add to custom voices list
      setCustomVoices((prev) => [voice, ...prev]);

      // Select the new voice
      setSelectedVoice(voice.id);

      // Close dialog and reset form
      setShowCloneDialog(false);
      resetCloneForm();
    } catch (error) {
      toast({
        title: "Failed to create voice clone",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingClone(false);
    }
  };

  const resetCloneForm = () => {
    setCloneForm({
      name: "",
      consentConfirmed: false,
      files: [],
    });
    setCloneMode("select");
  };

  const handleCloseDialog = () => {
    setShowCloneDialog(false);
    resetCloneForm();
  };

  return (
    <div className={cn(embedded ? "" : "min-h-screen")} style={embedded ? {} : { backgroundColor: '#fafafa' }}>
      {/* Header - Hidden in embedded mode */}
      {!embedded && (
        <div className="sticky top-16 z-40 bg-white border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-lg font-semibold text-neutral-900">
                    Voice Setup
                  </h1>
                  <p className="text-sm text-neutral-500">
                    Choose the voice for your AI interviewer
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button
                  onClick={handleContinue}
                  className="bg-primary-600 hover:bg-primary-700"
                  disabled={!selectedVoice}
                >
                  Continue to Test
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn(embedded ? "" : "max-w-5xl mx-auto px-6 py-8")}>
        <Tabs defaultValue="preset" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="preset" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Preset Voices
            </TabsTrigger>
            <TabsTrigger value="clone" className="flex items-center gap-2">
              <Mic2 className="w-4 h-4" />
              Voice Cloning
            </TabsTrigger>
          </TabsList>

          {/* Preset Voices Tab */}
          <TabsContent value="preset" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-neutral-600">
                Select from our pre-built voices optimized for research interviews.
                {study.language && study.language !== "English" && (
                  <span className="text-primary-600 ml-1">
                    Showing voices suitable for {study.language}.
                  </span>
                )}
              </p>

              {/* Gender Filter Chips */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 mr-1">Filter:</span>
                {(["all", "male", "female"] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setGenderFilter(gender)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                      genderFilter === gender
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    {gender === "all" ? "All" : gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <TooltipProvider>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredPresetVoices.map((voice, index) => {
                  const attributes = getVoiceAttributes(voice);
                  const primaryAttribute = attributes[0] || "Conversational";
                  // Generate consistent gradient colors based on voice index/name
                  const gradients = [
                    "from-pink-400 via-purple-400 to-pink-300",
                    "from-emerald-400 via-teal-400 to-emerald-300",
                    "from-amber-400 via-orange-400 to-yellow-300",
                    "from-blue-400 via-indigo-400 to-blue-300",
                    "from-rose-400 via-pink-400 to-rose-300",
                    "from-cyan-400 via-sky-400 to-cyan-300",
                  ];
                  const gradientClass = gradients[index % gradients.length];

                  return (
                    <Tooltip key={voice.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "relative rounded-xl border p-4 cursor-pointer transition-all",
                            selectedVoice === voice.id
                              ? "border-primary-500 bg-primary-50/50 shadow-sm"
                              : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                          )}
                          onClick={() => setSelectedVoice(voice.id)}
                        >
                          {selectedVoice === voice.id && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle2 className="w-4 h-4 text-primary-600" />
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            {/* Abstract avatar with play overlay */}
                            <div className="relative flex-shrink-0">
                              <div className={cn(
                                "w-10 h-10 rounded-full bg-gradient-to-br",
                                gradientClass
                              )}>
                                {/* Abstract shape overlay */}
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                  <div className="absolute top-1/2 left-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
                                </div>
                              </div>
                              {/* Play button overlay */}
                              <button
                                className={cn(
                                  "absolute inset-0 flex items-center justify-center rounded-full transition-opacity",
                                  "bg-black/40 opacity-0 hover:opacity-100",
                                  playingVoice === voice.id && "opacity-100 bg-black/50"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayVoice(voice.id, voice.preview_url);
                                }}
                              >
                                {playingVoice === voice.id ? (
                                  <Pause className="w-4 h-4 text-white" />
                                ) : (
                                  <Play className="w-4 h-4 text-white ml-0.5" />
                                )}
                              </button>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm text-neutral-900 truncate">
                                {voice.name}
                              </h3>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {primaryAttribute}
                              </p>
                              {/* Language indicator */}
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] text-neutral-400">
                                  {ISO_TO_LANGUAGE_DISPLAY[voice.language || ""]?.flag || "\u{1F310}"}{" "}
                                  {ISO_TO_LANGUAGE_DISPLAY[voice.language || ""]?.label || voice.language || "English"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{getVoiceTooltipDescription(voice)}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>

            {filteredPresetVoices.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <p>No voices match your current filters.</p>
                <button
                  onClick={() => setGenderFilter("all")}
                  className="text-primary-600 hover:underline mt-2"
                >
                  Clear filters
                </button>
              </div>
            )}
          </TabsContent>

          {/* Voice Cloning Tab */}
          <TabsContent value="clone" className="space-y-6">
            {/* Custom Voices List - Show first if exists */}
            {customVoices.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">
                  Your Voice Clones
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {customVoices.map((voice, index) => {
                    const cloneGradients = [
                      "from-violet-400 via-purple-400 to-violet-300",
                      "from-fuchsia-400 via-pink-400 to-fuchsia-300",
                      "from-indigo-400 via-blue-400 to-indigo-300",
                    ];
                    const gradientClass = cloneGradients[index % cloneGradients.length];

                    return (
                      <div
                        key={voice.id}
                        className={cn(
                          "relative rounded-xl border p-4 cursor-pointer transition-all",
                          selectedVoice === voice.id
                            ? "border-primary-500 bg-primary-50/50 shadow-sm"
                            : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                        )}
                        onClick={() => setSelectedVoice(voice.id)}
                      >
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          {selectedVoice === voice.id && (
                            <CheckCircle2 className="w-4 h-4 text-primary-600" />
                          )}
                          <button
                            className="p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingVoiceId(voice.id);
                            }}
                            title="Delete voice clone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Abstract avatar with play overlay */}
                          <div className="relative flex-shrink-0">
                            <div className={cn(
                              "w-10 h-10 rounded-full bg-gradient-to-br",
                              gradientClass
                            )}>
                              <div className="absolute inset-0 rounded-full overflow-hidden">
                                <div className="absolute top-1/2 left-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
                              </div>
                            </div>
                            {/* Play button overlay */}
                            <button
                              className={cn(
                                "absolute inset-0 flex items-center justify-center rounded-full transition-opacity",
                                "bg-black/40 opacity-0 hover:opacity-100",
                                (playingVoice === voice.id || loadingPreview === voice.id) && "opacity-100 bg-black/50"
                              )}
                              disabled={loadingPreview === voice.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (voice.provider_voice_id) {
                                  handlePlayClonedVoice(voice.id, voice.provider_voice_id);
                                }
                              }}
                            >
                              {loadingPreview === voice.id ? (
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                              ) : playingVoice === voice.id ? (
                                <Pause className="w-4 h-4 text-white" />
                              ) : (
                                <Play className="w-4 h-4 text-white ml-0.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-neutral-900 truncate">
                              {voice.name}
                            </h3>
                            <p className="text-xs text-neutral-500 mt-0.5 truncate">
                              {voice.description || "Custom voice"}
                            </p>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-100 text-accent-700 mt-1">
                              Cloned
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Create New Clone Section */}
            <div className={cn(
              "rounded-xl p-4 border border-dashed",
              customVoices.length > 0
                ? "border-neutral-300 bg-neutral-50/50"
                : "border-primary-300 bg-primary-50/50"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  customVoices.length > 0
                    ? "bg-neutral-200"
                    : "bg-primary-100"
                )}>
                  <Plus className={cn(
                    "w-5 h-5",
                    customVoices.length > 0 ? "text-neutral-500" : "text-primary-600"
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-neutral-900">
                    {customVoices.length > 0 ? "Add another voice" : "Clone your voice"}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Use your voice or a team leader&apos;s voice
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={customVoices.length > 0 ? "outline" : "default"}
                  className={cn(
                    customVoices.length === 0 && "bg-primary-600 hover:bg-primary-700"
                  )}
                  onClick={() => setShowCloneDialog(true)}
                >
                  <Mic2 className="w-4 h-4 mr-1.5" />
                  Create
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingVoiceId} onOpenChange={() => setDeletingVoiceId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete voice clone?</DialogTitle>
            <DialogDescription>
              This will permanently remove the cloned voice from your account. Any studies using this voice will need a new voice assigned.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeletingVoiceId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDeleteClonedVoice}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog open={showCloneDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Voice Clone</DialogTitle>
            <DialogDescription>
              {cloneMode === "select"
                ? "Choose how you want to create your voice clone."
                : cloneMode === "upload"
                ? "Upload audio samples to create a custom voice."
                : "Record your voice to create a custom voice clone."}
            </DialogDescription>
          </DialogHeader>

          {/* Mode Selection */}
          {cloneMode === "select" && (
            <div className="space-y-4 py-4">
              <button
                className="w-full p-4 border-2 border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-all text-left"
                onClick={() => setCloneMode("record")}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Mic2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-900">
                      Record Your Voice
                    </h4>
                    <p className="text-sm text-neutral-500 mt-1">
                      Read a paragraph aloud for 30 seconds to create your voice
                      clone.
                    </p>
                  </div>
                </div>
              </button>

              <button
                className="w-full p-4 border-2 border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-all text-left"
                onClick={() => setCloneMode("upload")}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-900">
                      Upload Audio Files
                    </h4>
                    <p className="text-sm text-neutral-500 mt-1">
                      Upload existing audio files (MP3, WAV, M4A) of your voice.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* File Upload Mode */}
          {cloneMode === "upload" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Voice Name</Label>
                <Input
                  value={cloneForm.name}
                  onChange={(e) =>
                    setCloneForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., My Voice, CEO Voice"
                />
              </div>

              <div className="space-y-2">
                <Label>Voice Samples</Label>
                <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600 mb-2">
                    Upload audio files (MP3, WAV, M4A)
                  </p>
                  <p className="text-xs text-neutral-500 mb-3">
                    Recommended: 30 seconds to 2 minutes of clear speech
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="voice-upload"
                  />
                  <label htmlFor="voice-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span>Choose Files</span>
                    </Button>
                  </label>
                </div>

                {/* File list */}
                {cloneForm.files.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {cloneForm.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-neutral-700 truncate">
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-lg">
                <Checkbox
                  id="consent"
                  checked={cloneForm.consentConfirmed}
                  onCheckedChange={(checked) =>
                    setCloneForm((prev) => ({
                      ...prev,
                      consentConfirmed: checked as boolean,
                    }))
                  }
                />
                <label htmlFor="consent" className="text-sm text-neutral-700">
                  I confirm that I have explicit consent from the voice owner to
                  create and use this voice clone for research interviews.
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCloneMode("select")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateCloneFromFiles}
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                  disabled={
                    !cloneForm.consentConfirmed ||
                    !cloneForm.name ||
                    cloneForm.files.length === 0 ||
                    isCreatingClone
                  }
                >
                  {isCreatingClone ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Voice Clone"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Record Mode */}
          {cloneMode === "record" && (
            <div className="space-y-4 py-4">
              {/* Name and owner inputs at top */}
              <div className="space-y-4 pb-4 border-b border-neutral-200">
                <div className="space-y-2">
                  <Label>Voice Name</Label>
                  <Input
                    value={cloneForm.name}
                    onChange={(e) =>
                      setCloneForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g., My Voice, CEO Voice"
                  />
                </div>

                <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-lg">
                  <Checkbox
                    id="consent-record"
                    checked={cloneForm.consentConfirmed}
                    onCheckedChange={(checked) =>
                      setCloneForm((prev) => ({
                        ...prev,
                        consentConfirmed: checked as boolean,
                      }))
                    }
                  />
                  <label
                    htmlFor="consent-record"
                    className="text-sm text-neutral-700"
                  >
                    I confirm that I have explicit consent from the voice owner
                    to create and use this voice clone.
                  </label>
                </div>
              </div>

              {/* Voice recorder component */}
              {cloneForm.name &&
              cloneForm.consentConfirmed ? (
                <VoiceRecorder
                  onRecordingComplete={handleRecordingComplete}
                  onCancel={() => setCloneMode("select")}
                />
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <p>Please fill in the voice name and confirm consent above to start recording.</p>
                  <Button
                    variant="outline"
                    onClick={() => setCloneMode("select")}
                    className="mt-4"
                  >
                    Back
                  </Button>
                </div>
              )}

              {/* Loading overlay */}
              {isCreatingClone && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600">
                      Creating your voice clone...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});
