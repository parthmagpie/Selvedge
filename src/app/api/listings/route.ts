import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const listingSchema = z.object({
  title: z.string().min(1),
  material: z.string().min(1),
  texture: z.string().optional(),
  weaveType: z.string().optional(),
  colorFamily: z.string().min(1),
  pricePerYard: z.number().positive(),
  yardsAvailable: z.number().positive(),
  widthInches: z.number().positive(),
  weightGsm: z.number().optional(),
  factoryName: z.string().optional(),
  imageUrl: z.string().min(1),
  aiConfidence: z.number().min(0).max(100),
});

// GET - Fetch all active listings
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: fabrics, error } = await supabase
      .from("fabrics")
      .select(`
        id,
        title,
        material,
        weave_type,
        color_family,
        price_per_yard,
        yards_available,
        width_inches,
        weight_gsm,
        image_url,
        ai_confidence,
        created_at,
        factories (
          name,
          location
        )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings:", error);
      return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
    }

    // Transform to frontend format
    type FabricRow = {
      id: string;
      title: string;
      material: string;
      weave_type: string | null;
      color_family: string;
      price_per_yard: number;
      yards_available: number;
      width_inches: number;
      weight_gsm: number | null;
      image_url: string;
      ai_confidence: number;
      factories: { name: string; location: string } | null;
    };
    const listings = (fabrics as FabricRow[] | null)?.map((fabric) => ({
      id: fabric.id,
      title: fabric.title,
      material: fabric.material,
      weaveType: fabric.weave_type || "Plain",
      colorFamily: fabric.color_family,
      pricePerYard: Number(fabric.price_per_yard),
      yardsAvailable: Number(fabric.yards_available),
      widthInches: Number(fabric.width_inches),
      weightGsm: Number(fabric.weight_gsm) || 200,
      factory: (fabric.factories as { name: string } | null)?.name || "Independent Seller",
      factoryLocation: (fabric.factories as { location: string } | null)?.location || "",
      aiConfidence: Number(fabric.ai_confidence),
      imageUrl: fabric.image_url,
      weaveClass: getWeaveClass(fabric.weave_type),
    })) || [];

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Listings fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new listing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = listingSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    // Get or create a default factory for user uploads
    let factoryId: string;

    const factoryName = data.factoryName || "Independent Seller";
    const { data: existingFactory } = await supabase
      .from("factories")
      .select("id")
      .eq("name", factoryName)
      .single();

    if (existingFactory) {
      factoryId = existingFactory.id;
    } else {
      const { data: newFactory, error: factoryError } = await supabase
        .from("factories")
        .insert({
          name: factoryName,
          location: "User Upload",
          country: "Unknown",
        })
        .select("id")
        .single();

      if (factoryError || !newFactory) {
        console.error("Error creating factory:", factoryError);
        return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
      }
      factoryId = newFactory.id;
    }

    // Insert the fabric listing
    const { data: fabric, error } = await supabase
      .from("fabrics")
      .insert({
        title: data.title,
        material: data.material,
        weave_type: data.weaveType || data.texture,
        color_family: data.colorFamily,
        price_per_yard: data.pricePerYard,
        yards_available: data.yardsAvailable,
        width_inches: data.widthInches,
        weight_gsm: data.weightGsm || 200,
        factory_id: factoryId,
        image_url: data.imageUrl,
        ai_confidence: data.aiConfidence,
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating listing:", error);
      return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      listingId: fabric.id,
      message: "Listing published successfully"
    });
  } catch (error) {
    console.error("Listing creation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid listing data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getWeaveClass(weaveType: string | null): string {
  const weaveMap: Record<string, string> = {
    "Twill": "weave-denim",
    "Plain": "weave-linen",
    "Flannel": "weave-flannel",
    "Satin": "weave-satin",
    "Corduroy": "weave-corduroy",
    "Tweed": "weave-tweed",
  };
  return weaveMap[weaveType || "Plain"] || "weave-linen";
}
