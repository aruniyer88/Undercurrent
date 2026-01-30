"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Study, VoiceProfile, VoiceStyleConfig } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { VoiceRecorder } from "./voice-recorder";
import { RecordingLanguage, PresetVoice } from "@/lib/elevenlabs/types";

interface VoiceSetupProps {
  study: Study;
  presetVoices: PresetVoice[];
  customVoices: VoiceProfile[];
}

type CloneMode = "select" | "upload" | "record";

export function VoiceSetup({
  study,
  presetVoices,
  customVoices: initialCustomVoices,
}: VoiceSetupProps) {
  const router = useRouter();
  const { toast } = useToast();

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

  // Style configuration for selected voice
  const [styleConfig, setStyleConfig] = useState<VoiceStyleConfig>({
    tone: "neutral",
    pacing: "normal",
    dialect: "",
    keyPhrases: [],
  });

  // Clone form state
  const [cloneForm, setCloneForm] = useState({
    name: "",
    ownerName: "",
    consentConfirmed: false,
    files: [] as File[],
  });

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

  const handleSave = async () => {
    if (!selectedVoice) {
      toast({
        title: "Please select a voice",
        description: "Choose a voice for your AI interviewer.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("studies")
        .update({ voice_profile_id: selectedVoice })
        .eq("id", study.id);

      if (error) throw error;

      toast({
        title: "Voice saved",
        description: "Your voice configuration has been updated.",
      });
    } catch {
      toast({
        title: "Error saving",
        description: "Failed to save voice settings. Please try again.",
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
      !cloneForm.ownerName ||
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
      formData.append("ownerName", cloneForm.ownerName);
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
    if (!cloneForm.name || !cloneForm.ownerName || !cloneForm.consentConfirmed) {
      toast({
        title: "Missing information",
        description: "Please fill in voice name and owner name first.",
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
      formData.append("ownerName", cloneForm.ownerName);
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
      ownerName: "",
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
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

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="preset" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="preset">Preset Voices</TabsTrigger>
            <TabsTrigger value="clone">Voice Cloning</TabsTrigger>
          </TabsList>

          {/* Preset Voices Tab */}
          <TabsContent value="preset" className="space-y-6">
            <p className="text-sm text-neutral-600">
              Select from our pre-built voices optimized for research
              interviews.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {presetVoices.map((voice) => (
                <div
                  key={voice.id}
                  className={cn(
                    "relative rounded-xl border-2 p-5 cursor-pointer transition-all",
                    selectedVoice === voice.id
                      ? "border-primary-500 bg-primary-50/50"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  )}
                  onClick={() => setSelectedVoice(voice.id)}
                >
                  {selectedVoice === voice.id && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-primary-600" />
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                      <Volume2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900">
                        {voice.name}
                      </h3>
                      <p className="text-sm text-neutral-500 mt-1">
                        {voice.description}
                      </p>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVoice(voice.id, voice.preview_url);
                        }}
                      >
                        {playingVoice === voice.id ? (
                          <>
                            <Pause className="w-4 h-4 mr-1" />
                            Playing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Preview
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Voice Cloning Tab */}
          <TabsContent value="clone" className="space-y-6">
            <div className="bg-primary-50 rounded-xl p-6 border border-primary-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Mic2 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    Clone Your Voice
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Create a custom voice that sounds like you or a team leader.
                    This helps participants feel more comfortable and increases
                    completion rates.
                  </p>
                  <Button
                    className="mt-4 bg-primary-600 hover:bg-primary-700"
                    onClick={() => setShowCloneDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Voice Clone
                  </Button>
                </div>
              </div>
            </div>

            {/* Custom Voices List */}
            {customVoices.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">
                  Your Voice Clones
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {customVoices.map((voice) => (
                    <div
                      key={voice.id}
                      className={cn(
                        "relative rounded-xl border-2 p-5 cursor-pointer transition-all",
                        selectedVoice === voice.id
                          ? "border-primary-500 bg-primary-50/50"
                          : "border-neutral-200 bg-white hover:border-neutral-300"
                      )}
                      onClick={() => setSelectedVoice(voice.id)}
                    >
                      {selectedVoice === voice.id && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className="w-5 h-5 text-primary-600" />
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center flex-shrink-0">
                          <Mic2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-neutral-900">
                            {voice.name}
                          </h3>
                          <p className="text-sm text-neutral-500 mt-1">
                            {voice.consent_owner_name}&apos;s voice
                          </p>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 h-8"
                            disabled={loadingPreview === voice.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (voice.provider_voice_id) {
                                handlePlayClonedVoice(voice.id, voice.provider_voice_id);
                              }
                            }}
                          >
                            {loadingPreview === voice.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Loading...
                              </>
                            ) : playingVoice === voice.id ? (
                              <>
                                <Pause className="w-4 h-4 mr-1" />
                                Playing...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                Preview
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Style Configuration */}
        {selectedVoice && (
          <div className="mt-8 bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">
              Style Configuration
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select
                  value={styleConfig.tone}
                  onValueChange={(value) =>
                    setStyleConfig((prev) => ({
                      ...prev,
                      tone: value as VoiceStyleConfig["tone"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warm">Warm & Friendly</SelectItem>
                    <SelectItem value="neutral">Neutral & Professional</SelectItem>
                    <SelectItem value="direct">Direct & Concise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pacing</Label>
                <Select
                  value={styleConfig.pacing}
                  onValueChange={(value) =>
                    setStyleConfig((prev) => ({
                      ...prev,
                      pacing: value as VoiceStyleConfig["pacing"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow & Measured</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Fast & Energetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dialect/Accent Notes</Label>
                <Input
                  value={styleConfig.dialect}
                  onChange={(e) =>
                    setStyleConfig((prev) => ({
                      ...prev,
                      dialect: e.target.value,
                    }))
                  }
                  placeholder="e.g., American English, British English"
                />
              </div>

              <div className="space-y-2">
                <Label>Key Phrases (comma-separated)</Label>
                <Input
                  value={styleConfig.keyPhrases?.join(", ")}
                  onChange={(e) =>
                    setStyleConfig((prev) => ({
                      ...prev,
                      keyPhrases: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="e.g., you know, absolutely, tell me more"
                />
              </div>
            </div>
          </div>
        )}
      </div>

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
                <Label>Voice Owner Name</Label>
                <Input
                  value={cloneForm.ownerName}
                  onChange={(e) =>
                    setCloneForm((prev) => ({
                      ...prev,
                      ownerName: e.target.value,
                    }))
                  }
                  placeholder="Who does this voice belong to?"
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
                    !cloneForm.ownerName ||
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

                <div className="space-y-2">
                  <Label>Voice Owner Name</Label>
                  <Input
                    value={cloneForm.ownerName}
                    onChange={(e) =>
                      setCloneForm((prev) => ({
                        ...prev,
                        ownerName: e.target.value,
                      }))
                    }
                    placeholder="Who does this voice belong to?"
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
              cloneForm.ownerName &&
              cloneForm.consentConfirmed ? (
                <VoiceRecorder
                  onRecordingComplete={handleRecordingComplete}
                  onCancel={() => setCloneMode("select")}
                />
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <p>Please fill in the voice name, owner name, and confirm consent above to start recording.</p>
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
}
