'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])

  // Course form state
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')

  // Lesson form state
  const [lessonCourseId, setLessonCourseId] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonOrder, setLessonOrder] = useState(1)
  const [lessonXp, setLessonXp] = useState(10)

  // Quiz form state
  const [quizLessonId, setQuizLessonId] = useState('')
  const [quizQuestion, setQuizQuestion] = useState('')
  const [quizOptions, setQuizOptions] = useState(['', '', ''])
  const [quizCorrect, setQuizCorrect] = useState(0)
  const [quizXp, setQuizXp] = useState(5)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()

      if (!profile?.is_admin) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await loadData()
      setLoading(false)
    }
    check()
  }, [])

  async function loadData() {
    const { data: coursesData } = await supabase.from('courses').select('*').order('title')
    const { data: lessonsData } = await supabase.from('lessons').select('*').order('order_index')
    setCourses(coursesData || [])
    setLessons(lessonsData || [])
  }

  async function addCourse() {
    if (!courseTitle.trim()) return alert('Title is required')
    const { error } = await supabase.from('courses').insert({
      title: courseTitle, description: courseDesc,
    })
    if (error) return alert('Error: ' + error.message)
    setCourseTitle(''); setCourseDesc('')
    await loadData()
    alert('Course added!')
  }

  async function addLesson() {
    if (!lessonCourseId || !lessonTitle.trim()) return alert('Course and title are required')
    const { error } = await supabase.from('lessons').insert({
      course_id: lessonCourseId,
      title: lessonTitle,
      content: lessonContent,
      order_index: lessonOrder,
      xp_reward: lessonXp,
    })
    if (error) return alert('Error: ' + error.message)
    setLessonTitle(''); setLessonContent(''); setLessonOrder(1)
    await loadData()
    alert('Lesson added!')
  }

  async function addQuiz() {
    if (!quizLessonId || !quizQuestion.trim()) return alert('Lesson and question are required')
    const filledOptions = quizOptions.filter(o => o.trim() !== '')
    if (filledOptions.length < 2) return alert('Add at least 2 options')

    const { error } = await supabase.from('quizzes').insert({
      lesson_id: quizLessonId,
      question: quizQuestion,
      options: filledOptions,
      correct_answer: quizCorrect,
      xp_reward: quizXp,
    })
    if (error) return alert('Error: ' + error.message)
    setQuizQuestion(''); setQuizOptions(['', '', ''])
    alert('Quiz question added!')
  }

  async function deleteCourse(id: string) {
    if (!confirm('Delete this course and all its lessons?')) return
    await supabase.from('courses').delete().eq('id', id)
    await loadData()
  }

  async function deleteLesson(id: string) {
    if (!confirm('Delete this lesson?')) return
    await supabase.from('lessons').delete().eq('id', id)
    await loadData()
  }

  if (loading) return <div className="text-center mt-20">Checking access...</div>
  if (!isAdmin) return null

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🛠️ Admin Panel</h1>
        <a href="/dashboard" className="text-blue-600 text-sm">← Back to Dashboard</a>
      </div>

      {/* Add Course */}
      <section className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Add a Course</h2>
        <input className="border p-2 w-full mb-2" placeholder="Course title"
          value={courseTitle} onChange={e => setCourseTitle(e.target.value)} />
        <textarea className="border p-2 w-full mb-2" placeholder="Description"
          value={courseDesc} onChange={e => setCourseDesc(e.target.value)} />
        <button onClick={addCourse} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Course
        </button>
      </section>

      {/* Add Lesson */}
      <section className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Add a Lesson</h2>
        <select className="border p-2 w-full mb-2" value={lessonCourseId}
          onChange={e => setLessonCourseId(e.target.value)}>
          <option value="">-- Select course --</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input className="border p-2 w-full mb-2" placeholder="Lesson title"
          value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} />
        <textarea className="border p-2 w-full mb-2" placeholder="Lesson content"
          value={lessonContent} onChange={e => setLessonContent(e.target.value)} rows={4} />
        <div className="flex gap-2 mb-2">
          <input type="number" className="border p-2 w-1/2" placeholder="Order (1, 2, 3...)"
            value={lessonOrder} onChange={e => setLessonOrder(Number(e.target.value))} />
          <input type="number" className="border p-2 w-1/2" placeholder="XP reward"
            value={lessonXp} onChange={e => setLessonXp(Number(e.target.value))} />
        </div>
        <button onClick={addLesson} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Lesson
        </button>
      </section>

      {/* Add Quiz */}
      <section className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Add a Quiz Question</h2>
        <select className="border p-2 w-full mb-2" value={quizLessonId}
          onChange={e => setQuizLessonId(e.target.value)}>
          <option value="">-- Select lesson --</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
        <input className="border p-2 w-full mb-2" placeholder="Question"
          value={quizQuestion} onChange={e => setQuizQuestion(e.target.value)} />
        {quizOptions.map((opt, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input type="radio" name="correct" checked={quizCorrect === i}
              onChange={() => setQuizCorrect(i)} />
            <input className="border p-2 flex-1" placeholder={`Option ${i + 1}`}
              value={opt} onChange={e => {
                const newOpts = [...quizOptions]
                newOpts[i] = e.target.value
                setQuizOptions(newOpts)
              }} />
          </div>
        ))}
        <p className="text-xs text-gray-500 mb-2">Select the radio button next to the correct answer.</p>
        <input type="number" className="border p-2 w-full mb-2" placeholder="XP reward"
          value={quizXp} onChange={e => setQuizXp(Number(e.target.value))} />
        <button onClick={addQuiz} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Quiz Question
        </button>
      </section>

      {/* Existing Courses List */}
      <section>
        <h2 className="font-semibold mb-3">Existing Courses</h2>
        <div className="space-y-2">
          {courses.map(c => (
            <div key={c.id} className="border rounded-lg p-3 flex justify-between items-center">
              <span>{c.title}</span>
              <button onClick={() => deleteCourse(c.id)} className="text-red-600 text-sm">Delete</button>
            </div>
          ))}
        </div>
      </section>

      {/* Existing Lessons List */}
      <section>
        <h2 className="font-semibold mb-3">Existing Lessons</h2>
        <div className="space-y-2">
          {lessons.map(l => (
            <div key={l.id} className="border rounded-lg p-3 flex justify-between items-center">
              <span>{l.title}</span>
              <button onClick={() => deleteLesson(l.id)} className="text-red-600 text-sm">Delete</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}