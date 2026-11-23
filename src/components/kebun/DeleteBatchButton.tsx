'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function DeleteBatchButton({ batchId, redirectAfter = false }: { batchId: string; redirectAfter?: boolean }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 4000)
      return
    }

    setDeleting(true)
    const { error } = await supabase.from('batches').delete().eq('id', batchId)
    setDeleting(false)

    if (error) {
      alert(`Gagal menghapus data: ${error.message}`)
      setConfirming(false)
      return
    }

    if (redirectAfter) {
      router.push('/kebun')
    }
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant={confirming ? 'destructive' : 'ghost'}
      size="sm"
      disabled={deleting}
      onClick={handleDelete}
      onPointerDown={(e) => e.stopPropagation()}
      className={confirming ? 'h-8 px-2.5 text-xs relative z-20' : 'h-8 px-2 text-stone-400 hover:text-red-600 hover:bg-red-50 relative z-20'}
      title="Hapus data tanaman ini"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {confirming && <span className="ml-1.5">{deleting ? 'Menghapus...' : 'Yakin Hapus?'}</span>}
    </Button>
  )
}