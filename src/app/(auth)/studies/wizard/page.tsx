"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { WizardPage } from "@/components/features/study-wizard/wizard-page";

function WizardPageContent() {
  const searchParams = useSearchParams();
  const studyId = searchParams.get("studyId") || undefined;
  const stepParam = searchParams.get("step");
  const initialStep = stepParam ? parseInt(stepParam, 10) : 1;

  return (
    <WizardPage
      studyId={studyId}
      initialStep={initialStep}
    />
  );
}

export default function StudyWizardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fafafa' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    }>
      <WizardPageContent />
    </Suspense>
  );
}
