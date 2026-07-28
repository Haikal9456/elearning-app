"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      return setError("Please enter your email and password");
    }
    setError("");
    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setLoading(false);
      return setError(loginError.message);
    }

    // Check role to decide where to send them
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    setLoading(false);

    const staffRoles = ["admin", "coordinator", "instructor"];
    if (profile && staffRoles.includes(profile.role)) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 sm:mt-24 px-4">
      <div className="rounded-2xl p-6 sm:p-8 bg-white border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-700 mb-1 text-center">
          Log In
        </h1>
        <p className="text-sm text-slate-400 mb-6 text-center">Welcome back</p>

        <input
          className="border border-slate-200 rounded-lg p-3 w-full mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border border-slate-200 rounded-lg p-3 w-full mb-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="text-white px-4 py-3 rounded-lg w-full font-semibold"
          style={{ backgroundColor: "#5B8DEF" }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="font-medium"
            style={{ color: "#5B8DEF" }}
          >
            Sign up
          </a>
        </p>

        <p className="text-xs text-slate-400 mt-2 text-center">
          Are you a student?{" "}
          <a
            href="/student-login"
            className="font-medium"
            style={{ color: "#5B8DEF" }}
          >
            Log in here
          </a>
        </p>
      </div>
    </div>
  );
}
