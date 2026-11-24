'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function DeleteBatchButton({
  batchId,
  redirectAfter = false,
}: {
  batchId: string
  redirectAfter?: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setErrorMsg('')

    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 4000)
      return
    }

    setDeleting(true)
    const { error } = await supabase.from('batches').delete().eq('id', batchId)
    setDeleting(false)

    if (error) {
      setErrorMsg('Gagal menghapus')
      setConfirming(false)
      return
    }

    if (redirectAfter) {
      router.push('/kebun')
    }
    router.refresh()
  }

  return (
    <div
      className="inline-flex items-center gap-1 relative z-20"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Button
        type="button"
        variant={confirming ? 'destructive' : 'ghost'}
        size="sm"
        disabled={deleting}
        onClick={handleDelete}
        className={
          confirming
            ? 'h-8 px-2.5 rounded-lg text-xs font-semibold'
            : 'h-8 px-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50'
        }
        title="Hapus data tanaman ini"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {confirming && <span className="ml-1.5">{deleting ? 'Menghapus...' : 'Yakin Hapus?'}</span>}
      </Button>

      {confirming && !deleting && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setConfirming(false)
          }}
          className="h-8 w-8 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 flex items-center justify-center"
          title="Batal"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {errorMsg && <span className="text-[11px] font-medium text-red-600">{errorMsg}</span>}
    </div>
  )
}