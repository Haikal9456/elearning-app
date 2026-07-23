'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  async function updateStreak(userId: string) {
    const { data: profileData, error: selectError } = await supabase
      .from('profiles')
      .select('last_active, current_streak')
      .eq('id', userId)
      .single()

    if (selectError) return null

    const today = new Date().toISOString().split('T')[0]
    const lastActive = profileData?.last_active

    if (lastActive === today) return null

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    let newStreak = 1

    if (lastActive === yesterday) {
      newStreak = (profileData?.current_streak || 0) + 1
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ current_streak: newStreak, last_active: today })
      .eq('id', userId)

    if (updateError) return null

    return newStreak
  }

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const newStreak = await updateStreak(user.id)
      if (newStreak && profileData) profileData.current_streak = newStreak

      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')

      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('badge_id, badges(name, description)')
        .eq('user_id', user.id)

      setProfile(profileData)
      setCourses(coursesData || [])
      setBadges(badgesData || [])
      setLoading(false)
    }

    loadData()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="text-center mt-20">Loading...</div>

  const xpProgress = ((profile?.total_xp || 0) % 100)

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {profile?.username}!</h1>
        <button onClick={handleLogout} className="text-sm text-red-600">Log Out</button>
      </div>

      <div className="border rounded-lg p-4 mb-6 bg-blue-50">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Level {profile?.level || 1}</span>
          <span>{profile?.total_xp || 0} XP</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-blue-600 h-3 rounded-full"
            style={{ width: `${xpProgress}%` }} />
        </div>
        <div className="flex justify-between mt-4 text-sm text-gray-600">
          <span>🔥 {profile?.current_streak || 0} day streak</span>
          <a href="/leaderboard" className="text-blue-600">View Leaderboard →</a>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Your Courses</h2>
      {courses.length === 0 ? (
        <p className="text-gray-500">No courses available yet. Add some in Supabase!</p>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <a key={course.id} href={`/courses/${course.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50">
              <h3 className="font-semibold">{course.title}</h3>
              <p className="text-sm text-gray-600">{course.description}</p>
            </a>
          ))}
        </div>
      )}

      {badges.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">🏅 Your Badges</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((b: any) => (
              <span key={b.badge_id} className="bg-yellow-100 border border-yellow-400 rounded-full px-3 py-1 text-sm">
                {b.badges?.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}