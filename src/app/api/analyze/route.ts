import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Initialize Gemini (primary)
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Initialize Grok/xAI (fallback) - uses OpenAI-compatible API
const grokClient = process.env.GROK_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: "https://api.x.ai/v1",
    })
  : null;

const ANALYSIS_PROMPT = `You are an expert textile analyst. First, determine if this image shows fabric/textile material.

IMPORTANT: If the image does NOT show fabric, textile, or cloth material (e.g., it's a photo of a person, animal, food, landscape, object, etc.), respond with:
{
  "is_fabric": false,
  "rejection_reason": "This image does not appear to show fabric or textile material."
}

If the image DOES show fabric/textile, analyze it and extract the following properties:

1. **Material**: Primary fiber type (e.g., Cotton, Linen, Wool, Silk, Polyester, Blend)
2. **Texture**: Surface feel (e.g., Smooth, Nubby, Soft, Crisp, Plush)
3. **Weave/Pattern**: Structure (e.g., Plain weave, Twill, Satin, Jacquard, Knit)
4. **Color Family**: Primary color group (e.g., Earth tones, Jewel tones, Neutrals, Pastels)
5. **Primary Color**: Dominant color name
6. **Weight**: Fabric weight category (e.g., Lightweight, Medium, Heavyweight)
7. **Width Estimate**: Typical bolt width in inches (45, 54, 60, or 108)
8. **Suggested Title**: A compelling 3-5 word title for marketplace listing
9. **Confidence**: Your confidence in the analysis (0.0 to 1.0) - use lower values (< 0.5) if unsure

Respond in JSON format only:
{
  "is_fabric": true,
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
  is_fabric: boolean;
  rejection_reason?: string;
  material?: string;
  texture?: string;
  weave?: string;
  color_family?: string;
  primary_color?: string;
  weight?: string;
  width_inches?: number;
  suggested_title?: string;
  confidence?: number;
}

// Minimum confidence threshold for accepting fabric analysis
const MIN_CONFIDENCE_THRESHOLD = 0.4;

// Analyze with Gemini
async function analyzeWithGemini(base64: string, mimeType: string): Promise<{ text: string; model: string }> {
  if (!genAI) throw new Error("Gemini not configured");

  // Use gemini-2.5-flash for vision tasks (supports image input)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
    { text: ANALYSIS_PROMPT },
  ]);

  const response = await result.response;
  return { text: response.text(), model: "gemini-2.5-flash" };
}

// Analyze with Grok (fallback)
async function analyzeWithGrok(base64: string, mimeType: string): Promise<{ text: string; model: string }> {
  if (!grokClient) throw new Error("Grok not configured");

  const response = await grokClient.chat.completions.create({
    model: "grok-4.3",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
          {
            type: "text",
            text: ANALYSIS_PROMPT,
          },
        ],
      },
    ],
    max_tokens: 1024,
  });

  return {
    text: response.choices[0]?.message?.content || "",
    model: "grok-4.3"
  };
}

export async function POST(request: NextRequest) {
  // Check if at least one API is configured
  if (!genAI && !grokClient) {
    return NextResponse.json(
      { error: "No AI API configured (need GEMINI_API_KEY or GROK_API_KEY)" },
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
    const mimeType = image.type;

    // Try Gemini first, fall back to Grok
    let responseText: string;
    let modelUsed: string;

    try {
      if (genAI) {
        const result = await analyzeWithGemini(base64, mimeType);
        responseText = result.text;
        modelUsed = result.model;
      } else {
        throw new Error("Gemini not available, using fallback");
      }
    } catch (geminiError) {
      console.warn("Gemini failed, trying Grok fallback:", geminiError);

      if (grokClient) {
        const result = await analyzeWithGrok(base64, mimeType);
        responseText = result.text;
        modelUsed = result.model;
      } else {
        throw geminiError; // No fallback available
      }
    }

    // Parse JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const analysis: AnalysisResult = JSON.parse(jsonMatch[0]);

    // Check if the image is actually fabric
    if (!analysis.is_fabric) {
      return NextResponse.json(
        {
          success: false,
          error: "not_fabric",
          message: analysis.rejection_reason || "This image does not appear to show fabric or textile material. Please upload an image of fabric.",
        },
        { status: 422 }
      );
    }

    // Check confidence threshold
    if (analysis.confidence !== undefined && analysis.confidence < MIN_CONFIDENCE_THRESHOLD) {
      return NextResponse.json(
        {
          success: false,
          error: "low_confidence",
          message: "We couldn't confidently identify this as fabric. Please upload a clearer image of the fabric.",
          confidence: analysis.confidence,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: {
        material: analysis.material,
        texture: analysis.texture,
        weave: analysis.weave,
        color_family: analysis.color_family,
        primary_color: analysis.primary_color,
        weight: analysis.weight,
        width_inches: analysis.width_inches,
        suggested_title: analysis.suggested_title,
        confidence: analysis.confidence,
      },
      model: modelUsed,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
