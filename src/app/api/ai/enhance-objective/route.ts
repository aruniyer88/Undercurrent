import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Input validation schema
const RequestSchema = z.object({
  field: z.enum(["objective", "context"]),
  objective: z.string().min(1, "Objective is required"),
  context: z.string().default(""),
  language: z.string().default("English"),
});

// Response type
export type EnhanceObjectiveResponse = {
  enhanced_text: string;
  tokens_used: number;
};

const OBJECTIVE_PROMPT = `You are a senior qualitative researcher specializing in AI-led interviews. Transform the user's rough research objective into a clear, structured objective an AI interviewer can use as its north star.

CONTEXT:
- Their research objective: {{objective}}
- Background context: {{context}}
- Interview language: {{language}}

Transform into a polished objective written in FIRST PERSON ("I want to understand...", "My goal is..."). Include:
1. Core research statement (1-3 sentences) with a precise action verb (Understand, Explore, Identify, Evaluate, Assess)
2. The target behavior or topic being investigated
3. 2-3 specific dimensions to explore (e.g., attitudes, barriers, motivations, unmet needs)
4. The intended insight or decision the findings will inform

Follow SMART criteria. Scope for a 10-15 minute AI-moderated interview.

ADAPTIVE LENGTH:
- Short input (<30 words): Expand to 100-200 words. Infer reasonable themes but don't fabricate specifics.
- Medium (30-150 words): Refine and enhance for clarity and structure. 100-200 words.
- Long (>150 words): Restructure and polish. Stay close to original length.

Write in natural paragraphs, not bullets. Professional but approachable. Do NOT add interview questions.
Respond with ONLY the enhanced objective text.`;

const CONTEXT_PROMPT = `You are a senior qualitative researcher specializing in AI-led interviews. Enrich the user's background context so an AI interviewer fully understands the research landscape.

CONTEXT:
- Their research objective: {{objective}}
- Their background context: {{context}}
- Interview language: {{language}}

Expand into rich research context covering:
1. Who is being interviewed — demographics, role, relationship to the topic
2. Why this research matters now — business context, triggers, decisions it will inform
3. Key themes the interviewer should explore and probe on
4. Tone and approach considerations — formality level, pacing, rapport-building
5. Sensitivities or areas to approach carefully (only if apparent from input)

ADAPTIVE LENGTH:
- Short input (<30 words): Expand to 100-200 words. Infer reasonable context but don't fabricate specifics.
- Medium (30-150 words): Refine and structure. 100-200 words.
- Long (>150 words): Restructure and polish. Stay close to original length.

Write in natural paragraphs, not bullets. Professional but approachable. Do NOT add interview questions.
Respond with ONLY the enhanced context text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedInput = RequestSchema.parse(body);

    const { field, objective, context, language } = validatedInput;

    // Select the appropriate prompt based on field
    const templatePrompt = field === "objective" ? OBJECTIVE_PROMPT : CONTEXT_PROMPT;

    const filledSystemPrompt = templatePrompt
      .replace("{{objective}}", objective)
      .replace("{{context}}", context)
      .replace("{{language}}", language);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: filledSystemPrompt },
        {
          role: "user",
          content: `Please enhance my research ${field} based on the context provided.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const tokensUsed = completion.usage?.total_tokens || 0;

    const response: EnhanceObjectiveResponse = {
      enhanced_text: content.trim(),
      tokens_used: tokensUsed,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error enhancing objective:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    // Check for timeout-like errors
    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        { error: "AI assistance is taking longer than expected. Please try again." },
        { status: 408 }
      );
    }

    // Check for rate limit errors
    if (error instanceof Error && (error.message.includes("rate") || error.message.includes("429"))) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. You can continue without AI assistance or try again." },
      { status: 500 }
    );
  }
}
