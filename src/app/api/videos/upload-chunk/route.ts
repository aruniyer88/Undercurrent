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

    const formData = await request.formData();
    const chunk = formData.get("chunk") as Blob;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const sessionId = formData.get("sessionId") as string;
    const studyId = formData.get("studyId") as string;
    const participantId = formData.get("participantId") as string;

    if (
      !chunk ||
      isNaN(chunkIndex) ||
      !sessionId ||
      !studyId ||
      !participantId
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify user has access to this study
    const { data: study, error: studyError } = await supabase
      .from("studies")
      .select("id, user_id")
      .eq("id", studyId)
      .single();

    if (studyError || !study || study.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Upload chunk to temporary storage
    const chunkPath = `temp/${studyId}/${participantId}/${sessionId}/chunk_${chunkIndex.toString().padStart(6, "0")}.webm`;

    const { error: uploadError } = await supabase.storage
      .from("interview-videos")
      .upload(chunkPath, chunk, {
        contentType: "video/webm",
        upsert: false,
      });

    if (uploadError) {
      console.error(`Chunk ${chunkIndex} upload failed:`, uploadError);
      return NextResponse.json(
        { error: "Chunk upload failed", chunkIndex },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, chunkIndex });
  } catch (error) {
    console.error("Error uploading chunk:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
