"use client";

import { BriefChatCompact } from "@/components/features/brief-chat-compact";

export function DashboardContent() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-canvas p-6">
      <div className="max-w-[800px] mx-auto">
        {/* Chat Input - Create new study */}
        <BriefChatCompact />
      </div>
    </div>
  );
}
