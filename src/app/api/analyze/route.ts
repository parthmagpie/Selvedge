import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Env var guard - return 503 if not configured
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("ANTHROPIC_API_KEY not configured - AI analysis will return 503");
}

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const ANALYSIS_PROMPT = `You are an expert textile analyst. Analyze this fabric image and extract the following properties:

1. **Material**: Primary fiber type (e.g., Cotton, Linen, Wool, Silk, Polyester, Blend)
2. **Texture**: Surface feel (e.g., Smooth, Nubby, Soft, Crisp, Plush)
3. **Weave/Pattern**: Structure (e.g., Plain weave, Twill, Satin, Jacquard, Knit)
4. **Color Family**: Primary color group (e.g., Earth tones, Jewel tones, Neutrals, Pastels)
5. **Primary Color**: Dominant color name
6. **Weight**: Fabric weight category (e.g., Lightweight, Medium, Heavyweight)
7. **Width Estimate**: Typical bolt width in inches (45, 54, 60, or 108)
8. **Suggested Title**: A compelling 3-5 word title for marketplace listing
9. **Confidence**: Your confidence in the analysis (0.0 to 1.0)

Respond in JSON format only:
{
  "material": "string",
  "texture": "string",
  "weave": "string",
  "color_family": "string",
  "primary_color": "string",
  "weight": "string",
  "width_inches": number,
  "suggested_title": "string",
  "confidence": number
}`;

interface AnalysisResult {
  material: string;
  texture: string;
  weave: string;
  color_family: string;
  primary_color: string;
  weight: string;
  width_inches: number;
  suggested_title: string;
  confidence: number;
}

export async function POST(request: NextRequest) {
  // Env var guard
  if (!client) {
    return NextResponse.json(
      { error: "Anthropic API not configured" },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image") as File | null;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = image.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    // Call Claude Vision API
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract JSON from response
    const responseText = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    // Parse JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const analysis: AnalysisResult = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      analysis,
      model: "claude-sonnet-4-20250514",
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
