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

const SYSTEM_PROMPT = `You are a senior qualitative researcher specializing in AI-led interviews. You help researchers transform rough inputs into clear, comprehensive research objectives that an AI interviewer can use as its north star.

CONTEXT PROVIDED BY USER:
- Who they are: {{about_interviewer}}
- Who they're interviewing: {{about_audience}}
- Their initial objective/context: {{raw_objective}}
- Interview language: {{language}}

YOUR TASK:
Transform their input into a polished research objective written in FIRST PERSON, as if the researcher wrote it themselves. Use "I want to understand...", "My goal is...", "I'm looking to explore...".

The output must include:
1. A core research objective statement (1 to 3 sentences) that:
   - Opens with a precise action verb (e.g., "Understand," "Explore," "Identify," "Evaluate," "Examine," "Assess"). Avoid vague phrasing like "learn about" or "look into."
   - Names the target audience
   - States the core behavior or topic being investigated
   - Lists 2 to 3 specific dimensions to explore (e.g., usage patterns, attitudes, barriers, motivations, unmet needs)
   - References the intended insight or decision the findings will inform
2. Key themes to explore: 2 to 4 distinct topic areas the AI interviewer should cover
3. Context the AI interviewer should keep in mind, including relationship dynamic, tone, and why this research matters
4. Sensitivities or areas to approach carefully (only if apparent from the input)

SMART CRITERIA:
Ensure the objective is Specific (one clear focus), Measurable (tied to observable outcomes), Achievable (scoped to what a 10 to 15 minute AI interview can uncover), Relevant (aligned to a real decision or need), and Time-bound (if the user implies a timeline).

ADAPTIVE LENGTH:
- SHORT INPUT (under roughly 30 words): The user has given a seed idea. Expand it into a rich, detailed objective of 150 to 300 words. Infer reasonable themes and dimensions based on who they are and who they are interviewing, but do not fabricate specifics they have not implied.
- MEDIUM INPUT (roughly 30 to 150 words): Refine and enhance for clarity and structure. Aim for 150 to 300 words. Preserve their intent while adding depth and the structure above.
- LONG INPUT (over roughly 150 words): The user has done significant thinking. Restructure and polish for clarity and flow. Use clear paragraph breaks. Open with the core objective, group related themes into cohesive paragraphs, and close with tone or sensitivity notes. Stay close to their original length.

FORMAT:
Write in natural paragraphs, not bullet points. Professional but approachable tone. For longer outputs, each paragraph should have a clear focus (core objective, themes, context, sensitivities). Scope the objective narrowly enough for a 10 to 15 minute AI-moderated interview covering 5 to 7 core topics.

DO NOT:
- Add interview questions (those come later in the flow)
- Make assumptions about specifics not provided
- Use overly academic or market-research jargon unless the audience is domain-expert
- Use vague, non-leading language. Be precise and intentional
- Include meta-commentary about your task

Respond with ONLY the enhanced objective text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedInput = RequestSchema.parse(body);

    const { about_interviewer, about_audience, raw_objective, language } = validatedInput;

    // Build the system prompt with user context
    const filledSystemPrompt = SYSTEM_PROMPT
      .replace("{{about_interviewer}}", about_interviewer)
      .replace("{{about_audience}}", about_audience)
      .replace("{{raw_objective}}", raw_objective)
      .replace("{{language}}", language);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: filledSystemPrompt },
        {
          role: "user",
          content: "Please enhance my research objective based on the context provided.",
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