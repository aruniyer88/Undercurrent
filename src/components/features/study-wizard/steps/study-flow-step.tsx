"use client";

import { forwardRef, useState, useEffect } from "react";
import {
  StudyFlowBuilder,
  StudyFlowBuilderRef,
} from "@/components/features/study-flow-builder";
import { StepRef, StepContentProps } from "../wizard-types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Study, StudyFlow, FlowSection, FlowItem } from "@/lib/types/database";

export const StudyFlowStepContent = forwardRef<StepRef, StepContentProps>(
  function StudyFlowStepContent({ studyId, onValidationChange }, ref) {
    const { toast } = useToast();
    const [study, setStudy] = useState<Study | null>(null);
    const [existingFlow, setExistingFlow] = useState<StudyFlow | null>(null);
    const [existingSections, setExistingSections] = useState<
      (FlowSection & { items: FlowItem[] })[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load study and flow data
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

          // Load existing flow
          const { data: flowData } = await supabase
            .from("study_flows")
            .select("*")
            .eq("study_id", studyId)
            .maybeSingle();

          setExistingFlow(flowData);

          // Load sections with items if flow exists
          if (flowData) {
            const { data: sectionsData } = await supabase
              .from("flow_sections")
              .select("*, flow_items(*)")
              .eq("study_flow_id", flowData.id)
              .order("display_order");

            if (sectionsData) {
              const sectionsWithItems = sectionsData.map((section) => ({
                ...section,
                items: (section.flow_items || []).sort(
                  (a: FlowItem, b: FlowItem) => a.display_order - b.display_order
                ),
              }));
              setExistingSections(sectionsWithItems);
            }
          }
        } catch (error) {
          console.error("Error loading study flow data:", error);
          toast({
            title: "Error loading data",
            description: "Failed to load study flow data. Please try again.",
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
          <p>Please complete the Project Basics step first.</p>
        </div>
      );
    }

    return (
      <StudyFlowBuilder
        ref={ref as React.Ref<StudyFlowBuilderRef>}
        study={study}
        existingFlow={existingFlow}
        existingSections={existingSections}
        embedded={true}
        onValidationChange={onValidationChange}
      />
    );
  }
);
