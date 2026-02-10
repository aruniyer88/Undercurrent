import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Input validation schema
const RequestSchema = z.object({
  projectBasics: z.object({
    title: z.string().min(1),
    objective: z.string().min(10),
    audience: z.string().min(10),
    aboutInterviewer: z.string().optional(),
    language: z.string().optional(),
  }),
  studyType: z.enum(["structured", "streaming"]).default("structured"),
  additionalDetails: z.string().optional(),
});

const buildSystemPrompt = (studyType: "structured" | "streaming") => {
  const isStreaming = studyType === "streaming";

  const itemTypesSection = isStreaming
    ? `3. ITEMS - FOR STREAMING CONVERSATIONS, ONLY USE THESE TYPES:
   - open_ended: Exploratory questions that invite detailed responses
   - ai_conversation: Free-form AI-led conversation. Specify duration (30-300 seconds) and basis
   - instruction: Text displayed to guide participants (use sparingly, for transitions or setup)

   CRITICAL: Do NOT use single_select, multi_select, rating_scale, or ranking for streaming conversations.`
    : `3. ITEMS can be any of these types:
   - open_ended: Exploratory questions that invite detailed responses
   - single_select: When you need participants to choose ONE option from a list
   - multi_select: When participants can choose MULTIPLE options
   - rating_scale: For satisfaction, agreement, likelihood, etc. (5-10 point scales)
   - ranking: When order/priority matters. Provide 3-7 items to rank
   - instruction: Text displayed to guide participants (use sparingly, for transitions or setup)
   - ai_conversation: Free-form AI-led conversation. Specify duration (30-300 seconds) and basis`;

  const guidelinesSection = isStreaming
    ? `GUIDELINES FOR STREAMING CONVERSATIONS:
- Start with easier/warm-up questions, build to more substantive ones
- Focus on open-ended questions that encourage natural conversation
- Use ai_conversation items for deep exploration of themes
- Keep the total interview to roughly 10-20 minutes (8-15 items total)
- Default to voice response mode for all open-ended questions
- Avoid structured question types - this is meant to be a natural, flowing conversation`
    : `GUIDELINES FOR STRUCTURED INTERVIEWS:
- Start with easier/warm-up questions, build to more substantive ones
- Use a mix of question types appropriate to the research goals
- For sensitive topics, use open-ended questions with careful probing
- Keep the total interview to roughly 10-20 minutes (12-18 items total)
- Add an AI conversation section if deep exploration of themes would be valuable
- Default to voice response mode for open-ended questions
- Default to screen response mode for select/scale questions`;

  const exampleItems = isStreaming
    ? `        {
          "type": "open_ended",
          "questionText": "string",
          "probingMode": "auto",
          "responseMode": "voice"
        },
        {
          "type": "instruction",
          "content": "string"
        },
        {
          "type": "ai_conversation",
          "durationSeconds": 120,
          "basis": "prior_answers",
          "customInstructions": ""
        }`
    : `        {
          "type": "open_ended",
          "questionText": "string",
          "probingMode": "auto",
          "responseMode": "voice"
        },
        {
          "type": "single_select",
          "questionText": "string",
          "options": ["Option 1", "Option 2"],
          "responseMode": "screen"
        },
        {
          "type": "multi_select",
          "questionText": "string",
          "options": ["Option 1", "Option 2"],
          "responseMode": "screen"
        },
        {
          "type": "rating_scale",
          "questionText": "string",
          "scaleSize": 5,
          "lowLabel": "Not at all",
          "highLabel": "Extremely",
          "responseMode": "screen"
        },
        {
          "type": "ranking",
          "questionText": "string",
          "items": ["Item 1", "Item 2", "Item 3"]
        },
        {
          "type": "instruction",
          "content": "string"
        },
        {
          "type": "ai_conversation",
          "durationSeconds": 120,
          "basis": "prior_answers",
          "customInstructions": ""
        }`;

  return `You are an expert qualitative research designer. Create a complete interview flow structure for an AI-led interview study.

STUDY TYPE: ${studyType === "streaming" ? "STREAMING CONVERSATION" : "STRUCTURED INTERVIEW"}

YOUR TASK:
Design a complete interview flow that will achieve the research objective. Output a ${isStreaming ? "streaming conversation" : "structured interview"} including:

1. WELCOME SCREEN
   - A welcome message that sets expectations and establishes a warm tone (2-4 sentences)

2. SECTIONS (typically 2-4 sections)
   For each section, provide items within the section (3-6 items per section)

${itemTypesSection}

${guidelinesSection}

OUTPUT FORMAT:
Return valid JSON matching this exact schema:
{
  "welcomeScreen": {
    "message": "string"
  },
  "sections": [
    {
      "title": "Section 1",
      "items": [
${exampleItems}
      ]
    }
  ]
}

Return ONLY the JSON, no markdown formatting or explanation.`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RequestSchema.parse(body);

    const { projectBasics, studyType, additionalDetails } = validated;

    const userPrompt = `
PROJECT CONTEXT:
- Project Name: ${projectBasics.title}
- Objective: ${projectBasics.objective}
- Target Audience: ${projectBasics.audience}
${projectBasics.aboutInterviewer ? `- Interviewer Context: ${projectBasics.aboutInterviewer}` : ""}
${projectBasics.language ? `- Language: ${projectBasics.language}` : ""}
${additionalDetails ? `\nADDITIONAL DETAILS/RESEARCH PLAN:\n${additionalDetails}` : ""}

Generate a complete study flow that will help achieve these research objectives.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt(studyType) },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const parsed = JSON.parse(content);

    // Basic validation of structure
    if (!parsed.welcomeScreen || !parsed.sections) {
      throw new Error("Invalid response structure from AI");
    }

    return NextResponse.json({
      ...parsed,
      tokensUsed: completion.usage?.total_tokens || 0,
    });
  } catch (error) {
    console.error("Error generating study flow:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        { error: "AI generation timed out. Please try again." },
        { status: 408 }
      );
    }

    if (
      error instanceof Error &&
      (error.message.includes("rate") || error.message.includes("429"))
    ) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate study flow. Please try again." },
      { status: 500 }
    );
  }
}
