"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";

const NAV_LINKS = [
  { href: "/browse", label: "Browse" },
  { href: "/upload", label: "Sell" },
];

export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-bone/95 backdrop-blur-sm border-b border-line">
      <div className="wrap">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="font-bold text-xl tracking-wide text-ink hover:text-clay transition-colors"
          >
            SELVEDGE
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-mono text-sm uppercase tracking-wider transition-colors",
                  pathname === link.href
                    ? "text-clay font-bold"
                    : "text-soft hover:text-ink"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: Cart + Mobile menu */}
          <div className="flex items-center gap-2">
            {/* Cart button */}
            <Link
              href="/cart"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "relative h-10 w-10"
              )}
              aria-label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ""}`}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-clay text-bone text-xs font-bold flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-accent hover:text-accent-foreground"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="right" className="bg-bone">
                <SheetTitle className="sr-only">Site navigation</SheetTitle>
                <div className="flex flex-col gap-6 mt-8">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "font-mono text-lg uppercase tracking-wider transition-colors",
                        pathname === link.href
                          ? "text-clay font-bold"
                          : "text-ink hover:text-clay"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/cart"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "font-mono text-lg uppercase tracking-wider transition-colors flex items-center gap-2",
                      pathname === "/cart"
                        ? "text-clay font-bold"
                        : "text-ink hover:text-clay"
                    )}
                  >
                    Cart
                    {cartCount > 0 && (
                      <span className="h-5 w-5 rounded-full bg-clay text-bone text-xs font-bold flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
