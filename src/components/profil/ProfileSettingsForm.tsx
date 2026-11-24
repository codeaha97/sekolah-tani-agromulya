'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserCheck, KeyRound, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const COHORT_OPTIONS = ['Angkatan 1', 'Angkatan 2', 'Angkatan 3', 'Angkatan 4', 'Angkatan 5']
const GROUP_OPTIONS = ['Kelompok 1', 'Kelompok 2', 'Kelompok 3', 'Kelompok 4', 'Kelompok 5', 'Kelompok 6']

interface ProfileFormProps {
  userId: string
  email: string
  initialProfile: {
    full_name: string
    phone_number: string | null
    role: string
    cohort_name: string | null
    farm_group: string | null
  }
}

export function ProfileSettingsForm({ userId, email, initialProfile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialProfile.full_name || '')
  const [phoneNumber, setPhoneNumber] = useState(initialProfile.phone_number || '')
  const [cohortName, setCohortName] = useState(initialProfile.cohort_name || 'Angkatan 1')
  const [farmGroup, setFarmGroup] = useState(initialProfile.farm_group || 'Kelompok 1')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // State Ubah Kata Sandi
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')

  const supabase = createClient()
  const router = useRouter()
  const isPeserta = initialProfile.role === 'peserta'

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg('')

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        ...(isPeserta && {
          cohort_name: cohortName,
          farm_group: farmGroup,
        }),
      })
      .eq('id', userId)

    setSavingProfile(false)
    if (error) {
      setProfileMsg(`Gagal menyimpan: ${error.message}`)
      return
    }

    setProfileMsg('Data profil berhasil diperbarui.')
    router.refresh()
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordMsg('')

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      setPasswordMsg(`Gagal mengganti sandi: ${error.message}`)
      return
    }

    setNewPassword('')
    setPasswordMsg('Kata sandi baru berhasil disimpan.')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* KARTU 1: INFORMASI PRIBADI & KELOMPOK */}
      <Card className="border-stone-200/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-700" /> Informasi Akun & Kelompok
          </CardTitle>
          <CardDescription>Perbarui identitas diri atau penempatan kelompok belajar Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-3.5">
            {profileMsg && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                {profileMsg}
              </p>
            )}

            <div className="space-y-1">
              <Label>Email Akun (Tidak dapat diubah)</Label>
              <Input value={email} disabled className="bg-stone-100 text-stone-500" />
            </div>

            <div className="space-y-1">
              <Label>Nama Lengkap</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label>Nomor WhatsApp / HP</Label>
              <Input
                type="tel"
                placeholder="081234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            {isPeserta && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Angkatan</Label>
                  <Select value={cohortName} onValueChange={(val) => val && setCohortName(val)}>
                    <SelectTrigger>
                      <SelectValue />
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

                <div className="space-y-1">
                  <Label>Kelompok Tani</Label>
                  <Select value={farmGroup} onValueChange={(val) => val && setFarmGroup(val)}>
                    <SelectTrigger>
                      <SelectValue />
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
            )}

            <Button type="submit" disabled={savingProfile} className="w-full bg-emerald-700 hover:bg-emerald-800">
              {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* KARTU 2: KEAMANAN & KATA SANDI */}
      <Card className="border-stone-200/80 shadow-none h-fit">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-600" /> Keamanan & Kata Sandi
          </CardTitle>
          <CardDescription>Ganti kata sandi akun Anda secara berkala.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-3.5">
            {passwordMsg && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                {passwordMsg}
              </p>
            )}

            <div className="space-y-1">
              <Label>Kata Sandi Baru (Minimal 6 karakter)</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  placeholder="Masukkan kata sandi baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={savingPassword} variant="outline" className="w-full border-stone-300">
              {savingPassword ? 'Memperbarui Sandi...' : 'Perbarui Kata Sandi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}