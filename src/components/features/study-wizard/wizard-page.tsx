"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardProvider } from "./wizard-context";
import { WizardSidebar } from "./wizard-sidebar";
import { WizardContent } from "./wizard-content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WizardPageProps {
  studyId?: string;
  initialStep?: number;
}

export function WizardPage({
  studyId,
  initialStep = 1,
}: WizardPageProps) {
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Handle close - navigate to dashboard
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowConfirmClose(true);
    } else {
      router.push("/dashboard");
    }
  }, [hasUnsavedChanges, router]);

  // Handle confirmed close (discard changes)
  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false);
    setHasUnsavedChanges(false);
    router.push("/dashboard");
  }, [router]);

  // Warn before browser close/navigate if unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <>
      {/* Blocking overlay - prevents AppSidebar hover when over wizard area */}
      <div
        className="fixed left-[60px] top-0 right-0 bottom-0 z-[60]"
        style={{ pointerEvents: 'none' }}
      />

      <div className="min-h-screen grid grid-cols-[240px_1fr] relative z-[70]" style={{ backgroundColor: '#fafafa' }}>
        <WizardProvider
          initialStudyId={studyId}
          initialStep={initialStep}
          onClose={handleClose}
        >
          {/* Sidebar - sticky on left */}
          <div className="h-screen sticky top-0">
            <WizardSidebar />
          </div>

          {/* Main content area - scrollable */}
          <div className="min-h-screen flex flex-col">
            <WizardContent onUnsavedChanges={setHasUnsavedChanges} />
          </div>
        </WizardProvider>
      </div>

      {/* Confirm close dialog */}
      <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave?
              Your progress will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmClose(false)}
            >
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmClose}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
