import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ email: null });
  }

  // Get the real (fake) email tied to this user id via the admin auth API
  const { data: userData } = await adminClient.auth.admin.getUserById(
    profile.id,
  );

  return NextResponse.json({ email: userData?.user?.email || null });
}
