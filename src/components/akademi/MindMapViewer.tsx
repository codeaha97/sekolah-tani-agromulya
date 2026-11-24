'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Save,
  ListTree,
  Network,
  ChevronRight,
  ChevronDown,
  CornerDownRight,
  Trash2,
  Sprout,
  Pencil,
  Check,
  X,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MindMapViewerProps {
  moduleId: string
  initialNodes?: Node[]
  initialEdges?: Edge[]
  readOnly?: boolean
}

const defaultNodes: Node[] = [
  { id: '1', position: { x: 200, y: 20 }, data: { label: 'Topik Utama Materi' }, type: 'input' },
  { id: '2', position: { x: 60, y: 140 }, data: { label: 'Konsep Dasar' } },
  { id: '3', position: { x: 340, y: 140 }, data: { label: 'Aplikasi Lapangan' } },
]

const defaultEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
]

function styleNode(node: Node, isRoot: boolean): Node {
  return {
    ...node,
    style: isRoot
      ? {
          background: '#065f46',
          color: '#ffffff',
          border: '2px solid #047857',
          borderRadius: '12px',
          padding: '10px 16px',
          fontWeight: 700,
          fontSize: '13px',
          boxShadow: '0 4px 10px -2px rgba(6, 95, 70, 0.25)',
        }
      : {
          background: '#ffffff',
          color: '#1c1917',
          border: '1.5px solid #a7f3d0',
          borderRadius: '10px',
          padding: '8px 14px',
          fontWeight: 500,
          fontSize: '12px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        },
  }
}

export function MindMapViewer({ moduleId, initialNodes, initialEdges, readOnly = false }: MindMapViewerProps) {
  const rawNodes = initialNodes?.length ? initialNodes : defaultNodes
  const rawEdges = initialEdges?.length ? initialEdges : defaultEdges

  const [viewMode, setViewMode] = useState<'tree' | 'canvas'>('tree')
  const [nodes, setNodes, onNodesChange] = useNodesState(
    rawNodes.map((n, idx) => styleNode(n, idx === 0 || n.type === 'input'))
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges)

  // State tambah & edit cabang di Tree View
  const [addingUnderId, setAddingUnderId] = useState<string | null>(null)
  const [newBranchLabel, setNewBranchLabel] = useState('')
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingNodeLabel, setEditingNodeLabel] = useState('')
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)

  const supabase = createClient()

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  )

  const treeStructure = useMemo(() => {
    const targetIds = new Set(edges.map((e) => e.target))
    const roots = nodes.filter((n) => !targetIds.has(n.id))
    const effectiveRoots = roots.length > 0 ? roots : nodes.slice(0, 1)

    const childrenMap: Record<string, Node[]> = {}
    edges.forEach((edge) => {
      const childNode = nodes.find((n) => n.id === edge.target)
      if (childNode) {
        if (!childrenMap[edge.source]) childrenMap[edge.source] = []
        if (!childrenMap[edge.source].some((c) => c.id === childNode.id)) {
          childrenMap[edge.source].push(childNode)
        }
      }
    })

    return { roots: effectiveRoots, childrenMap }
  }, [nodes, edges])

  const handleAddChildNode = (parentId: string) => {
    if (!newBranchLabel.trim()) return
    const newId = `node-${Date.now()}`
    const parentNode = nodes.find((n) => n.id === parentId)
    const siblingCount = treeStructure.childrenMap[parentId]?.length || 0

    const newNode = styleNode(
      {
        id: newId,
        position: {
          x: (parentNode?.position.x || 150) + (siblingCount % 2 === 0 ? -90 : 90),
          y: (parentNode?.position.y || 50) + 110,
        },
        data: { label: newBranchLabel.trim() },
      },
      false
    )

    const newEdge: Edge = {
      id: `e-${parentId}-${newId}`,
      source: parentId,
      target: newId,
      animated: true,
    }

    setNodes((prev) => [...prev, newNode])
    setEdges((prev) => [...prev, newEdge])
    setNewBranchLabel('')
    setAddingUnderId(null)
    setCollapsedIds((prev) => ({ ...prev, [parentId]: false }))
  }

  const startEditingNode = (node: Node) => {
    setEditingNodeId(node.id)
    setEditingNodeLabel(String(node.data?.label || ''))
    setAddingUnderId(null)
  }

  const handleSaveNodeEdit = (nodeId: string) => {
    if (!editingNodeLabel.trim()) return
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, label: editingNodeLabel.trim() } }
          : n
      )
    )
    setEditingNodeId(null)
    setEditingNodeLabel('')
  }

  // Hapus node beserta seluruh turunannya agar tidak menyisakan node yatim
  const handleDeleteNode = (nodeId: string) => {
    const toRemove = new Set<string>([nodeId])
    let added = true
    while (added) {
      added = false
      edges.forEach((e) => {
        if (toRemove.has(e.source) && !toRemove.has(e.target)) {
          toRemove.add(e.target)
          added = true
        }
      })
    }

    setNodes((prev) => prev.filter((n) => !toRemove.has(n.id)))
    setEdges((prev) => prev.filter((e) => !toRemove.has(e.source) && !toRemove.has(e.target)))
  }

  const handleToggleAll = (collapse: boolean) => {
    if (!collapse) {
      setCollapsedIds({})
      return
    }
    const next: Record<string, boolean> = {}
    nodes.forEach((n) => {
      if ((treeStructure.childrenMap[n.id]?.length || 0) > 0) {
        next[n.id] = true
      }
    })
    setCollapsedIds(next)
  }

  const handleSaveMap = async () => {
    setSaving(true)
    const cleanNodes = nodes.map(({ style, ...rest }) => rest)
    await supabase
      .from('learning_modules')
      .update({ mindmap_json: { nodes: cleanNodes, edges } })
      .eq('id', moduleId)
    setSaving(false)
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2500)
  }

  const renderTreeBranch = (node: Node, depth = 0, visited = new Set<string>()) => {
    if (visited.has(node.id)) return null
    visited.add(node.id)

    const children = treeStructure.childrenMap[node.id] || []
    const isCollapsed = !!collapsedIds[node.id]
    const isRoot = depth === 0
    const isEditing = editingNodeId === node.id
    const label = String(node.data?.label || 'Konsep')

    return (
      <div
        key={node.id}
        className={
          depth > 0
            ? 'ml-3.5 sm:ml-6 pl-3 border-l-2 border-emerald-200/90 space-y-2'
            : 'space-y-2.5'
        }
      >
        <div
          className={`flex items-center justify-between gap-2 p-3 rounded-xl border transition-all ${
            isRoot
              ? 'bg-emerald-900 text-white border-emerald-800 shadow-2xs'
              : depth === 1
              ? 'bg-emerald-50/70 text-emerald-950 border-emerald-200/90'
              : 'bg-white text-stone-800 border-stone-200/90 shadow-2xs'
          }`}
        >
          {isEditing ? (
            <div className="flex-1 flex items-center gap-1.5">
              <Input
                autoFocus
                value={editingNodeLabel}
                onChange={(e) => setEditingNodeLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNodeEdit(node.id)
                  if (e.key === 'Escape') setEditingNodeId(null)
                }}
                className="h-8 text-xs bg-white text-stone-900 rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleSaveNodeEdit(node.id)}
                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
                title="Simpan Teks"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditingNodeId(null)}
                className={`p-1.5 rounded-lg shrink-0 ${
                  isRoot ? 'bg-emerald-800 text-emerald-200' : 'bg-stone-100 text-stone-600'
                }`}
                title="Batal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0">
                {children.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCollapsedIds((p) => ({ ...p, [node.id]: !p[node.id] }))}
                    className={`p-0.5 rounded-md transition-colors ${
                      isRoot
                        ? 'hover:bg-emerald-800 text-emerald-200'
                        : 'hover:bg-stone-200/70 text-stone-500'
                    }`}
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                ) : isRoot ? (
                  <Sprout className="w-4 h-4 text-emerald-300 shrink-0" />
                ) : (
                  <CornerDownRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}

                <span className={`text-xs sm:text-sm leading-snug break-words ${isRoot ? 'font-bold' : 'font-semibold'}`}>
                  {label}
                </span>

                {isCollapsed && children.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tabular-nums shrink-0 ${
                      isRoot ? 'bg-emerald-800 text-emerald-200' : 'bg-stone-200/80 text-stone-600'
                    }`}
                  >
                    +{children.length}
                  </span>
                )}
              </div>

              {!readOnly && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingUnderId(addingUnderId === node.id ? null : node.id)
                      setEditingNodeId(null)
                      setNewBranchLabel('')
                    }}
                    title="Tambah sub-cabang"
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                      isRoot
                        ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100'
                        : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Cabang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startEditingNode(node)}
                    title="Ubah teks konsep"
                    className={`p-1.5 rounded-lg transition-colors ${
                      isRoot
                        ? 'text-emerald-200 hover:bg-emerald-800'
                        : 'text-stone-400 hover:text-amber-600 hover:bg-amber-50'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {!isRoot && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNode(node.id)}
                      title="Hapus cabang"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Form Input Sub-Cabang Langsung di Bawah Node */}
        {addingUnderId === node.id && (
          <div className="ml-3.5 sm:ml-6 pl-3 border-l-2 border-amber-300 flex gap-2 items-center py-1">
            <Input
              autoFocus
              placeholder={`Sub-konsep dari "${label}"...`}
              value={newBranchLabel}
              onChange={(e) => setNewBranchLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddChildNode(node.id)
                if (e.key === 'Escape') setAddingUnderId(null)
              }}
              className="h-9 text-xs bg-white rounded-lg"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => handleAddChildNode(node.id)}
              className="h-9 px-3 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 shrink-0"
            >
              Tambah
            </Button>
          </div>
        )}

        {/* Render Anak Cabang */}
        {!isCollapsed && children.length > 0 && (
          <div className="space-y-2 pt-0.5">
            {children.map((child) => renderTreeBranch(child, depth + 1, new Set(visited)))}
          </div>
        )}
      </div>
    )
  }

  const hasCollapsedAny = Object.values(collapsedIds).some(Boolean)

  return (
    <div className="space-y-3">
      {/* Toolbar Pengalih Mode & Tombol Simpan */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-stone-200/90 shadow-2xs">
        <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewMode === 'tree'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" /> Pohon Konsep
          </button>
          <button
            type="button"
            onClick={() => setViewMode('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewMode === 'canvas'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Network className="w-3.5 h-3.5" /> Kanvas Visual
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {viewMode === 'tree' && nodes.length > 1 && (
            <button
              type="button"
              onClick={() => handleToggleAll(!hasCollapsedAny)}
              title={hasCollapsedAny ? 'Buka semua cabang' : 'Lipat semua cabang'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-medium transition-colors"
            >
              {hasCollapsedAny ? (
                <>
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Buka Semua</span>
                </>
              ) : (
                <>
                  <ChevronsDownUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lipat Semua</span>
                </>
              )}
            </button>
          )}

          {!readOnly && (
            <>
              {savedToast && (
                <Badge
                  variant="secondary"
                  className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold"
                >
                  Tersimpan!
                </Badge>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleSaveMap}
                disabled={saving}
                className="rounded-lg bg-emerald-700 hover:bg-emerald-800 h-8 px-3 text-xs font-semibold shadow-2xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? 'Menyimpan...' : 'Simpan Peta'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* MODE 1: POHON KONSEP */}
      {viewMode === 'tree' ? (
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-3">
          {treeStructure.roots.map((rootNode) => renderTreeBranch(rootNode, 0))}
        </div>
      ) : (
        /* MODE 2: KANVAS VISUAL TERANG */
        <div className="h-[420px] md:h-[520px] w-full rounded-xl border border-stone-200/90 bg-white overflow-hidden shadow-2xs">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={readOnly ? undefined : onNodesChange}
            onEdgesChange={readOnly ? undefined : onEdgesChange}
            onConnect={readOnly ? undefined : onConnect}
            fitView
            fitViewOptions={{ padding: 0.25 }}
          >
            <Controls />
            <Background color="#d6d3d1" gap={18} size={1} />
          </ReactFlow>
        </div>
      )}
    </div>
  )
}