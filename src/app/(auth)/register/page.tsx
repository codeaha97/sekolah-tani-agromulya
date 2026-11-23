'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sprout } from 'lucide-react'

const COHORT_OPTIONS = ['Angkatan 1', 'Angkatan 2', 'Angkatan 3', 'Angkatan 4', 'Angkatan 5']
const GROUP_OPTIONS = ['Kelompok 1', 'Kelompok 2', 'Kelompok 3', 'Kelompok 4', 'Kelompok 5', 'Kelompok 6']

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cohortName, setCohortName] = useState('Angkatan 1')
  const [farmGroup, setFarmGroup] = useState('Kelompok 1')
  const [role, setRole] = useState<'peserta' | 'admin'>('peserta')
  const [adminCode, setAdminCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const validInviteCode = process.env.NEXT_PUBLIC_ADMIN_INVITE_CODE || 'AGROMULYA2026'
    if (role === 'admin' && adminCode !== validInviteCode) {
      setError('Kode undangan Admin / Mentor tidak valid.')
      setLoading(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
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

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4 py-8">
      <Card className="w-full max-w-md border-stone-200 shadow-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold text-stone-900">Daftar Akun Kelas</CardTitle>
          <CardDescription>Sekolah Tani Organik by Agro Mulya</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-3.5">
            {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{error}</p>}

            <div className="space-y-1">
              <Label>Nama Lengkap</Label>
              <Input
                placeholder="Nama lengkap sesuai daftar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Nomor WhatsApp / HP</Label>
              <Input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Daftar Sebagai</Label>
              <Select value={role} onValueChange={(val: 'peserta' | 'admin') => setRole(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="peserta">Peserta Kelas</SelectItem>
                  <SelectItem value="admin">Admin / Mentor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'peserta' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Angkatan</Label>
                  <Select value={cohortName} onValueChange={setCohortName}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COHORT_OPTIONS.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Kelompok Tani</Label>
                  <Select value={farmGroup} onValueChange={setFarmGroup}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_OPTIONS.map((grp) => (
                        <SelectItem key={grp} value={grp}>{grp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-amber-700">Kode Akses Admin / Mentor</Label>
                <Input
                  type="password"
                  placeholder="Masukkan kode undangan koordinator"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label>Kata Sandi (Minimal 6 karakter)</Label>
              <Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">
              {loading ? 'Mendaftarkan...' : 'Buat Akun Sekarang'}
            </Button>

            <p className="text-center text-xs text-stone-500 pt-2">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}