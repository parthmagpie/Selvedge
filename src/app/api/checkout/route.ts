import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";

const cartItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  material: z.string(),
  factoryName: z.string(),
  pricePerYard: z.number(),
  yards: z.number().min(0.5),
  imageUrl: z.string(),
});

const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = checkoutSchema.parse(body);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // Create line items from cart
    const line_items = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          description: `${item.material} • ${item.yards} yards from ${item.factoryName}`,
          images: item.imageUrl.startsWith("http") ? [item.imageUrl] : undefined,
        },
        unit_amount: Math.round(item.pricePerYard * 100), // Convert to cents
      },
      quantity: Math.round(item.yards * 2) / 2, // Stripe doesn't support decimals, but we can pass fractional yards as quantity
    }));

    // For fractional yards, we need to calculate the total per item instead
    const adjustedLineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.title} (${item.yards} yds)`,
          description: `${item.material} from ${item.factoryName}`,
        },
        unit_amount: Math.round(item.pricePerYard * item.yards * 100), // Total price in cents
      },
      quantity: 1,
    }));

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: adjustedLineItems,
      shipping_address_collection: {
        allowed_countries: ["US", "GB", "DE", "FR", "IT", "JP", "CA", "AU"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "usd",
            },
            display_name: "Free shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 10 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 1500,
              currency: "usd",
            },
            display_name: "Express shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 3 },
            },
          },
        },
      ],
      metadata: {
        item_count: String(items.length),
        total_yards: String(items.reduce((acc, item) => acc + item.yards, 0)),
      },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid cart data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Checkout failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
