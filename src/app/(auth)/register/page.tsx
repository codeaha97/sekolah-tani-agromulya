'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import {
  Sprout,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  Lock,
  GraduationCap,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

const COHORT_OPTIONS = ['Angkatan 1', 'Angkatan 2', 'Angkatan 3', 'Angkatan 4', 'Angkatan 5']
const GROUP_OPTIONS = ['Kelompok 1', 'Kelompok 2', 'Kelompok 3', 'Kelompok 4', 'Kelompok 5', 'Kelompok 6']

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cohortName, setCohortName] = useState('Angkatan 1')
  const [farmGroup, setFarmGroup] = useState('Kelompok 1')
  const [role, setRole] = useState<'peserta' | 'admin'>('peserta')
  const [adminCode, setAdminCode] = useState('')
  const [showAdminCode, setShowAdminCode] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    const validInviteCode = process.env.NEXT_PUBLIC_ADMIN_INVITE_CODE || 'AGROMULYA2026'
    if (role === 'admin' && adminCode !== validInviteCode) {
      setError('Kode akses Admin / Mentor tidak valid. Hubungi koordinator Agro Mulya.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          role,
          ...(role === 'peserta' && {
            cohort_name: cohortName,
            farm_group: farmGroup,
          }),
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Jika Supabase membutuhkan konfirmasi email (session belum langsung aktif)
    if (data.user && !data.session) {
      setLoading(false)
      setSuccessMsg(
        'Pendaftaran berhasil! Kami telah mengirimkan tautan aktivasi ke email Anda. Silakan buka email untuk mengonfirmasi akun sebelum masuk.'
      )
      return
    }

    router.push('/')
    router.refresh()
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
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Daftar Akun Kelas</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Lengkapi identitas untuk bergabung dengan kelompok belajar Anda
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

          {successMsg ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-stone-900">Cek Kotak Masuk Email Anda</h3>
                <p className="text-xs text-stone-600 leading-relaxed">{successMsg}</p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold"
              >
                Lanjut ke Halaman Masuk
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Pilihan Peran (Segmented Cards) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Daftar Sebagai</Label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('peserta')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      role === 'peserta'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <GraduationCap className={`w-4 h-4 ${role === 'peserta' ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <span>Peserta Kelas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      role === 'admin'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 ${role === 'admin' ? 'text-amber-600' : 'text-stone-400'}`} />
                    <span>Admin / Mentor</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Nama Lengkap</Label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    placeholder="Nama lengkap sesuai daftar hadir"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Nomor WhatsApp / HP</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              {role === 'peserta' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-700">Angkatan</Label>
                    <Select value={cohortName} onValueChange={(val) => val && setCohortName(val)}>
                      <SelectTrigger className="w-full h-10 rounded-xl justify-between">
                        <span>{cohortName}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {COHORT_OPTIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-700">Kelompok Tani</Label>
                    <Select value={farmGroup} onValueChange={(val) => val && setFarmGroup(val)}>
                      <SelectTrigger className="w-full h-10 rounded-xl justify-between">
                        <span>{farmGroup}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {GROUP_OPTIONS.map((grp) => (
                          <SelectItem key={grp} value={grp}>
                            {grp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-amber-800">Kode Akses Admin / Mentor</Label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type={showAdminCode ? 'text' : 'password'}
                      placeholder="Masukkan kode undangan koordinator"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      className="pl-9 pr-10 h-10 rounded-xl border-amber-300 focus-visible:ring-amber-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminCode((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-600"
                      aria-label={showAdminCode ? 'Sembunyikan kode akses' : 'Lihat kode akses'}
                    >
                      {showAdminCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Email Aktif</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
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
                <Label className="text-xs font-semibold text-stone-700">Kata Sandi (Minimal 6 karakter)</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    minLength={6}
                    placeholder="Buat kata sandi akun"
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
                className="w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-semibold text-sm shadow-2xs mt-1"
              >
                {loading ? 'Mendaftarkan Akun...' : 'Buat Akun Sekarang'}
              </Button>

              <p className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-emerald-700 font-bold hover:underline">
                  Masuk di sini
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}