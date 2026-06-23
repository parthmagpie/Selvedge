"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // Clear the cart after successful checkout
    clearCart();

    // Track the purchase event
    if (!hasTrackedRef.current) {
      track("purchase_completed", {});
      hasTrackedRef.current = true;
    }
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-ink mb-2">Order Confirmed!</h1>
          <p className="text-soft mb-6">
            Thank you for your purchase. You&apos;ll receive a confirmation email
            shortly with your order details and tracking information.
          </p>

          <div className="bg-bone-2 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-3 text-soft">
              <Package className="h-5 w-5" />
              <span className="text-sm">
                Estimated delivery: 5-10 business days
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/browse"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "flex-1"
              )}
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "default" }),
                "flex-1 btn-selvedge"
              )}
            >
              Back to Home
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
