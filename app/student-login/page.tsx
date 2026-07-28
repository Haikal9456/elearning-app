"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      return setError("Please enter your username and password");
    }
    setError("");
    setLoading(true);

    const res = await fetch(
      `/api/lookup-email?username=${encodeURIComponent(username)}`,
    );
    const result = await res.json();

    if (!result.email) {
      setLoading(false);
      return setError("Username not found");
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: result.email,
      password,
    });

    setLoading(false);

    if (loginError) {
      return setError("Incorrect username or password");
    }

    router.push("/dashboard");
  }

  return (
    <div className="max-w-sm mx-auto mt-16 sm:mt-24 px-4">
      <div className="rounded-2xl p-6 sm:p-8 bg-white border border-slate-200 shadow-sm text-center">
        <div className="text-4xl mb-3">🎓</div>
        <h1 className="text-xl font-bold text-slate-700 mb-1">Student Login</h1>
        <p className="text-sm text-slate-400 mb-6">
          Enter your username and password
        </p>

        <input
          className="border border-slate-200 rounded-lg p-3 w-full mb-3 text-center"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="border border-slate-200 rounded-lg p-3 w-full mb-3 text-center"
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

        <p className="text-xs text-slate-400 mt-6">
          Are you a teacher?{" "}
          <a href="/login" className="font-medium" style={{ color: "#5B8DEF" }}>
            Log in here
          </a>
        </p>
      </div>
    </div>
  );
}
