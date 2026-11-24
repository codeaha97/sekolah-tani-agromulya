import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Network, ArrowRight } from 'lucide-react'
import { AdminActionForms } from '@/components/admin/AdminActionForms'
import { AdminCurriculumManager } from '@/components/admin/AdminCurriculumManager'

export default async function AkademiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: modules }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('learning_modules').select('*').order('created_at', { ascending: true }),
  ])

  const isAdmin = ['admin', 'mentor'].includes(profile?.role || '')

  const renderModuleGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {modules && modules.length > 0 ? (
        modules.map((mod) => (
          <Link key={mod.id} href={`/akademi/${mod.id}`}>
            <Card className="h-full border-stone-200/90 shadow-none hover:border-emerald-500 transition-colors cursor-pointer flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
                    {mod.category}
                  </Badge>
                  <Network className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base text-stone-900">{mod.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-stone-500 line-clamp-2">
                  {mod.summary_markdown || 'Klik untuk membaca ringkasan dan membuka mind map interaktif.'}
                </p>
                <div className="flex items-center text-xs font-medium text-emerald-700 pt-1">
                  Buka Materi & Peta Konsep <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      ) : (
        <p className="col-span-full text-sm text-stone-500 bg-white p-8 rounded-xl border border-dashed border-stone-300 text-center">
          Belum ada materi pembelajaran yang dipublikasikan.
        </p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Akademi & Mind Mapping</h1>
          <p className="text-sm text-stone-500">
            Ringkasan materi kelas dan peta konsep budidaya organik Agro Mulya.
          </p>
        </div>

        {isAdmin && <AdminActionForms mode="module" />}
      </div>

      {isAdmin ? (
        <Tabs defaultValue="katalog" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-stone-200/70">
            <TabsTrigger value="katalog">Katalog Materi ({modules?.length || 0})</TabsTrigger>
            <TabsTrigger value="kelola">Kelola Materi (Edit / Hapus)</TabsTrigger>
          </TabsList>

          <TabsContent value="katalog" className="mt-4">
            {renderModuleGrid()}
          </TabsContent>

          <TabsContent value="kelola" className="mt-4">
            <AdminCurriculumManager modules={modules || []} mode="module" />
          </TabsContent>
        </Tabs>
      ) : (
        renderModuleGrid()
      )}
    </div>
  )
}