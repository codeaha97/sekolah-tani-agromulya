'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sprout,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  BarChart3,
} from 'lucide-react'

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
        setError('Email Anda belum diverifikasi. Silakan cek kotak masuk/spam atau klik "Kirim ulang konfirmasi" di bawah.')
      } else {
        setError('Email atau kata sandi tidak sesuai. Silakan periksa kembali.')
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

    setInfoMessage('Tautan atur ulang kata sandi telah dikirim. Periksa kotak masuk atau folder spam email Anda.')
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
      setError(`Gagal mengirim ulang konfirmasi: ${resendError.message}`)
      return
    }

    setInfoMessage('Email verifikasi baru telah dikirim. Silakan klik tautan aktivasi di kotak masuk email Anda.')
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col lg:grid lg:grid-cols-12">
      {/* Panel Branding Desktop (Kiri) */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white p-10 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-800/70 border border-emerald-700/70 mb-8">
            <Sprout className="w-5 h-5 text-emerald-300" />
            <span className="text-xs font-semibold tracking-wide text-emerald-100">AGRO MULYA ACADEMY</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight leading-snug mb-3">
            Sekolah Tani Organik
          </h1>
          <p className="text-sm text-emerald-200/90 leading-relaxed max-w-md">
            Platform pembelajaran terpadu, peta konsep budidaya organik, pemantauan kebun kelompok, serta analisis HPP &amp; agribisnis.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-900/50 border border-emerald-800/70">
            <BookOpen className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Kurikulum &amp; Mind Mapping</p>
              <p className="text-[11px] text-emerald-200/80">Ringkasan materi kelas dan panduan SOP 15 komoditas organik.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-900/50 border border-emerald-800/70">
            <BarChart3 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Monitoring &amp; Kalkulator HPP</p>
              <p className="text-[11px] text-emerald-200/80">Pantau pertumbuhan tanaman, RAB, dan omzet panen kelompok.</p>
            </div>
          </div>
          <p className="text-[11px] text-emerald-400/80 pt-2">
            © {new Date().getFullYear()} Sekolah Tani Organik by Agro Mulya
          </p>
        </div>
      </div>

      {/* Panel Form Auth (Kanan / Full Mobile) */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-center items-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header Mobile Brand */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <p className="lg:hidden text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Sekolah Tani Organik by Agro Mulya
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                {viewMode === 'login' && 'Selamat Datang Kembali'}
                {viewMode === 'forgot' && 'Atur Ulang Kata Sandi'}
                {viewMode === 'resend' && 'Verifikasi Email Akun'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                {viewMode === 'login' && 'Masuk ke portal kelas dan monitoring kebun Anda'}
                {viewMode === 'forgot' && 'Kami akan mengirimkan tautan pemulihan ke email terdaftar'}
                {viewMode === 'resend' && 'Kirim ulang tautan aktivasi akun ke kotak masuk Anda'}
              </p>
            </div>
          </div>

          {/* Card Form */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-5 sm:p-7 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 text-xs text-red-700 bg-red-50 border border-red-200/80 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {infoMessage && (
              <div className="flex items-start gap-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{infoMessage}</p>
              </div>
            )}

            {/* MODE 1: LOGIN */}
            {viewMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
                    Email Peserta / Mentor
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
                      Kata Sandi
                    </Label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline font-semibold"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10 h-10 rounded-xl"
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-semibold text-sm shadow-2xs"
                >
                  {loading ? 'Memproses...' : 'Masuk ke Kelas'}
                </Button>

                <div className="pt-2 border-t border-stone-100 space-y-2 text-center text-xs text-stone-500">
                  <p>
                    Belum punya akun angkatan?{' '}
                    <Link href="/register" className="text-emerald-700 font-bold hover:underline">
                      Daftar Sekarang
                    </Link>
                  </p>
                  <p>
                    Belum menerima email verifikasi?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('resend')}
                      className="text-amber-700 font-semibold hover:underline"
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
                  <Label htmlFor="resetEmail" className="text-xs font-semibold text-stone-700">
                    Email Terdaftar
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-semibold"
                >
                  {loading ? 'Mengirim Tautan...' : 'Kirim Tautan Reset Sandi'}
                </Button>

                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-stone-600 hover:text-emerald-700 pt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke halaman masuk
                </button>
              </form>
            )}

            {/* MODE 3: KIRIM ULANG KONFIRMASI */}
            {viewMode === 'resend' && (
              <form onSubmit={handleResendConfirmation} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="resendEmail" className="text-xs font-semibold text-stone-700">
                    Email Pendaftaran
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="resendEmail"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  {loading ? 'Mengirim Ulang...' : 'Kirim Ulang Email Konfirmasi'}
                </Button>

                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-stone-600 hover:text-emerald-700 pt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke halaman masuk
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}