"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-context";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const hasTrackedRef = useRef(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  // Check auth status and redirect if not logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/cart");
        return;
      }
      setIsLoggedIn(true);
    };
    checkAuth();
  }, [router]);

  // Track view_cart on mount
  useEffect(() => {
    if (!hasTrackedRef.current) {
      track("view_cart", { item_count: items.length, total_value: totalPrice });
      hasTrackedRef.current = true;
    }
  }, []);

  // Show loading while checking auth
  if (isLoggedIn === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-soft">Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <ShoppingBag className="h-16 w-16 text-soft mb-6" />
        <h1 className="text-2xl font-bold text-ink mb-2">Your cart is empty</h1>
        <p className="text-soft mb-8 text-center max-w-md">
          Discover premium deadstock fabrics from the world&apos;s best mills.
        </p>
        <Link
          href="/browse"
          className={cn(buttonVariants({ variant: "default" }), "btn-selvedge")}
        >
          Browse Fabrics
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone">
      <div className="wrap py-8 lg:py-12">
        <h1 className="text-3xl lg:text-4xl font-bold text-ink mb-8">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-bone-2 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-mono text-xs text-soft uppercase tracking-wider">
                            {item.factoryName}
                          </p>
                          <h3 className="font-bold text-ink text-lg truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-soft">{item.material}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-soft hover:text-clay"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.title} from cart`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.yards - 0.5)}
                            disabled={item.yards <= 0.5}
                            aria-label="Decrease yardage"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-16 text-center font-mono text-sm">
                            {item.yards} yds
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.yards + 0.5)}
                            aria-label="Increase yardage"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-bold text-ink">
                            ${(item.pricePerYard * item.yards).toFixed(2)}
                          </p>
                          <p className="text-xs text-soft font-mono">
                            ${item.pricePerYard}/yd
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Clear cart button */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="text-soft hover:text-clay"
                onClick={clearCart}
              >
                Clear cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg text-ink mb-4">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-soft">
                      Subtotal ({items.length} {items.length === 1 ? "item" : "items"})
                    </span>
                    <span className="text-ink">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-soft">Shipping</span>
                    <span className="text-ink">
                      {totalPrice >= 150 ? "Free" : "Calculated at checkout"}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-baseline mb-6">
                  <span className="font-bold text-ink">Total</span>
                  <span className="text-2xl font-bold text-clay">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                {totalPrice < 150 && (
                  <p className="text-xs text-soft text-center mb-4">
                    Add ${(150 - totalPrice).toFixed(2)} more for free shipping
                  </p>
                )}

                <Button
                  className="w-full h-12 text-base font-bold uppercase tracking-wider bg-clay hover:bg-clay-deep text-bone"
                  disabled={isCheckingOut}
                  onClick={async () => {
                    setIsCheckingOut(true);
                    track("checkout_started", {
                      item_count: items.length,
                      total_value: totalPrice,
                    });

                    try {
                      const response = await fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ items }),
                      });

                      const data = await response.json();

                      if (data.url) {
                        window.location.href = data.url;
                      } else {
                        alert(data.error || "Checkout failed. Please try again.");
                        setIsCheckingOut(false);
                      }
                    } catch (error) {
                      alert("Checkout failed. Please try again.");
                      setIsCheckingOut(false);
                    }
                  }}
                >
                  {isCheckingOut ? "Redirecting..." : "Proceed to Checkout"}
                  {!isCheckingOut && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                <p className="text-xs text-soft text-center mt-4">
                  Secure checkout with Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
