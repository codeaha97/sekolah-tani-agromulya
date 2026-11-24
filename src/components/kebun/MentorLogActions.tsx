'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquarePlus, Trash2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function MentorLogActions({
  logId,
  initialFeedback,
}: {
  logId: string
  initialFeedback?: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [feedback, setFeedback] = useState(initialFeedback || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleSaveFeedback = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('monitoring_logs')
      .update({ mentor_feedback: feedback.trim() || null })
      .eq('id', logId)

    setSaving(false)
    if (error) {
      alert(`Gagal menyimpan arahan: ${error.message}`)
      return
    }
    setEditing(false)
    router.refresh()
  }

  const handleDeleteLog = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3500)
      return
    }
    setSaving(true)
    await supabase.from('monitoring_logs').delete().eq('id', logId)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="pt-1.5 space-y-2">
      {!editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors"
          >
            <MessageSquarePlus className="w-3 h-3" />
            {initialFeedback ? 'Edit Arahan Mentor' : 'Beri Arahan Mentor'}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleDeleteLog}
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors ${
              confirmDelete
                ? 'bg-red-600 text-white'
                : 'text-stone-400 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 className="w-3 h-3" />
            {confirmDelete ? 'Yakin Hapus Log?' : 'Hapus'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <Input
            autoFocus
            placeholder="Tulis rekomendasi / koreksi teknis untuk kelompok..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveFeedback()}
            className="h-8 text-xs bg-white"
          />
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={handleSaveFeedback}
            className="h-8 px-2.5 text-xs bg-emerald-700 hover:bg-emerald-800 shrink-0"
          >
            <Check className="w-3.5 h-3.5 mr-1" /> Simpan
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setEditing(false)}
            className="h-8 px-2 text-xs text-stone-500 shrink-0"
          >
            Batal
          </Button>
        </div>
      )}
    </div>
  )
}