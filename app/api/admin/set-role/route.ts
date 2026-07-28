import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { targetUsername, newRole, requestedBy } = await req.json();

  const validRoles = ["student", "instructor", "coordinator", "admin"];
  if (!targetUsername || !validRoles.includes(newRole)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: requesterProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", requestedBy)
    .single();

  if (requesterProfile?.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can assign staff roles" },
      { status: 403 },
    );
  }

  const { error } = await adminClient
    .from("profiles")
    .update({ role: newRole })
    .eq("username", targetUsername);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
