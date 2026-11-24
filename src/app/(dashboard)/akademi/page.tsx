import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Network, ArrowRight, BookOpen } from 'lucide-react'
import { AdminActionForms } from '@/components/admin/AdminActionForms'
import { AdminCurriculumManager } from '@/components/admin/AdminCurriculumManager'

export default async function AkademiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: rawModules }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('learning_modules').select('*').order('created_at', { ascending: true }),
  ])

  // Urutkan materi secara natural berdasarkan awalan nomor judul (1., 2., 3., ..., 10.)
  const modules = [...(rawModules || [])].sort((a, b) =>
    (a.title || '').localeCompare(b.title || '', 'id', {
      numeric: true,
      sensitivity: 'base',
    })
  )

  const isAdmin = ['admin', 'mentor'].includes(profile?.role || '')

  const renderModuleGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
      {modules.length > 0 ? (
        modules.map((mod, idx) => (
          <Link key={mod.id} href={`/akademi/${mod.id}`} className="group block h-full">
            <Card className="h-full rounded-xl border-stone-200/90 shadow-2xs bg-white group-hover:border-emerald-500 group-hover:shadow-sm transition-all flex flex-col justify-between">
              <CardHeader className="pb-2.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-stone-400 tabular-nums">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <Badge
                      variant="secondary"
                      className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 hover:bg-emerald-50 text-[11px] font-medium"
                    >
                      {mod.category}
                    </Badge>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-stone-100 group-hover:bg-emerald-50 text-stone-500 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                    <Network className="w-3.5 h-3.5" />
                  </div>
                </div>
                <CardTitle className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors leading-snug">
                  {mod.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                  {mod.summary_markdown || 'Klik untuk membaca ringkasan materi dan membuka peta konsep interaktif.'}
                </p>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>Buka Materi &amp; Mind Map</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      ) : (
        <div className="col-span-full bg-white p-8 rounded-xl border border-dashed border-stone-300 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-stone-700">Belum ada materi pembelajaran</p>
          <p className="text-xs text-stone-500">Materi kelas dan peta konsep akan muncul setelah dipublikasikan mentor.</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            Akademi &amp; Mind Mapping
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Ringkasan materi kelas dan peta konsep budidaya organik Agro Mulya.
          </p>
        </div>

        {isAdmin && <AdminActionForms mode="module" />}
      </div>

      {isAdmin ? (
        <Tabs defaultValue="katalog" className="w-full">
          <TabsList className="flex w-full sm:w-fit h-auto p-1 bg-stone-200/80 rounded-lg gap-1">
            <TabsTrigger
              value="katalog"
              className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
            >
              Katalog ({modules.length})
            </TabsTrigger>
            <TabsTrigger
              value="kelola"
              className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
            >
              Kelola Materi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="katalog" className="mt-4">
            {renderModuleGrid()}
          </TabsContent>

          <TabsContent value="kelola" className="mt-4">
            <AdminCurriculumManager modules={modules} mode="module" />
          </TabsContent>
        </Tabs>
      ) : (
        renderModuleGrid()
      )}
    </div>
  )
}