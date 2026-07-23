import { createClient } from './supabase'

export async function checkAndAwardBadges(userId: string) {
  const supabase = createClient()
  const newlyAwarded: string[] = []

  // Gather the stats we need
  const { data: profile } = await supabase
    .from('profiles').select('level, current_streak').eq('id', userId).single()

  const { count: lessonCount } = await supabase
    .from('lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId).eq('completed', true)

  const { count: correctQuizCount } = await supabase
    .from('quiz_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId).eq('is_correct', true)

  // Get badges the user already has, so we don't re-check them
  const { data: earnedBadges } = await supabase
    .from('user_badges').select('badge_id').eq('user_id', userId)
  const earnedIds = new Set((earnedBadges || []).map(b => b.badge_id))

  // Get all badge definitions
  const { data: allBadges } = await supabase.from('badges').select('*')

  const stats = {
    lesson_count: lessonCount || 0,
    correct_quiz_count: correctQuizCount || 0,
    streak: profile?.current_streak || 0,
    level: profile?.level || 0,
  }

  for (const badge of allBadges || []) {
    if (earnedIds.has(badge.id)) continue // already have it

    const earned = evaluateCriteria(badge.criteria, stats)
    if (earned) {
      await supabase.from('user_badges').insert({ user_id: userId, badge_id: badge.id })
      newlyAwarded.push(badge.name)
    }
  }

  return newlyAwarded
}

// Parses simple criteria strings like "lesson_count >= 5"
function evaluateCriteria(criteria: string, stats: Record<string, number>): boolean {
  const match = criteria.match(/(\w+)\s*>=\s*(\d+)/)
  if (!match) return false
  const [, field, value] = match
  return (stats[field] || 0) >= parseInt(value)
}