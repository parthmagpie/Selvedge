"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { href: "/browse", label: "Browse" },
  { href: "/upload", label: "Sell" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items } = useCart();
  const { user, loading, signOut } = useAuth();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

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

          {/* Right side: Auth + Cart + Mobile menu */}
          <div className="flex items-center gap-2">
            {/* Auth buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {!loading && !user && (
                <>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "font-mono text-xs uppercase tracking-wider"
                    )}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "font-mono text-xs uppercase tracking-wider bg-clay hover:bg-clay-deep text-bone"
                    )}
                  >
                    Sign Up
                  </Link>
                </>
              )}
              {!loading && user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-soft truncate max-w-[150px]">
                    {user.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="font-mono text-xs uppercase tracking-wider text-clay hover:text-clay-deep"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Sign out
                  </Button>
                </div>
              )}
            </div>

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

                  {/* Auth - Mobile */}
                  <div className="border-t border-line pt-6 mt-2">
                    {!loading && !user && (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setMobileOpen(false)}
                          className="font-mono text-lg uppercase tracking-wider text-ink hover:text-clay transition-colors block mb-4"
                        >
                          Login
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setMobileOpen(false)}
                          className="font-mono text-lg uppercase tracking-wider text-clay font-bold block"
                        >
                          Sign Up
                        </Link>
                      </>
                    )}
                    {!loading && user && (
                      <>
                        <div className="text-sm text-soft mb-4 truncate">
                          {user.email}
                        </div>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setMobileOpen(false);
                          }}
                          className="font-mono text-lg uppercase tracking-wider text-clay hover:text-clay-deep transition-colors flex items-center gap-2"
                        >
                          <LogOut className="h-5 w-5" />
                          Sign out
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
