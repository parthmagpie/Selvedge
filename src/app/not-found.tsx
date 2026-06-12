import Link from "next/link";

export const metadata = { title: "Page Not Found" };

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-3xl font-bold text-field">Page not found</h1>
      <p className="text-ink/70 max-w-md">
        The fabric you&apos;re looking for may have been rescued by another
        designer. Browse our current collection instead.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-clay px-6 py-3 text-sm font-medium text-bone transition-colors hover:bg-clay/90"
      >
        Back to home
      </Link>
    </div>
  );
}
