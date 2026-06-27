'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Trash2, TrendingDown, AlertTriangle, BarChart3, ListChecks, ShoppingCart, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { Project, Target } from '@/types'

const analysisModules = [
  { key: 'assumptions', icon: BarChart3, color: 'bg-blue-50 text-blue-700' },
  { key: 'nav', icon: TrendingDown, color: 'bg-indigo-50 text-indigo-700' },
  { key: 'lanav', icon: AlertTriangle, color: 'bg-amber-50 text-amber-700' },
  { key: 'scenarios', icon: BarChart3, color: 'bg-green-50 text-green-700' },
  { key: 'mcda', icon: ListChecks, color: 'bg-purple-50 text-purple-700' },
  { key: 'buyer', icon: ShoppingCart, color: 'bg-sky-50 text-sky-700' },
  { key: 'seller', icon: Tag, color: 'bg-rose-50 text-rose-700' },
]

export default function ProjectOverviewPage() {
  const { t } = useLang()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [project, setProject] = useState<Project | null>(null)
  const [targets, setTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newLabel, setNewLabel] = useState('A')
  const [newName, setNewName] = useState('')
  const [askingPrice, setAskingPrice] = useState('85')
  const [strategicFit, setStrategicFit] = useState('5')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data: proj }, { data: tgts }] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('targets').select('*').eq('project_id', id).order('sort_order'),
      ])
      if (proj) setProject(proj)
      if (tgts) setTargets(tgts)
      setLoading(false)
    }
    load()
  }, [id])

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('targets').insert({
      project_id: id,
      label: newLabel,
      name: newName || null,
      asking_price_mm: parseFloat(askingPrice) || 85,
      strategic_fit: parseInt(strategicFit) || 5,
      sort_order: targets.length,
    })
    if (!error) {
      const { data } = await supabase
        .from('targets')
        .select('*')
        .eq('project_id', id)
        .order('sort_order')
      if (data) setTargets(data)
      setShowForm(false)
      setNewLabel('A')
      setNewName('')
    }
    setSaving(false)
  }

  const handleDeleteTarget = async (targetId: string) => {
    if (!confirm('Delete this target?')) return
    await supabase.from('targets').delete().eq('id', targetId)
    setTargets((prev) => prev.filter((t) => t.id !== targetId))
  }

  const moduleLabel = (key: string) => {
    switch (key) {
      case 'assumptions': return t.nav.assumptions
      case 'nav': return t.nav.navModel
      case 'lanav': return t.nav.lanav
      case 'scenarios': return t.nav.scenarios
      case 'mcda': return t.nav.mcda
      case 'buyer': return t.nav.buyer
      case 'seller': return t.nav.seller
      default: return key
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-400">{t.common.loading}</div>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1F3864]">{project?.name}</h1>
        {project?.description && (
          <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>
        )}
      </div>

      {/* Analysis modules */}
      <Card>
        <CardHeader>
          <CardTitle>{t.project.overview}</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {analysisModules.map(({ key, icon: Icon, color }) => (
            <Link key={key} href={`/projects/${id}/${key}`}>
              <div className={`${color} rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform cursor-pointer`}>
                <Icon className="w-6 h-6" />
                <span className="text-xs font-semibold text-center leading-tight">
                  {moduleLabel(key)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Target assets */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>{t.project.targets}</CardTitle>
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            {t.project.addTarget}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleAddTarget} className="bg-blue-50/50 rounded-xl p-4 mb-4 space-y-3 border border-blue-100">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t.project.targetLabel}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="A"
                required
              />
              <Input
                label={t.project.targetName}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Clearwater Block 12"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t.project.askingPrice}
                type="number"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                suffix="C$MM"
              />
              <Input
                label={t.project.strategicFit}
                type="number"
                min={1}
                max={10}
                value={strategicFit}
                onChange={(e) => setStrategicFit(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={saving}>{t.common.save}</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
            </div>
          </form>
        )}

        {targets.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            No targets yet. Click "+ {t.project.addTarget}" to add acquisition targets.
          </p>
        ) : (
          <div className="space-y-2">
            {targets.map((target) => (
              <div
                key={target.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50/40 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-[#2E75B6] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {target.label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {target.name || `Target ${target.label}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Ask: C${target.asking_price_mm}MM · Fit: {target.strategic_fit}/10
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTarget(target.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
