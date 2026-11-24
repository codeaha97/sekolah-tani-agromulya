'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Plus, ListChecks, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export interface SopStepItem {
  id: string
  custom_step_name: string
  target_date: string | null
  is_completed: boolean
  completed_at: string | null
  completer?: { full_name: string } | null
}

interface SopChecklistCardProps {
  batchId: string
  cropName: string
  plantingDate: string
  steps: SopStepItem[]
  canEdit: boolean
}

export function SopChecklistCard({ batchId, cropName, plantingDate, steps, canEdit }: SopChecklistCardProps) {
  const [newStep, setNewStep] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const completedCount = steps.filter((s) => s.is_completed).length
  const progressPct = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0

  const handleToggleStep = async (step: SopStepItem) => {
    if (!canEdit) return
    setLoadingId(step.id)
    const { data: { user } } = await supabase.auth.getUser()

    const nextStatus = !step.is_completed
    await supabase
      .from('batch_sop_progress')
      .update({
        is_completed: nextStatus,
        completed_at: nextStatus ? new Date().toISOString() : null,
        completed_by: nextStatus ? user?.id : null,
      })
      .eq('id', step.id)

    setLoadingId(null)
    router.refresh()
  }

  const handleSyncFromTemplate = async () => {
    if (!canEdit) return
    setSyncing(true)
    const { data: templates } = await supabase
      .from('crop_sop_templates')
      .select('*')
      .eq('crop_name', cropName)
      .order('step_order', { ascending: true })

    if (templates && templates.length > 0) {
      const generatedSteps = templates.map((t) => {
        const target = new Date(plantingDate)
        target.setDate(target.getDate() + t.target_hst)
        return {
          batch_id: batchId,
          sop_template_id: t.id,
          custom_step_name: `${t.phase_name} (HST ${t.target_hst})`,
          target_date: target.toISOString().split('T')[0],
        }
      })
      await supabase.from('batch_sop_progress').insert(generatedSteps)
    }

    setSyncing(false)
    router.refresh()
  }

  const handleAddCustomStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStep.trim() || !canEdit) return
    setAdding(true)

    await supabase.from('batch_sop_progress').insert({
      batch_id: batchId,
      custom_step_name: newStep,
      target_date: targetDate || null,
    })

    setNewStep('')
    setTargetDate('')
    setAdding(false)
    router.refresh()
  }

  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-emerald-700" /> Tahapan SOP & Jadwal Perawatan
          </CardTitle>
          <p className="text-xs text-stone-500 mt-0.5">
            Selesai: <strong>{completedCount}</strong> dari {steps.length} tahapan ({progressPct}%)
          </p>
        </div>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-800">
          {progressPct}%
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.length > 0 ? (
          <div className="space-y-2">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                disabled={!canEdit || loadingId === step.id}
                onClick={() => handleToggleStep(step)}
                className={`w-full text-left flex items-start justify-between gap-3 p-3 rounded-xl border transition-colors ${
                  step.is_completed
                    ? 'bg-emerald-50/60 border-emerald-200 text-stone-600'
                    : 'bg-white border-stone-200 hover:border-emerald-400 text-stone-800'
                } ${!canEdit ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-2.5">
                  {step.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${step.is_completed ? 'line-through text-stone-500' : ''}`}>
                      {step.custom_step_name}
                    </p>
                    {step.is_completed && step.completer?.full_name && (
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Ditandai selesai oleh {step.completer.full_name}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-stone-400 shrink-0">{step.target_date || '-'}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center space-y-2">
            <p className="text-xs text-stone-500">Belum ada tahapan SOP terjadwal untuk batch ini.</p>
            {canEdit && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={syncing}
                onClick={handleSyncFromTemplate}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {syncing ? 'Memuat SOP...' : `Muat Template SOP ${cropName}`}
              </Button>
            )}
          </div>
        )}

        {canEdit && (
          <form onSubmit={handleAddCustomStep} className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Tambah tahapan perawatan kustom..."
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="text-sm w-auto"
              />
              <Button type="submit" size="sm" disabled={adding} variant="outline" className="shrink-0">
                <Plus className="w-4 h-4 mr-1" /> Tambah
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}