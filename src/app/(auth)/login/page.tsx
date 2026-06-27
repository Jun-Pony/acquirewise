'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LangToggle } from '@/components/LangToggle'

export default function LoginPage() {
  const { t } = useLang()
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1F3864] to-[#2E75B6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">AcquireWise</h1>
          <p className="text-white/60 mt-1 text-sm">{t.app.tagline}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#1F3864]">{t.auth.loginTitle}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{t.auth.loginSubtitle}</p>
            </div>
            <LangToggle />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label={t.auth.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              label={t.auth.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? t.auth.loggingIn : t.auth.login}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t.auth.noAccount}{' '}
            <Link
              href="/register"
              className="text-[#2E75B6] font-medium hover:underline"
            >
              {t.auth.signUp}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
