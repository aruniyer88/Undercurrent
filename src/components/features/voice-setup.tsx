"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  DialogFooter,
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
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceSetupProps {
  study: Study;
  presetVoices: VoiceProfile[];
  customVoices: VoiceProfile[];
}

export function VoiceSetup({ study, presetVoices, customVoices }: VoiceSetupProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedVoice, setSelectedVoice] = useState<string | null>(study.voice_profile_id);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  
  // Style configuration for selected voice
  const [styleConfig, setStyleConfig] = useState<VoiceStyleConfig>({
    tone: "neutral",
    pacing: "normal",
    dialect: "",
    keyPhrases: []
  });
  
  // Clone form state
  const [cloneForm, setCloneForm] = useState({
    name: "",
    ownerName: "",
    consentConfirmed: false,
    files: [] as File[]
  });

  const handlePlayVoice = (voiceId: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      // Would stop audio here
    } else {
      setPlayingVoice(voiceId);
      // Simulate audio playback
      setTimeout(() => setPlayingVoice(null), 3000);
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
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCloneForm(prev => ({
        ...prev,
        files: [...prev.files, ...Array.from(e.target.files!)]
      }));
    }
  };

  const handleCreateClone = async () => {
    if (!cloneForm.name || !cloneForm.ownerName || !cloneForm.consentConfirmed || cloneForm.files.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and upload voice samples.",
        variant: "destructive",
      });
      return;
    }

    // Simulate clone creation
    toast({
      title: "Voice clone initiated",
      description: "Your voice clone is being processed. This may take a few minutes.",
    });
    setShowCloneDialog(false);
    
    // Reset form
    setCloneForm({
      name: "",
      ownerName: "",
      consentConfirmed: false,
      files: []
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/studies/${study.id}/guide`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
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
              Select from our pre-built voices optimized for research interviews.
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
                      <h3 className="font-semibold text-neutral-900">{voice.name}</h3>
                      <p className="text-sm text-neutral-500 mt-1">{voice.description}</p>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVoice(voice.id);
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
                  <h3 className="font-semibold text-neutral-900">Clone Your Voice</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Create a custom voice that sounds like you or a team leader. 
                    This helps participants feel more comfortable and increases completion rates.
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
                <h3 className="font-medium text-neutral-900">Your Voice Clones</h3>
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
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900">{voice.name}</h3>
                          <p className="text-sm text-neutral-500 mt-1">
                            {voice.consent_owner_name}&apos;s voice
                          </p>
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
            <h3 className="font-semibold text-neutral-900 mb-4">Style Configuration</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select 
                  value={styleConfig.tone} 
                  onValueChange={(value) => setStyleConfig(prev => ({ ...prev, tone: value as VoiceStyleConfig["tone"] }))}
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
                  onValueChange={(value) => setStyleConfig(prev => ({ ...prev, pacing: value as VoiceStyleConfig["pacing"] }))}
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
                  onChange={(e) => setStyleConfig(prev => ({ ...prev, dialect: e.target.value }))}
                  placeholder="e.g., American English, British English"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Key Phrases (comma-separated)</Label>
                <Input
                  value={styleConfig.keyPhrases?.join(", ")}
                  onChange={(e) => setStyleConfig(prev => ({ ...prev, keyPhrases: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                  placeholder="e.g., you know, absolutely, tell me more"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clone Dialog */}
      <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Voice Clone</DialogTitle>
            <DialogDescription>
              Upload audio samples to create a custom voice. We recommend at least 30 seconds of clear speech.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Voice Name</Label>
              <Input
                value={cloneForm.name}
                onChange={(e) => setCloneForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., My Voice, CEO Voice"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Voice Owner Name</Label>
              <Input
                value={cloneForm.ownerName}
                onChange={(e) => setCloneForm(prev => ({ ...prev, ownerName: e.target.value }))}
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
                {cloneForm.files.length > 0 && (
                  <p className="text-sm text-primary-600 mt-2">
                    {cloneForm.files.length} file(s) selected
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-4 bg-warning-50 rounded-lg">
              <Checkbox
                id="consent"
                checked={cloneForm.consentConfirmed}
                onCheckedChange={(checked) => 
                  setCloneForm(prev => ({ ...prev, consentConfirmed: checked as boolean }))
                }
              />
              <label htmlFor="consent" className="text-sm text-neutral-700">
                I confirm that I have explicit consent from the voice owner to create 
                and use this voice clone for research interviews.
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloneDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateClone}
              className="bg-primary-600 hover:bg-primary-700"
              disabled={!cloneForm.consentConfirmed || !cloneForm.name || cloneForm.files.length === 0}
            >
              Create Voice Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

