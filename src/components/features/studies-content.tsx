"use client";

import { useState } from "react";
import { Study, StudyStatus } from "@/lib/types/database";
import { StudyCard } from "@/components/features/study-card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle2, Radio, Archive } from "lucide-react";

interface StudiesContentProps {
  studies: Study[];
}

const statusConfig: Record<StudyStatus, { label: string; icon: React.ElementType; className: string }> = {
  draft: { label: "Draft", icon: FileText, className: "badge-draft" },
  ready_for_test: { label: "Ready to Test", icon: Clock, className: "badge-ready" },
  tested: { label: "Tested", icon: CheckCircle2, className: "badge-tested" },
  live: { label: "Live", icon: Radio, className: "badge-live" },
  closed: { label: "Closed", icon: Archive, className: "badge-closed" },
};

export function StudiesContent({ studies }: StudiesContentProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Filter studies by status
  const filteredStudies = activeTab === "all" 
    ? studies 
    : studies.filter(s => s.status === activeTab);

  // Count studies by status
  const statusCounts = studies.reduce((acc, study) => {
    acc[study.status] = (acc[study.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-[calc(100vh-56px)] p-6" style={{ backgroundColor: '#fafafa' }}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-h1 text-text-primary">Your Studies</h1>
          {studies.length > 0 && (
            <p className="text-body text-text-muted mt-1">
              {studies.length} {studies.length === 1 ? "study" : "studies"} total
            </p>
          )}
        </div>

        {/* Studies Section */}
        <div className="bg-surface border border-border-subtle rounded-lg shadow-sm">
          {studies.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-surface-alt flex items-center justify-center">
                <FileText className="w-8 h-8 text-icon-default" />
              </div>
              <p className="text-body-strong text-text-primary mb-1">No studies yet</p>
              <p className="text-body text-text-muted">
                Go to Home to create your first study
              </p>
            </div>
          ) : (
            <>
              {/* Filter Tabs */}
              <div className="px-4 pt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-9 bg-surface-alt border border-border-subtle">
                    <TabsTrigger value="all" className="text-caption h-8">
                      All
                      {studies.length > 0 && (
                        <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[11px]">
                          {studies.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="draft" className="text-caption h-8">
                      Draft
                      {statusCounts.draft && (
                        <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[11px]">
                          {statusCounts.draft}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="live" className="text-caption h-8">
                      Live
                      {statusCounts.live && (
                        <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[11px]">
                          {statusCounts.live}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="tested" className="text-caption h-8">
                      Tested
                      {statusCounts.tested && (
                        <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[11px]">
                          {statusCounts.tested}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="closed" className="text-caption h-8">
                      Closed
                      {statusCounts.closed && (
                        <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[11px]">
                          {statusCounts.closed}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Studies Grid */}
              <div className="p-4">
                {filteredStudies.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-body text-text-muted">
                      No studies with this status
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudies.map((study) => (
                      <StudyCard 
                        key={study.id} 
                        study={study}
                        statusConfig={statusConfig[study.status]}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

