import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Input validation schema
const RequestSchema = z.object({
  about_interviewer: z.string().min(20, "About interviewer must be at least 20 characters"),
  about_audience: z.string().min(20, "About audience must be at least 20 characters"),
  raw_objective: z.string().min(20, "Raw objective must be at least 20 characters"),
  language: z.string().default("English"),
});

// Response type
export type EnhanceObjectiveResponse = {
  enhanced_objective: string;
  tokens_used: number;
};

const SYSTEM_PROMPT = `You are helping a qualitative researcher craft a clear, comprehensive research objective for an AI-led interview study.

CONTEXT PROVIDED BY USER:
- Who they are: {{about_interviewer}}
- Who they're interviewing: {{about_audience}}
- Their initial objective/context: {{raw_objective}}
- Interview language: {{language}}

YOUR TASK:
Transform their input into a well-structured research objective that:
1. Clearly states the primary learning goal
2. Identifies 2-4 key themes or topics to explore
3. Notes any important context the AI interviewer should keep in mind
4. Specifies the relationship dynamic to maintain appropriate tone
5. Calls out any sensitivities or areas to approach carefully (if apparent)

FORMAT:
Write in second person ("You want to understand..."). Keep it concise but comprehensive—aim for 150-300 words. Use natural paragraphs, not bullet points. Professional but approachable tone.

DO NOT:
- Add questions (those come later in the flow)
- Make assumptions about specifics not provided
- Use overly academic or market-research jargon
- Include meta-commentary about your task

Respond with ONLY the enhanced objective text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedInput = RequestSchema.parse(body);

    const { about_interviewer, about_audience, raw_objective, language } = validatedInput;

    // Build the prompt with user context
    const userPrompt = SYSTEM_PROMPT
      .replace("{{about_interviewer}}", about_interviewer)
      .replace("{{about_audience}}", about_audience)
      .replace("{{raw_objective}}", raw_objective)
      .replace("{{language}}", language);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: userPrompt },
        {
          role: "user",
          content: `Please enhance my research objective based on the context I've provided. Here's my initial input:\n\nAbout me: ${about_interviewer}\n\nAbout my audience: ${about_audience}\n\nMy objective: ${raw_objective}\n\nLanguage: ${language}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const tokensUsed = completion.usage?.total_tokens || 0;

    const response: EnhanceObjectiveResponse = {
      enhanced_objective: content.trim(),
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
