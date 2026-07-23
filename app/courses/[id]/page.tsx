'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function CoursePage() {
  const { id } = useParams()
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: courseData } = await supabase
        .from('courses').select('*').eq('id', id).single()

      const { data: lessonsData } = await supabase
        .from('lessons').select('*').eq('course_id', id).order('order_index')

      const { data: progressData } = await supabase
        .from('lesson_progress').select('*').eq('user_id', user?.id)

      setCourse(courseData)
      setLessons(lessonsData || [])
      setProgress(progressData || [])
    }
    load()
  }, [id])

  function isCompleted(lessonId: string) {
    return progress.some(p => p.lesson_id === lessonId && p.completed)
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <a href="/dashboard" className="text-blue-600 text-sm">← Back to Dashboard</a>
      <h1 className="text-2xl font-bold mt-2 mb-1">{course?.title}</h1>
      <p className="text-gray-600 mb-6">{course?.description}</p>

      <div className="space-y-3">
        {lessons.map((lesson, i) => (
          <a key={lesson.id} href={`/lessons/${lesson.id}`}
            className="flex justify-between items-center border rounded-lg p-4 hover:bg-gray-50">
            <div>
              <span className="text-sm text-gray-500">Lesson {i + 1}</span>
              <h3 className="font-semibold">{lesson.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-600">+{lesson.xp_reward} XP</span>
              {isCompleted(lesson.id) && <span className="text-green-600">✅</span>}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}