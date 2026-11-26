import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Sprout,
  BookOpen,
  Calculator,
  Users,
  ArrowRight,
  LogIn,
  UserPlus,
  CheckCircle2,
  Leaf,
  LineChart,
} from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Jika sudah login, langsung arahkan ke dashboard utama
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col">
      {/* Navbar Ringkas */}
      <header className="sticky top-0 z-30 bg-[#faf9f6]/90 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-base text-stone-900 leading-tight truncate">
                Sekolah Tani Organik
              </p>
              <p className="text-[11px] font-medium text-emerald-700 leading-tight">
                by Agro Mulya
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-200/60 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-2xs"
            >
              <span>Daftar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:pt-16 sm:pb-16">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mr-2 animate-pulse" />
                Sedang Berjalan • Angkatan 4 (2026)
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.15]">
              Belajar Bertani Organik dari <span className="text-emerald-700">Hulu Lahan</span> hingga{' '}
              <span className="text-emerald-700">Hitungan HPP</span>.
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              Platform pendampingan terpadu <strong>Sekolah Tani Organik by Agro Mulya</strong> untuk
              peserta dan mentor. Kelola jadwal SOP budidaya lahan bedengan, pantau populasi tanaman,
              hingga analisis modal (RAB) dan keuntungan panen secara terukur.
            </p>

            {/* Dual CTA Utama */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Portal Kelas</span>
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-stone-300 text-stone-800 text-sm font-semibold hover:bg-stone-50 transition-colors"
              >
                <UserPlus className="w-4 h-4 text-emerald-700" />
                <span>Daftar Peserta Angkatan 4</span>
              </Link>
            </div>

            {/* Highlight Angkatan 4 */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Praktik Bedengan Kelompok
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SOP Perawatan Terjadwal
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kalkulasi RAB &amp; HPP Otomatis
              </span>
            </div>
          </div>
        </section>

        {/* 3 Pilar Pembelajaran & Sistem */}
        <section className="border-t border-stone-200/80 bg-white py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="space-y-1.5 max-w-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Ekosistem Pembelajaran Terpadu
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                Tiga Pilar Pendampingan Agro Mulya
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-stone-200/90 bg-[#faf9f6] space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-stone-900">1. Akademi &amp; Diskusi</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Akses ringkasan modul, peta konsep (mind map), serta forum tanya-jawab langsung
                  bersama mentor lapangan.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-stone-200/90 bg-[#faf9f6] space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Leaf className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-stone-900">2. Monitoring Bedengan</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Pantau perkembangan tanaman harian, tingkat kelulusan hidup (survival rate), dan
                  pengingat tahapan SOP per HST.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-stone-200/90 bg-[#faf9f6] space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <LineChart className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-stone-900">3. Agribisnis &amp; HPP</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Catat Rencana Anggaran Biaya (RAB) lahan maupun komoditas dan hitung Harga Pokok
                  Produksi (HPP/kg) secara otomatis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Banner Informasi Angkatan 4 */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="rounded-2xl bg-emerald-900 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Program Aktif Tahun 2026</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold leading-snug">
                Sekolah Tani Organik — Angkatan 4
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Sudah terdaftar sebagai peserta atau mentor Angkatan 4? Masuk menggunakan akun Anda
                untuk mulai mencatat progres kebun dan buku kas kelompok.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-900 text-xs sm:text-sm font-bold hover:bg-emerald-50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 border border-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Calculator className="w-4 h-4 text-emerald-300" />
                <span>Buat Akun Baru</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <p className="font-medium text-stone-700">
            © {new Date().getFullYear()} Sekolah Tani Organik by Agro Mulya
          </p>
          <p>Sistem Informasi Budidaya Organik &amp; Agribisnis Terpadu</p>
        </div>
      </footer>
    </div>
  )
}