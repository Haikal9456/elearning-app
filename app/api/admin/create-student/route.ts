import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { username, password, requestedBy } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();

  const { data: requesterProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", requestedBy)
    .single();

  if (
    !requesterProfile ||
    !["admin", "coordinator"].includes(requesterProfile.role)
  ) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { data: existing } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 400 },
    );
  }

  const fakeEmail = `${username.toLowerCase().replace(/\s+/g, "")}@students.local`;

  const { data: newUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email: fakeEmail,
      password,
      email_confirm: true,
    });

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message || "Failed to create user" },
      { status: 500 },
    );
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: newUser.user.id,
    username,
    role: "student",
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, username, password });
}
