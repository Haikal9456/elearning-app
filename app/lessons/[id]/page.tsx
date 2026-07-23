'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { checkAndAwardBadges } from '@/lib/badges'

function QuizQuestion({ quiz, userId, onXpEarned }: { quiz: any, userId: string, onXpEarned: (xp: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const supabase = createClient()

  async function handleSelect(index: number) {
    if (answered) return
    setSelected(index)
    setAnswered(true)

    const isCorrect = index === quiz.correct_answer

    await supabase.from('quiz_attempts').insert({
      user_id: userId,
      quiz_id: quiz.id,
      is_correct: isCorrect,
    })

    if (isCorrect) {
      onXpEarned(quiz.xp_reward)
    }
  }

  return (
    <div className="border rounded-lg p-4 mb-3 bg-white">
      <p className="font-medium mb-3">{quiz.question}</p>
      {quiz.options.map((opt: string, i: number) => {
        let style = 'border'
        if (answered && i === selected) {
          style = i === quiz.correct_answer ? 'border bg-green-100 border-green-400' : 'border bg-red-100 border-red-400'
        } else if (answered && i === quiz.correct_answer) {
          style = 'border bg-green-50 border-green-300'
        }
        return (
          <button key={i} onClick={() => handleSelect(i)} disabled={answered}
            className={`block w-full text-left p-2 mb-1 rounded ${style}`}>
            {opt}
          </button>
        )
      })}
      {answered && (
        <p className="mt-2 font-semibold text-sm">
          {selected === quiz.correct_answer ? `✅ Correct! +${quiz.xp_reward} XP` : '❌ Not quite — correct answer highlighted above'}
        </p>
      )}
    </div>
  )
}

export default function LessonPage() {
  const { id } = useParams()
  const router = useRouter()
  const [lesson, setLesson] = useState<any>(null)
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const [quizXpEarned, setQuizXpEarned] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: lessonData } = await supabase
        .from('lessons').select('*').eq('id', id).single()

      const { data: quizData } = await supabase
        .from('quizzes').select('*').eq('lesson_id', id)

      const { data: progressData } = await supabase
        .from('lesson_progress').select('*')
        .eq('user_id', user.id).eq('lesson_id', id).maybeSingle()

      setLesson(lessonData)
      setQuizzes(quizData || [])
      setAlreadyDone(progressData?.completed || false)
    }
    load()
  }, [id])

  async function awardXp(amount: number) {
    if (!userId) return
    const { data: profile } = await supabase
      .from('profiles').select('total_xp, level').eq('id', userId).single()

    const newXp = (profile?.total_xp || 0) + amount
    const newLevel = Math.floor(newXp / 100) + 1

    await supabase.from('profiles')
      .update({ total_xp: newXp, level: newLevel })
      .eq('id', userId)

    setQuizXpEarned(prev => prev + amount)

    const newBadges = await checkAndAwardBadges(userId)
    if (newBadges.length > 0) {
      alert('🏅 New badge earned: ' + newBadges.join(', '))
    }
  }

  async function handleComplete() {
    if (!userId || alreadyDone) return

    await supabase.from('lesson_progress').upsert({
      user_id: userId,
      lesson_id: id,
      completed: true,
      completed_at: new Date().toISOString(),
    })

    await awardXp(lesson?.xp_reward || 0)
    setAlreadyDone(true)
    setJustCompleted(true)
  }

  if (!lesson) return <div className="text-center mt-20">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <a href="/dashboard" className="text-blue-600 text-sm">← Back</a>
      <h1 className="text-2xl font-bold mt-2 mb-4">{lesson.title}</h1>

      <div className="border rounded-lg p-6 mb-6 bg-white">
        <p>{lesson.content}</p>
      </div>

      {quizzes.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3">Quick Check</h2>
          {userId && quizzes.map(quiz => (
            <QuizQuestion key={quiz.id} quiz={quiz} userId={userId} onXpEarned={awardXp} />
          ))}
        </>
      )}

      {(justCompleted || quizXpEarned > 0) && (
        <div className="bg-green-100 text-green-800 p-3 rounded mb-4">
          🎉 {quizXpEarned + (justCompleted ? lesson.xp_reward : 0)} XP earned this session!
        </div>
      )}

      <button
        onClick={handleComplete}
        disabled={alreadyDone}
        className={`px-4 py-2 rounded w-full mt-4 ${
          alreadyDone ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white'
        }`}
      >
        {alreadyDone ? '✅ Completed' : 'Mark Lesson as Complete'}
      </button>
    </div>
  )
}