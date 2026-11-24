'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sprout, Eye, EyeOff, ArrowLeft } from 'lucide-react'

type AuthViewMode = 'login' | 'forgot' | 'resend'

export default function LoginPage() {
  const [viewMode, setViewMode] = useState<AuthViewMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const switchMode = (mode: AuthViewMode) => {
    setViewMode(mode)
    setError('')
    setInfoMessage('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfoMessage('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      if (signInError.message.toLowerCase().includes('email not confirmed')) {
        setError('Email Anda belum dikonfirmasi. Silakan cek kotak masuk/spam atau kirim ulang tautan konfirmasi.')
      } else {
        setError('Email atau kata sandi salah. Silakan coba lagi.')
      }
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfoMessage('')

    const redirectTo = `${window.location.origin}/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setLoading(false)
    if (resetError) {
      setError(`Gagal mengirim email pemulihan: ${resetError.message}`)
      return
    }

    setInfoMessage('Tautan atur ulang kata sandi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.')
  }

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfoMessage('')

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    setLoading(false)
    if (resendError) {
      setError(`Gagal mengirim ulang email konfirmasi: ${resendError.message}`)
      return
    }

    setInfoMessage('Email konfirmasi baru telah dikirim. Silakan buka tautan verifikasi di kotak masuk email Anda.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4">
      <Card className="w-full max-w-md border-stone-200 shadow-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold text-stone-900">
            {viewMode === 'login' && 'Sekolah Tani Organik'}
            {viewMode === 'forgot' && 'Lupa Kata Sandi'}
            {viewMode === 'resend' && 'Kirim Ulang Konfirmasi'}
          </CardTitle>
          <CardDescription>
            {viewMode === 'login' && 'Portal Pembelajaran & Monitoring Angkatan by Agro Mulya'}
            {viewMode === 'forgot' && 'Masukkan email terdaftar untuk menerima tautan pemulihan sandi'}
            {viewMode === 'resend' && 'Kirim ulang tautan verifikasi pendaftaran ke email Anda'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg mb-3.5">{error}</p>}
          {infoMessage && (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg mb-3.5">
              {infoMessage}
            </p>
          )}

          {/* MODE 1: LOGIN NORMAL */}
          {viewMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Peserta / Mentor</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Kata Sandi</Label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-emerald-700 hover:underline font-medium"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-600"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">
                {loading ? 'Memproses...' : 'Masuk ke Kelas'}
              </Button>

              <div className="pt-2 space-y-2 text-center text-xs text-stone-500">
                <p>
                  Belum punya akun angkatan?{' '}
                  <Link href="/register" className="text-emerald-700 font-semibold hover:underline">
                    Daftar di sini
                  </Link>
                </p>
                <p>
                  Belum menerima email verifikasi?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('resend')}
                    className="text-amber-700 font-medium hover:underline"
                  >
                    Kirim ulang konfirmasi
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* MODE 2: LUPA KATA SANDI */}
          {viewMode === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="resetEmail">Email Terdaftar</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">
                {loading ? 'Mengirim Tautan...' : 'Kirim Tautan Reset Sandi'}
              </Button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-600 hover:text-emerald-700 pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke halaman login
              </button>
            </form>
          )}

          {/* MODE 3: KIRIM ULANG EMAIL KONFIRMASI */}
          {viewMode === 'resend' && (
            <form onSubmit={handleResendConfirmation} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="resendEmail">Email Pendaftaran</Label>
                <Input
                  id="resendEmail"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? 'Mengirim Ulang...' : 'Kirim Ulang Email Konfirmasi'}
              </Button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-600 hover:text-emerald-700 pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke halaman login
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}