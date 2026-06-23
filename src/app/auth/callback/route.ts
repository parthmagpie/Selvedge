import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect") || "/browse";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to the specified page or browse after successful auth
  // Validate redirect to prevent open redirect vulnerability
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/browse";
  return NextResponse.redirect(`${origin}${safeRedirect}`);
}
