import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ElevenLabsCloneResponse } from "@/lib/elevenlabs/types";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const ownerName = formData.get("ownerName") as string;
    const description = formData.get("description") as string | null;
    const files = formData.getAll("files") as File[];

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Voice name is required" },
        { status: 400 }
      );
    }

    if (!ownerName || ownerName.trim().length === 0) {
      return NextResponse.json(
        { error: "Voice owner name is required" },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "At least one audio file is required" },
        { status: 400 }
      );
    }

    // Validate file sizes (max 10MB each)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 10MB` },
          { status: 400 }
        );
      }
    }

    // Prepare form data for ElevenLabs API
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append("name", name.trim());

    if (description) {
      elevenLabsFormData.append("description", description.trim());
    }

    // Add audio files
    for (const file of files) {
      elevenLabsFormData.append("files", file);
    }

    // Enable background noise removal for better quality
    elevenLabsFormData.append("remove_background_noise", "true");

    // Call ElevenLabs IVC (Instant Voice Clone) API
    const elevenLabsResponse = await fetch(
      "https://api.elevenlabs.io/v1/voices/add",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
        body: elevenLabsFormData,
      }
    );

    if (!elevenLabsResponse.ok) {
      const error = await elevenLabsResponse.json();
      console.error("ElevenLabs clone error:", error);

      // Map ElevenLabs errors to user-friendly messages
      const errorMessage = mapElevenLabsError(error);
      return NextResponse.json(
        { error: errorMessage },
        { status: elevenLabsResponse.status }
      );
    }

    const cloneResult: ElevenLabsCloneResponse =
      await elevenLabsResponse.json();

    // Save to voice_profiles table
    const { data: voiceProfile, error: dbError } = await supabase
      .from("voice_profiles")
      .insert({
        user_id: user.id,
        name: name.trim(),
        type: "cloned",
        description: description?.trim() || `${ownerName}'s cloned voice`,
        provider_voice_id: cloneResult.voice_id,
        consent_confirmed: true,
        consent_owner_name: ownerName.trim(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error saving voice profile:", dbError);
      return NextResponse.json(
        { error: "Failed to save voice profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      voice: voiceProfile,
    });
  } catch (error) {
    console.error("Error creating voice clone:", error);
    return NextResponse.json(
      { error: "Failed to create voice clone" },
      { status: 500 }
    );
  }
}

function mapElevenLabsError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const detail = (error as { detail?: { message?: string; status?: string } })
      .detail;

    if (detail?.status === "quota_exceeded") {
      return "Voice clone limit reached. Please upgrade your ElevenLabs plan.";
    }

    if (detail?.status === "invalid_api_key") {
      return "Configuration error. Please contact support.";
    }

    if (detail?.message?.includes("audio")) {
      return "Audio file could not be processed. Please try different audio.";
    }

    if (detail?.message) {
      return detail.message;
    }
  }

  return "Failed to create voice clone. Please try again.";
}
