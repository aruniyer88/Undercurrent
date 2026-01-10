import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Input validation schema
const RequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  currentObjective: z.string().optional(),
});

// Output schema for structured study setup
const StudySetupSchema = z.object({
  title: z.string().describe("A concise, descriptive title for the study"),
  project_type: z.enum(["discovery", "concept_testing", "creative_testing", "brand_health"])
    .describe("The type of research project"),
  objective: z.string().describe("Clear research objective explaining what we want to learn"),
  topics: z.array(z.string()).describe("Key areas/themes to explore in interviews"),
  success_criteria: z.string().describe("What insights or outcomes would make this study successful"),
  audience: z.string().describe("Description of target participants to interview"),
  guidelines: z.string().describe("Instructions for the AI interviewer on behavior and approach"),
  intro_text: z.string().describe("Welcome message participants will see before the interview"),
});

export type StudySetupOutput = z.infer<typeof StudySetupSchema>;

const SYSTEM_PROMPT = `You are an expert qualitative research designer. Your job is to take a user's research brief (their initial prompt describing what they want to learn) and convert it into a structured study setup.

Generate a complete study configuration with the following fields:

1. **title**: A concise, professional title for the study (max 60 characters)

2. **project_type**: Choose the most appropriate type:
   - "discovery": For open-ended exploration to understand needs, pain points, and opportunities
   - "concept_testing": For validating ideas, features, or strategies before building
   - "creative_testing": For getting feedback on messaging, visuals, or campaign concepts
   - "brand_health": For understanding perception, sentiment, and brand associations

3. **objective**: A clear 1-2 sentence research objective. Start with "Understand..." or "Learn..."

4. **topics**: 3-6 key themes or areas to explore in interviews. Be specific but not leading.

5. **success_criteria**: Define what insights or outcomes would make this study successful. Be concrete.

6. **audience**: Describe the ideal participants. Include relevant demographics, behaviors, or characteristics.

7. **guidelines**: Write instructions for the AI interviewer. Include:
   - Tone and approach (e.g., conversational, empathetic)
   - Any topics to avoid or handle carefully
   - How deep to probe on certain areas
   Keep it to 2-3 sentences.

8. **intro_text**: A welcoming message for participants that:
   - Thanks them for their time
   - Briefly explains the purpose (without biasing them)
   - Sets expectations for the conversation
   Keep it warm and professional, 2-3 sentences.

Be specific and actionable. Avoid generic placeholder text. The output should be ready to use as a research study configuration.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, currentObjective } = RequestSchema.parse(body);

    // Use the prompt, falling back to currentObjective if prompt is the same
    const userPrompt = currentObjective || prompt;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { 
          role: "user", 
          content: `Here is the research brief from the user:\n\n"${userPrompt}"\n\nGenerate a complete study setup configuration.` 
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const parsed = JSON.parse(content);
    const validated = StudySetupSchema.parse(parsed);

    return NextResponse.json(validated);
  } catch (error) {
    console.error("Error generating study setup:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate study setup" },
      { status: 500 }
    );
  }
}

