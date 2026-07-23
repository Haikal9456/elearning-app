'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return alert(error.message)
    router.push('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-4">Log In</h1>
      <input className="border p-2 w-full mb-2" placeholder="Email"
        onChange={e => setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-2" type="password" placeholder="Password"
        onChange={e => setPassword(e.target.value)} />
      <button className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        onClick={handleLogin}>Log In</button>
    </div>
  )
}