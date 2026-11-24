'use client'

import { useState } from 'react'
import { MessageSquare, Trash2, Check, X, AlertCircle } from 'lucide-react'
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
  const [errorMsg, setErrorMsg] = useState('')

  const supabase = createClient()
  const router = useRouter()

  const handleSaveFeedback = async () => {
    setSaving(true)
    setErrorMsg('')
    const { error } = await supabase
      .from('monitoring_logs')
      .update({ mentor_feedback: feedback.trim() || null })
      .eq('id', logId)

    setSaving(false)
    if (error) {
      setErrorMsg(`Gagal menyimpan arahan: ${error.message}`)
      return
    }
    setEditing(false)
    router.refresh()
  }

  const handleDeleteLog = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    setSaving(true)
    setErrorMsg('')
    const { error } = await supabase.from('monitoring_logs').delete().eq('id', logId)
    setSaving(false)

    if (error) {
      setErrorMsg(`Gagal menghapus log: ${error.message}`)
      setConfirmDelete(false)
      return
    }
    router.refresh()
  }

  return (
    <div className="pt-2 border-t border-stone-100 space-y-2">
      {errorMsg && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-700 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!editing ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setEditing(true)
              setConfirmDelete(false)
              setErrorMsg('')
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
            {initialFeedback ? 'Edit Arahan Mentor' : 'Beri Arahan Mentor'}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleDeleteLog}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
              confirmDelete
                ? 'bg-red-600 text-white'
                : 'text-stone-400 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete ? 'Yakin Hapus Log?' : 'Hapus'}
          </button>

          {confirmDelete && !saving && (
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-700"
              title="Batal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
          <input
            type="text"
            autoFocus
            placeholder="Tulis rekomendasi / koreksi teknis untuk kelompok..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveFeedback()}
            className="h-9 px-3 text-xs bg-white border border-stone-200 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <div className="flex items-center gap-1.5 justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveFeedback}
              className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-9 px-2.5 rounded-lg text-xs font-medium text-stone-500 hover:bg-stone-100"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MentorLogActions