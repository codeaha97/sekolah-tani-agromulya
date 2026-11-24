'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import {
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react'
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
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // State Ubah Kata Sandi
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const isPeserta = initialProfile.role === 'peserta'

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileFeedback(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        ...(isPeserta && {
          cohort_name: cohortName,
          farm_group: farmGroup,
        }),
      })
      .eq('id', userId)

    setSavingProfile(false)
    if (error) {
      setProfileFeedback({ type: 'error', text: `Gagal menyimpan: ${error.message}` })
      return
    }

    setProfileFeedback({ type: 'success', text: 'Data profil & kelompok berhasil diperbarui.' })
    router.refresh()
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordFeedback(null)

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' })
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      setPasswordFeedback({ type: 'error', text: `Gagal mengganti sandi: ${error.message}` })
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setPasswordFeedback({ type: 'success', text: 'Kata sandi baru berhasil disimpan.' })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* KARTU 1: INFORMASI PRIBADI & KELOMPOK */}
      <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
        <CardHeader className="pb-4 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-stone-900">
                Informasi Akun &amp; Kelompok
              </CardTitle>
              <CardDescription className="text-xs text-stone-500">
                Perbarui identitas diri atau penempatan kelompok belajar Anda.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-3.5">
            {profileFeedback && (
              <div
                className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${
                  profileFeedback.type === 'success'
                    ? 'text-emerald-800 bg-emerald-50/90 border-emerald-200'
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}
              >
                {profileFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                )}
                <span className="font-medium leading-relaxed">{profileFeedback.text}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                Email Terdaftar <Lock className="w-3 h-3 text-stone-400" />
              </Label>
              <Input
                value={email}
                disabled
                className="h-10 rounded-lg bg-stone-100/80 text-stone-500 border-stone-200/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Nama Lengkap</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 rounded-lg"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Nomor WhatsApp / HP</Label>
              <Input
                type="tel"
                placeholder="081234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-10 rounded-lg tabular-nums"
                required
              />
            </div>

            {isPeserta && (
              <div className="grid grid-cols-2 gap-3 pt-0.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">Angkatan</Label>
                  <Select value={cohortName} onValueChange={(val) => val && setCohortName(val)}>
                    <SelectTrigger className="w-full h-10 rounded-lg justify-between">
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
                    <SelectTrigger className="w-full h-10 rounded-lg justify-between">
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
            )}

            <Button
              type="submit"
              disabled={savingProfile}
              className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold shadow-2xs mt-1"
            >
              {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* KARTU 2: KEAMANAN & KATA SANDI */}
      <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white h-fit">
        <CardHeader className="pb-4 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-stone-900">
                Keamanan &amp; Kata Sandi
              </CardTitle>
              <CardDescription className="text-xs text-stone-500">
                Ganti kata sandi akun Anda secara berkala untuk menjaga keamanan data.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-3.5">
            {passwordFeedback && (
              <div
                className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${
                  passwordFeedback.type === 'success'
                    ? 'text-emerald-800 bg-emerald-50/90 border-emerald-200'
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                )}
                <span className="font-medium leading-relaxed">{passwordFeedback.text}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">
                Kata Sandi Baru (Minimal 6 karakter)
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  placeholder="Masukkan kata sandi baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 rounded-lg pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">
                Ulangi Kata Sandi Baru
              </Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                placeholder="Ketik ulang kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 rounded-lg"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={savingPassword}
              variant="outline"
              className="w-full h-10 rounded-lg border-stone-200 bg-white hover:bg-stone-50 font-semibold"
            >
              {savingPassword ? 'Memperbarui Sandi...' : 'Perbarui Kata Sandi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}