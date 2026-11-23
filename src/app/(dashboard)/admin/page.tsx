import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminActionForms } from '@/components/admin/AdminActionForms'
import { AdminCurriculumManager } from '@/components/admin/AdminCurriculumManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Sprout, Scale, BookOpen, MessageCircle } from 'lucide-react'

export default async function AdminPanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'mentor'].includes(profile.role)) {
    redirect('/')
  }

  const [
    { data: modules },
    { data: sopTemplates },
    { data: cohortSummary },
    { data: participants },
  ] = await Promise.all([
    supabase
      .from('learning_modules')
      .select('id, title, category, summary_markdown')
      .order('created_at', { ascending: true }),
    supabase
      .from('crop_sop_templates')
      .select('*')
      .order('crop_name', { ascending: true })
      .order('step_order', { ascending: true }),
    supabase
      .from('batch_business_summary')
      .select('*')
      .order('cohort_name', { ascending: true }),
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'peserta')
      .order('cohort_name', { ascending: true })
      .order('farm_group', { ascending: true }),
  ])

  const totalHarvestClass =
    cohortSummary?.reduce((acc, row) => acc + Number(row.total_harvest_kg || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-600 hover:bg-amber-600 text-white">Mentor & Koordinator</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Panel Manajemen Kelas</h1>
          <p className="text-sm text-stone-500">
            Kelola kurikulum, master SOP komoditas, dan pantau progres budidaya seluruh angkatan.
          </p>
        </div>
        <AdminActionForms />
      </div>

      {/* Ringkasan KPI Kelas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500">Total Peserta</p>
              <p className="text-xl font-bold text-stone-900">{participants?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500">Batch Aktif</p>
              <p className="text-xl font-bold text-stone-900">{cohortSummary?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500">Panen Kelas</p>
              <p className="text-xl font-bold text-stone-900">{totalHarvestClass} kg</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-stone-100 text-stone-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500">Modul Materi</p>
              <p className="text-xl font-bold text-stone-900">{modules?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigasi Utama agar Tampilan Simpel & Terfokus */}
      <Tabs defaultValue="kurikulum" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-stone-200/70">
          <TabsTrigger value="kurikulum">Kurikulum & SOP</TabsTrigger>
          <TabsTrigger value="monitoring">Kebun & Peserta</TabsTrigger>
        </TabsList>

        {/* TAB 1: MATERI & TEMPLATE SOP */}
        <TabsContent value="kurikulum" className="mt-4">
          <AdminCurriculumManager modules={modules || []} sopTemplates={sopTemplates || []} />
        </TabsContent>

        {/* TAB 2: REKAPITULASI KEBUN & DIREKTORI PESERTA */}
        <TabsContent value="monitoring" className="mt-4 space-y-6">
          <Card className="border-stone-200/80 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Rekapitulasi Tanaman & Panen Kelompok</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase">
                    <th className="py-2.5 px-3">Angkatan & Kelompok</th>
                    <th className="py-2.5 px-3">Komoditas</th>
                    <th className="py-2.5 px-3">Populasi Hidup</th>
                    <th className="py-2.5 px-3">Panen</th>
                    <th className="py-2.5 px-3">HPP / kg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {cohortSummary && cohortSummary.length > 0 ? (
                    cohortSummary.map((row: any) => (
                      <tr key={row.batch_id} className="hover:bg-stone-50/80">
                        <td className="py-2.5 px-3 font-medium">
                          {row.cohort_name} • {row.farm_group}
                          <span className="block text-xs text-stone-400 font-normal">PIC: {row.owner_name}</span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-stone-800">{row.crop_name}</td>
                        <td className="py-2.5 px-3 text-stone-600">
                          {row.current_alive_count} / {row.initial_plant_count} btg
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700">{row.total_harvest_kg} kg</td>
                        <td className="py-2.5 px-3 text-stone-700">
                          Rp {Number(row.hpp_per_kg).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-stone-400 text-xs">
                        Belum ada data tanaman kelompok yang didaftarkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-stone-200/80 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Direktori Peserta Terdaftar ({participants?.length || 0} Orang)
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase">
                    <th className="py-2.5 px-3">Nama Peserta</th>
                    <th className="py-2.5 px-3">Angkatan</th>
                    <th className="py-2.5 px-3">Kelompok</th>
                    <th className="py-2.5 px-3">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {participants && participants.length > 0 ? (
                    participants.map((p: any) => {
                      const cleanPhone = p.phone_number?.replace(/[^0-9]/g, '').replace(/^0/, '62')
                      return (
                        <tr key={p.id} className="hover:bg-stone-50/80">
                          <td className="py-2.5 px-3 font-medium text-stone-800">{p.full_name}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="text-xs font-normal">
                              {p.cohort_name || '-'}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-stone-600">{p.farm_group || '-'}</td>
                          <td className="py-2.5 px-3">
                            {cleanPhone ? (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> {p.phone_number}
                              </a>
                            ) : (
                              <span className="text-xs text-stone-400">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-stone-400 text-xs">
                        Belum ada peserta yang mendaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}