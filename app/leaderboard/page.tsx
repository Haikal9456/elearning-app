'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Leaderboard() {
  const [students, setStudents] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const { data } = await supabase
        .from('profiles')
        .select('id, username, total_xp, level')
        .order('total_xp', { ascending: false })
        .limit(50)

      setStudents(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  if (loading) return <div className="text-center mt-20">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <a href="/dashboard" className="text-blue-600 text-sm">← Back to Dashboard</a>
      <h1 className="text-2xl font-bold mt-2 mb-6">🏆 Leaderboard</h1>

      {students.length === 0 ? (
        <p className="text-gray-500">No students yet.</p>
      ) : (
        <ol className="space-y-2">
          {students.map((s, i) => (
            <li key={s.id}
              className={`flex justify-between items-center border rounded-lg p-3
                ${s.id === currentUserId ? 'bg-blue-50 border-blue-400' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="w-8 text-center font-semibold">
                  {medals[i] || `#${i + 1}`}
                </span>
                <div>
                  <span className="font-medium">{s.username}</span>
                  {s.id === currentUserId && (
                    <span className="text-xs text-blue-600 ml-2">(You)</span>
                  )}
                  <div className="text-xs text-gray-500">Level {s.level}</div>
                </div>
              </div>
              <span className="font-semibold">{s.total_xp} XP</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}