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

    const {
      sessionId,
      studyId,
      participantId,
      itemId,
      totalChunks,
      totalDuration,
      answerStartOffset,
      answerEndOffset,
      format,
      resolution,
    } = await request.json();

    if (
      !sessionId ||
      !studyId ||
      !participantId ||
      !itemId ||
      totalChunks === undefined
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

    // Download all chunks
    const chunks: Blob[] = [];
    const chunkPromises = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `temp/${studyId}/${participantId}/${sessionId}/chunk_${i.toString().padStart(6, "0")}.webm`;
      chunkPromises.push(
        supabase.storage.from("interview-videos").download(chunkPath)
      );
    }

    const chunkResults = await Promise.all(chunkPromises);

    for (const { data, error } of chunkResults) {
      if (error) {
        console.error("Failed to download chunk:", error);
        return NextResponse.json(
          { error: "Failed to download chunks" },
          { status: 500 }
        );
      }
      if (data) {
        chunks.push(data);
      }
    }

    // Assemble chunks into single video
    const assembledVideo = new Blob(chunks, { type: "video/webm" });

    // Upload final video
    const timestamp = Date.now();
    const finalPath = `${studyId}/${participantId}/${itemId}_${timestamp}.webm`;

    const { error: uploadError } = await supabase.storage
      .from("interview-videos")
      .upload(finalPath, assembledVideo, {
        contentType: "video/webm",
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Failed to upload final video:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload final video" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl: videoUrl },
    } = supabase.storage.from("interview-videos").getPublicUrl(finalPath);

    // Generate thumbnail (placeholder - would need video processing library)
    // For now, we'll just use a placeholder or skip thumbnail generation
    const thumbnailUrl = null;

    // Clean up temporary chunks
    const deletePromises = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `temp/${studyId}/${participantId}/${sessionId}/chunk_${i.toString().padStart(6, "0")}.webm`;
      deletePromises.push(
        supabase.storage.from("interview-videos").remove([chunkPath])
      );
    }
    await Promise.all(deletePromises);

    // Save metadata to flow_responses
    const { error: responseError } = await supabase
      .from("flow_responses")
      .insert({
        study_id: studyId,
        participant_id: participantId,
        flow_item_id: itemId,
        video_url: videoUrl,
        video_thumbnail_url: thumbnailUrl,
        video_duration_seconds: Math.floor(totalDuration / 1000),
        video_format: format || "webm",
        video_resolution: resolution || "unknown",
        video_start_timestamp: new Date().toISOString(),
        video_end_timestamp: new Date().toISOString(),
        video_start_offset_ms: answerStartOffset || 0,
        video_end_offset_ms: answerEndOffset || totalDuration,
      });

    if (responseError) {
      console.error("Failed to save response metadata:", responseError);
      // Don't fail the request - video is already uploaded
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      thumbnailUrl,
    });
  } catch (error) {
    console.error("Error finalizing video:", error);
    return NextResponse.json(
      { error: "Finalization failed" },
      { status: 500 }
    );
  }
}
