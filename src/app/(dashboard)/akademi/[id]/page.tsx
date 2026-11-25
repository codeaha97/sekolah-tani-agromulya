import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MindMapViewer } from '@/components/akademi/MindMapViewer'
import { ModuleDiscussionBoard } from '@/components/akademi/ModuleDiscussionBoard'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Network, BookOpen, MessageSquare } from 'lucide-react'

export default async function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: mod }, { data: currentProfile }, { data: rawDiscussions }, { data: allProfiles }] =
    await Promise.all([
      supabase.from('learning_modules').select('*').eq('id', id).single(),
      supabase.from('profiles').select('role').eq('id', user.id).single(),
      supabase
        .from('module_discussions')
        .select('*')
        .eq('module_id', id)
        .order('created_at', { ascending: true }),
      supabase.from('profiles').select('id, full_name, role, cohort_name, farm_group'),
    ])

  if (!mod) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <BookOpen className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-stone-800">Materi tidak ditemukan.</p>
        <Link
          href="/akademi"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Akademi
        </Link>
      </div>
    )
  }

  const isAdmin = ['admin', 'mentor'].includes(currentProfile?.role || '')
  const profileMap = new Map((allProfiles || []).map((p: any) => [p.id, p]))

  // Urutkan utas utama terbaru di atas, sementara balasan tetap kronologis
  const discussions = (rawDiscussions || [])
    .map((item: any) => ({
      ...item,
      author: profileMap.get(item.user_id) || null,
    }))
    .sort((a: any, b: any) => {
      if (!a.parent_id && !b.parent_id) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

  return (
    <div className="space-y-5">
      {/* Navigasi Kembali & Header Modul */}
      <div className="space-y-3 pb-3 border-b border-stone-200">
        <Link
          href="/akademi"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog Materi
        </Link>

        <div className="space-y-1.5">
          <Badge className="rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 text-[11px] font-semibold">
            {mod.category}
          </Badge>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 leading-snug">
            {mod.title}
          </h1>
        </div>
      </div>

      {/* Tab Ringkasan, Mind Map & Forum Diskusi */}
      <Tabs defaultValue="ringkasan" className="w-full">
        <TabsList className="flex w-full sm:w-fit h-auto p-1 bg-stone-200/80 rounded-lg gap-1">
          <TabsTrigger
            value="ringkasan"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md px-3 sm:px-4 py-2 text-xs font-semibold whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" /> Ringkasan
          </TabsTrigger>
          <TabsTrigger
            value="mindmap"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md px-3 sm:px-4 py-2 text-xs font-semibold whitespace-nowrap"
          >
            <Network className="w-3.5 h-3.5" /> Mind Map
          </TabsTrigger>
          <TabsTrigger
            value="diskusi"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md px-3 sm:px-4 py-2 text-xs font-semibold whitespace-nowrap"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Diskusi ({discussions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="mt-4">
          <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs overflow-hidden">
            <div className="px-4 sm:px-6 py-3 bg-stone-50/80 border-b border-stone-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Catatan &amp; Intisari Pembelajaran
              </span>
            </div>
            <div className="p-4 sm:p-6 prose prose-stone max-w-none text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {mod.summary_markdown || 'Belum ada ringkasan tertulis untuk materi ini.'}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mindmap" className="mt-4">
          <MindMapViewer
            moduleId={mod.id}
            initialNodes={mod.mindmap_json?.nodes}
            initialEdges={mod.mindmap_json?.edges}
          />
        </TabsContent>

        <TabsContent value="diskusi" className="mt-4">
          <ModuleDiscussionBoard
            moduleId={mod.id}
            currentUserId={user.id}
            isAdmin={isAdmin}
            discussions={discussions}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}