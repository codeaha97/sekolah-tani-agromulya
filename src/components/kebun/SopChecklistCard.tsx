'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Circle,
  Plus,
  ListChecks,
  Sparkles,
  CalendarClock,
  Trash2,
} from 'lucide-react'
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

export function SopChecklistCard({
  batchId,
  cropName,
  plantingDate,
  steps,
  canEdit,
}: SopChecklistCardProps) {
  const [newStep, setNewStep] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const todayStr = new Date().toISOString().split('T')[0]
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

  const handleDeleteStep = async (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation()
    if (!canEdit) return
    setLoadingId(stepId)
    await supabase.from('batch_sop_progress').delete().eq('id', stepId)
    setLoadingId(null)
    router.refresh()
  }

  const handleSyncFromTemplate = async () => {
    if (!canEdit) return
    setSyncing(true)
    let { data: templates } = await supabase
      .from('crop_sop_templates')
      .select('*')
      .ilike('crop_name', cropName)
      .order('step_order', { ascending: true })

    if (!templates || templates.length === 0) {
      const { data: partial } = await supabase
        .from('crop_sop_templates')
        .select('*')
        .ilike('crop_name', `%${cropName}%`)
        .order('step_order', { ascending: true })
      templates = partial
    }

    if (templates && templates.length > 0) {
      const generatedSteps = templates.map((t) => {
        const target = new Date(plantingDate)
        target.setDate(target.getDate() + Number(t.target_hst || 0))
        return {
          batch_id: batchId,
          sop_template_id: t.id,
          custom_step_name: `${t.phase_name} (HST ${t.target_hst})`,
          target_date: target.toISOString().split('T')[0],
          is_completed: false,
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
      custom_step_name: newStep.trim(),
      target_date: targetDate || null,
    })

    setNewStep('')
    setTargetDate('')
    setAdding(false)
    router.refresh()
  }

  return (
    <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
      <CardHeader className="pb-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-700" />
              Tahapan SOP &amp; Jadwal Perawatan
            </CardTitle>
            <p className="text-xs text-stone-500 mt-0.5">
              Selesai: <strong className="text-stone-800 tabular-nums">{completedCount}</strong> dari{' '}
              <span className="tabular-nums">{steps.length}</span> tahapan
            </p>
          </div>
          <Badge
            variant="secondary"
            className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-bold text-xs tabular-nums"
          >
            {progressPct}%
          </Badge>
        </div>

        {/* Progress Bar SOP */}
        {steps.length > 0 && (
          <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.length > 0 ? (
          <div className="space-y-2">
            {steps.map((step) => {
              const isOverdue = !step.is_completed && step.target_date && step.target_date < todayStr
              const isToday = !step.is_completed && step.target_date === todayStr

              return (
                <div
                  key={step.id}
                  role={canEdit ? 'button' : undefined}
                  tabIndex={canEdit ? 0 : undefined}
                  onClick={() => handleToggleStep(step)}
                  onKeyDown={(e) => {
                    if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      handleToggleStep(step)
                    }
                  }}
                  className={`w-full text-left flex items-start justify-between gap-2.5 p-3 rounded-xl border transition-all ${
                    step.is_completed
                      ? 'bg-emerald-50/50 border-emerald-200/80 text-stone-500'
                      : 'bg-white border-stone-200/90 hover:border-emerald-400 text-stone-800 shadow-2xs'
                  } ${!canEdit ? 'cursor-default' : 'cursor-pointer'} ${
                    loadingId === step.id ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {step.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-300 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-semibold leading-snug ${
                          step.is_completed ? 'line-through text-stone-400' : 'text-stone-800'
                        }`}
                      >
                        {step.custom_step_name}
                      </p>
                      {step.is_completed && step.completer?.full_name && (
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Ditandai selesai oleh {step.completer.full_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {step.target_date && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold tabular-nums ${
                          step.is_completed
                            ? 'bg-white/80 border-stone-200 text-stone-400'
                            : isOverdue
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : isToday
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-stone-50 border-stone-200 text-stone-600'
                        }`}
                      >
                        <CalendarClock className="w-3 h-3" />
                        {isToday ? 'Hari Ini' : step.target_date}
                      </span>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteStep(e, step.id)}
                        title="Hapus tahapan"
                        className="p-1 rounded-md text-stone-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center space-y-2.5">
            <p className="text-xs text-stone-500">Belum ada tahapan SOP terjadwal untuk batch ini.</p>
            {canEdit && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={syncing}
                onClick={handleSyncFromTemplate}
                className="rounded-lg border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 font-semibold text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                {syncing ? 'Memuat SOP...' : `Muat Template SOP ${cropName}`}
              </Button>
            )}
          </div>
        )}

        {canEdit && (
          <form
            onSubmit={handleAddCustomStep}
            className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row gap-2"
          >
            <Input
              placeholder="Tambah tahapan perawatan kustom..."
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              className="text-xs sm:text-sm h-9 rounded-lg flex-1"
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="text-xs sm:text-sm h-9 rounded-lg w-full sm:w-auto"
              />
              <Button
                type="submit"
                size="sm"
                disabled={adding || !newStep.trim()}
                variant="outline"
                className="h-9 px-3 rounded-lg font-semibold text-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}