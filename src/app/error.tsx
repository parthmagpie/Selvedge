"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center px-4">
      <h2 className="text-2xl font-bold text-field">Something went wrong</h2>
      <p className="text-ink/70 max-w-md">
        An unexpected error occurred. You can try again or go back to browse our
        fabric collection.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()} className="bg-clay hover:bg-clay/90">
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
