import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MindMapViewer } from '@/components/akademi/MindMapViewer'
import { Badge } from '@/components/ui/badge'

export default async function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: mod } = await supabase.from('learning_modules').select('*').eq('id', id).single()

  if (!mod) return <p>Materi tidak ditemukan.</p>

  return (
    <div className="space-y-5">
      <div>
        <Badge className="bg-emerald-700 mb-2">{mod.category}</Badge>
        <h1 className="text-2xl font-bold text-stone-900">{mod.title}</h1>
      </div>

      <Tabs defaultValue="ringkasan" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ringkasan">Ringkasan Materi</TabsTrigger>
          <TabsTrigger value="mindmap">Mind Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="mt-4">
          <div className="bg-white p-5 rounded-xl border border-stone-200 prose prose-stone max-w-none text-sm leading-relaxed whitespace-pre-line">
            {mod.summary_markdown || 'Belum ada ringkasan tertulis untuk materi ini.'}
          </div>
        </TabsContent>

        <TabsContent value="mindmap" className="mt-4">
          <MindMapViewer
            moduleId={mod.id}
            initialNodes={mod.mindmap_json?.nodes}
            initialEdges={mod.mindmap_json?.edges}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}