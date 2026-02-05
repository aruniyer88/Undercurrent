import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studyId, participantId, itemId } = await request.json();

    if (!studyId || !participantId || !itemId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Generate unique session ID
    const sessionId = crypto.randomUUID();

    // Create temporary storage path for chunks
    const sessionPath = `temp/${studyId}/${participantId}/${sessionId}`;

    return NextResponse.json({
      sessionId,
      sessionPath,
      uploadEndpoint: "/api/videos/upload-chunk",
    });
  } catch (error) {
    console.error("Error starting video session:", error);
    return NextResponse.json(
      { error: "Failed to start session" },
      { status: 500 }
    );
  }
}
