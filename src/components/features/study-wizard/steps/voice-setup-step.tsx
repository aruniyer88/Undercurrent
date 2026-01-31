"use client";

import { forwardRef, useState, useEffect } from "react";
import { VoiceSetup, VoiceSetupRef } from "@/components/features/voice-setup";
import { StepRef, StepContentProps } from "../wizard-types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Study, VoiceProfile } from "@/lib/types/database";
import { PresetVoice } from "@/lib/elevenlabs/types";

export const VoiceSetupStepContent = forwardRef<StepRef, StepContentProps>(
  function VoiceSetupStepContent({ studyId, onValidationChange }, ref) {
    const { toast } = useToast();
    const [study, setStudy] = useState<Study | null>(null);
    const [presetVoices, setPresetVoices] = useState<PresetVoice[]>([]);
    const [customVoices, setCustomVoices] = useState<VoiceProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load study and voice data
    useEffect(() => {
      if (!studyId) {
        setIsLoading(false);
        return;
      }

      const loadData = async () => {
        const supabase = createClient();

        try {
          // Load study
          const { data: studyData, error: studyError } = await supabase
            .from("studies")
            .select("*")
            .eq("id", studyId)
            .single();

          if (studyError) throw studyError;
          setStudy(studyData);

          // Load preset voices from API
          const voicesResponse = await fetch("/api/elevenlabs/voices");
          if (voicesResponse.ok) {
            const voicesData = await voicesResponse.json();
            setPresetVoices(voicesData.voices || []);
          }

          // Load custom voices for user
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data: customVoicesData } = await supabase
              .from("voice_profiles")
              .select("*")
              .eq("user_id", user.id)
              .eq("type", "cloned");

            if (customVoicesData) {
              setCustomVoices(customVoicesData);
            }
          }
        } catch (error) {
          console.error("Error loading voice setup data:", error);
          toast({
            title: "Error loading data",
            description: "Failed to load voice setup data. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }, [studyId, toast]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      );
    }

    if (!study) {
      return (
        <div className="text-center py-12 text-text-muted">
          <p>Please complete the previous steps first.</p>
        </div>
      );
    }

    return (
      <VoiceSetup
        ref={ref as React.Ref<VoiceSetupRef>}
        study={study}
        presetVoices={presetVoices}
        customVoices={customVoices}
        embedded={true}
        onValidationChange={onValidationChange}
      />
    );
  }
);
