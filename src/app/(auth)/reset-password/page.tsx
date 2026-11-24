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
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const isPasswordMatch = confirmPassword.length > 0 && newPassword === confirmPassword

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok. Pastikan kedua kolom identik.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError('Tautan pemulihan tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru di halaman masuk.')
      setLoading(false)
      return
    }

    setSuccess('Kata sandi berhasil diperbarui! Mengalihkan ke beranda kelas...')
    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        {/* Header Brand */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-emerald-300 flex items-center justify-center mx-auto shadow-sm">
            <Sprout className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 pt-1">
            Sekolah Tani Organik by Agro Mulya
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Atur Kata Sandi Baru</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Buat kata sandi baru yang kuat untuk mengamankan akun Anda
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-5 sm:p-7">
          {error && (
            <div className="flex items-start gap-2.5 text-xs text-red-700 bg-red-50 border border-red-200/80 p-3 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{success}</p>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-semibold text-stone-700">
                Kata Sandi Baru (Minimal 6 karakter)
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  placeholder="Masukkan kata sandi baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-stone-700">
                  Konfirmasi Kata Sandi Baru
                </Label>
                {confirmPassword.length > 0 && (
                  <span
                    className={`text-[11px] font-medium ${
                      isPasswordMatch ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {isPasswordMatch ? 'Cocok' : 'Belum cocok'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-semibold text-sm shadow-2xs"
            >
              {loading ? 'Menyimpan Kata Sandi...' : 'Simpan Kata Sandi Baru'}
            </Button>

            <div className="pt-2 border-t border-stone-100 text-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-stone-600 hover:text-emerald-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke halaman masuk
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}