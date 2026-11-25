'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Send,
  CornerDownRight,
  Trash2,
  Check,
  AlertCircle,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export interface DiscussionItem {
  id: string
  module_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  author?: {
    full_name: string
    role: string
    cohort_name?: string | null
    farm_group?: string | null
  } | null
}

interface ModuleDiscussionBoardProps {
  moduleId: string
  currentUserId: string
  isAdmin: boolean
  discussions: DiscussionItem[]
}

const formatTimeAgo = (isoString: string) => {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function ModuleDiscussionBoard({
  moduleId,
  currentUserId,
  isAdmin,
  discussions,
}: ModuleDiscussionBoardProps) {
  const supabase = createClient()
  const router = useRouter()

  const [newContent, setNewContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<DiscussionItem | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Pisahkan topik utama dan balasan
  const rootThreads = discussions.filter((d) => !d.parent_id)
  const repliesByParent = discussions.reduce<Record<string, DiscussionItem[]>>((acc, item) => {
    if (item.parent_id) {
      if (!acc[item.parent_id]) acc[item.parent_id] = []
      acc[item.parent_id].push(item)
    }
    return acc
  }, {})

  const handlePostThread = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim()) return
    setSubmitting(true)
    setErrorMsg('')

    const { error } = await supabase.from('module_discussions').insert({
      module_id: moduleId,
      user_id: currentUserId,
      parent_id: null,
      content: newContent.trim(),
    })

    setSubmitting(false)
    if (error) {
      setErrorMsg(`Gagal mengirim pesan: ${error.message}`)
      return
    }

    setNewContent('')
    router.refresh()
  }

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyingTo || !replyContent.trim()) return
    setSubmitting(true)
    setErrorMsg('')

    const { error } = await supabase.from('module_discussions').insert({
      module_id: moduleId,
      user_id: currentUserId,
      parent_id: replyingTo.id,
      content: replyContent.trim(),
    })

    setSubmitting(false)
    if (error) {
      setErrorMsg(`Gagal mengirim balasan: ${error.message}`)
      return
    }

    setReplyContent('')
    setReplyingTo(null)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId((prev) => (prev === id ? null : prev)), 4000)
      return
    }

    setDeletingId(id)
    await supabase.from('module_discussions').delete().eq('id', id)
    setDeletingId(null)
    setConfirmDeleteId(null)
    router.refresh()
  }

  const renderAuthorBadge = (author?: DiscussionItem['author']) => {
    const isMentor = ['admin', 'mentor'].includes(author?.role || '')
    if (isMentor) {
      return (
        <Badge className="rounded-md bg-amber-100 text-amber-900 hover:bg-amber-100 border border-amber-200/80 text-[10px] py-0 px-1.5 font-semibold">
          Mentor / Admin
        </Badge>
      )
    }
    if (author?.farm_group) {
      return (
        <Badge variant="outline" className="rounded-md text-[10px] py-0 px-1.5 font-normal text-stone-500">
          {author.cohort_name ? `${author.cohort_name} • ` : ''}
          {author.farm_group}
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Form Pertanyaan / Diskusi Baru */}
      <form
        onSubmit={handlePostThread}
        className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs space-y-3"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
          <MessageSquare className="w-4 h-4 text-emerald-700" />
          <span>Ajukan Pertanyaan atau Bagikan Pengalaman Praktik</span>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <textarea
          rows={3}
          placeholder="Tulis pertanyaan teknis seputar materi ini atau kendala saat praktik di lahan..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="w-full rounded-lg border border-stone-200 p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-600"
          required
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting || !newContent.trim()}
            className="h-9 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {submitting ? 'Mengirim...' : 'Kirim ke Forum'}
          </Button>
        </div>
      </form>

      {/* Daftar Utas Diskusi */}
      {rootThreads.length > 0 ? (
        <div className="space-y-3">
          {rootThreads.map((thread) => {
            const replies = repliesByParent[thread.id] || []
            const canDeleteRoot = isAdmin || thread.user_id === currentUserId
            const isReplyingThis = replyingTo?.id === thread.id

            return (
              <div
                key={thread.id}
                className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs space-y-3"
              >
                {/* Komentar Utama */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900">
                        {thread.author?.full_name || 'Peserta Kelas'}
                      </span>
                      {renderAuthorBadge(thread.author)}
                      <span className="text-[11px] text-stone-400 tabular-nums">
                        • {formatTimeAgo(thread.created_at)}
                      </span>
                    </div>

                    {canDeleteRoot && (
                      <button
                        type="button"
                        disabled={deletingId === thread.id}
                        onClick={() => handleDelete(thread.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 ${
                          confirmDeleteId === thread.id
                            ? 'bg-red-600 text-white'
                            : 'text-stone-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {confirmDeleteId === thread.id ? (
                          <>
                            <Check className="w-3 h-3" /> Yakin?
                          </>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                    {thread.content}
                  </p>

                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(isReplyingThis ? null : thread)
                        setReplyContent('')
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      {isReplyingThis ? 'Tutup Balasan' : `Balas (${replies.length})`}
                    </button>
                  </div>
                </div>

                {/* Form Balas Inline */}
                {isReplyingThis && (
                  <form
                    onSubmit={handlePostReply}
                    className="pl-3 sm:pl-4 border-l-2 border-emerald-300 space-y-2 pt-1"
                  >
                    <textarea
                      rows={2}
                      autoFocus
                      placeholder={`Tulis balasan untuk ${thread.author?.full_name || 'peserta'}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setReplyingTo(null)}
                        className="h-8 px-2.5 text-xs text-stone-500"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Batal
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={submitting || !replyContent.trim()}
                        className="h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold"
                      >
                        {submitting ? 'Mengirim...' : 'Kirim Balasan'}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Daftar Balasan */}
                {replies.length > 0 && (
                  <div className="space-y-2.5 pl-3 sm:pl-4 border-l-2 border-stone-200 pt-1">
                    {replies.map((rep) => {
                      const isMentorReply = ['admin', 'mentor'].includes(rep.author?.role || '')
                      const canDeleteReply = isAdmin || rep.user_id === currentUserId

                      return (
                        <div
                          key={rep.id}
                          className={`p-3 rounded-xl text-xs space-y-1.5 ${
                            isMentorReply
                              ? 'bg-amber-50/70 border border-amber-200/80'
                              : 'bg-stone-50 border border-stone-200/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-stone-900">
                                {rep.author?.full_name || 'Peserta'}
                              </span>
                              {renderAuthorBadge(rep.author)}
                              <span className="text-[10px] text-stone-400 tabular-nums">
                                • {formatTimeAgo(rep.created_at)}
                              </span>
                            </div>

                            {canDeleteReply && (
                              <button
                                type="button"
                                disabled={deletingId === rep.id}
                                onClick={() => handleDelete(rep.id)}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 ${
                                  confirmDeleteId === rep.id
                                    ? 'bg-red-600 text-white'
                                    : 'text-stone-400 hover:text-red-600'
                                }`}
                              >
                                {confirmDeleteId === rep.id ? 'Yakin?' : <Trash2 className="w-3 h-3" />}
                              </button>
                            )}
                          </div>

                          <p className="text-stone-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                            {rep.content}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-dashed border-stone-300 text-center space-y-1.5">
          <p className="text-sm font-medium text-stone-700">Belum ada diskusi pada materi ini</p>
          <p className="text-xs text-stone-500">
            Jadilah yang pertama bertanya atau berbagi hasil praktik lapangan dengan mentor dan teman sekelas.
          </p>
        </div>
      )}
    </div>
  )
}