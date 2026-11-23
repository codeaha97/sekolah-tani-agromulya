import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Network } from 'lucide-react'

export default async function AkademiPage() {
  const supabase = await createClient()
  const { data: modules } = await supabase.from('learning_modules').select('*').order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Akademi & Mind Mapping</h1>
        <p className="text-sm text-stone-500">Ringkasan materi kelas dan peta konsep budidaya organik Agro Mulya.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules?.map((mod) => (
          <Link key={mod.id} href={`/akademi/${mod.id}`}>
            <Card className="h-full hover:border-emerald-500 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-800">
                    {mod.category}
                  </Badge>
                  <Network className="w-4 h-4 text-stone-400" />
                </div>
                <CardTitle className="text-base">{mod.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-stone-500 line-clamp-2">
                  {mod.summary_markdown || 'Klik untuk membaca ringkasan dan membuka mind map interaktif.'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}