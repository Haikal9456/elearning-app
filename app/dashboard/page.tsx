"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  async function updateStreak(userId: string) {
    const { data: profileData, error: selectError } = await supabase
      .from("profiles")
      .select("last_active, current_streak")
      .eq("id", userId)
      .single();

    if (selectError) return null;

    const today = new Date().toISOString().split("T")[0];
    const lastActive = profileData?.last_active;

    if (lastActive === today) return null;

    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];
    let newStreak = 1;

    if (lastActive === yesterday) {
      newStreak = (profileData?.current_streak || 0) + 1;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ current_streak: newStreak, last_active: today })
      .eq("id", userId);

    if (updateError) return null;

    return newStreak;
  }

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setRole(profileData?.role || null);

      const newStreak = await updateStreak(user.id);
      if (newStreak && profileData) profileData.current_streak = newStreak;

      const { data: coursesData } = await supabase.from("courses").select("*");

      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("badge_id, badges(name, description)")
        .eq("user_id", user.id);

      setProfile(profileData);
      setCourses(coursesData || []);
      setBadges(badgesData || []);
      setLoading(false);
    }

    loadData();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading)
    return <div className="text-center mt-20 text-slate-500">Loading...</div>;

  const xpProgress = (profile?.total_xp || 0) % 100;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-700">
          Welcome, {profile?.username}!
        </h1>
        <div className="flex items-center gap-4">
          {["admin", "coordinator", "instructor"].includes(role || "") && (
            <a
              href="/admin"
              className="text-sm font-medium"
              style={{ color: "#5B8DEF" }}
            >
              🛠️ Admin Panel
            </a>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* XP / Level card */}
      <div className="rounded-2xl p-5 sm:p-6 mb-6 bg-white border border-slate-200 shadow-sm">
        <div className="flex justify-between items-baseline mb-2">
          <span className="font-bold text-slate-700">
            Level {profile?.level || 1}
          </span>
          <span className="text-slate-500 text-sm">
            {profile?.total_xp || 0} XP
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all"
            style={{ width: `${xpProgress}%`, backgroundColor: "#5B8DEF" }}
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-4 text-sm">
          <span className="text-slate-500">
            🔥 {profile?.current_streak || 0} day streak
          </span>
          <a
            href="/leaderboard"
            className="font-medium"
            style={{ color: "#5B8DEF" }}
          >
            View Leaderboard →
          </a>
        </div>
      </div>

      {/* Courses list */}
      <h2 className="text-lg sm:text-xl font-bold text-slate-700 mb-3">
        Your Courses
      </h2>
      {courses.length === 0 ? (
        <p className="text-slate-400">No courses available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {courses.map((course) => (
            <a
              key={course.id}
              href={`/courses/${course.id}`}
              className="block rounded-2xl p-4 bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <h3 className="font-bold text-slate-700 mb-1">{course.title}</h3>
              <p className="text-sm text-slate-500">{course.description}</p>
            </a>
          ))}
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-700 mb-3">
            🏅 Your Badges
          </h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((b: any) => (
              <span
                key={b.badge_id}
                className="rounded-full px-3 py-1.5 text-sm font-medium bg-amber-50 border border-amber-200 text-amber-700"
              >
                {b.badges?.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
