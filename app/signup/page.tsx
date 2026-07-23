'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const router = useRouter()
  const supabase = createClient()

async function handleSignUp() {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return alert(error.message)

  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
    })
    if (profileError) {
      alert('Profile creation failed: ' + profileError.message)
      return
    }
    router.push('/dashboard')
  }
}

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <input className="border p-2 w-full mb-2" placeholder="Username"
        onChange={e => setUsername(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Email"
        onChange={e => setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-2" type="password" placeholder="Password"
        onChange={e => setPassword(e.target.value)} />
      <button className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        onClick={handleSignUp}>Create Account</button>
    </div>
  )
}