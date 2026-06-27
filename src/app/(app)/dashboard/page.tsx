'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, FolderOpen, Trash2, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { fmtDate } from '@/lib/utils'
import type { Project } from '@/types'

export default function DashboardPage() {
  const { t } = useLang()
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [error, setError] = useState('')

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setProjects(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated')
      setCreating(false)
      return
    }

    const { error: createError } = await supabase.from('projects').insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
      user_id: user.id,
    })

    if (createError) {
      setError(createError.message)
    } else {
      setNewName('')
      setNewDesc('')
      setShowForm(false)
      await loadProjects()
    }
    setCreating(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return
    await supabase.from('projects').delete().eq('id', id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3864]">{t.dashboard.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t.app.tagline}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t.dashboard.newProject}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="mb-6 border-[#2E75B6] border">
          <h2 className="font-semibold text-[#1F3864] mb-4">{t.dashboard.newProject}</h2>
          {error && (
            <div className="mb-3 p-2 bg-red-50 rounded text-sm text-red-600">{error}</div>
          )}
          <form onSubmit={handleCreate} className="space-y-3">
            <Input
              label={t.dashboard.projectName}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Clearwater Acquisition Q1 2025"
              required
            />
            <Input
              label={t.dashboard.description}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional notes..."
            />
            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={creating}>
                {t.dashboard.create}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false)
                  setError('')
                }}
              >
                {t.dashboard.cancel}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Project list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">{t.common.loading}</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t.dashboard.noProjects}</p>
          <p className="text-gray-400 text-sm mt-1">{t.dashboard.noProjectsHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1F3864] truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="ml-2 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                  title={t.dashboard.deleteProject}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                {t.dashboard.created}: {fmtDate(project.created_at)}
              </p>
              <Link href={`/projects/${project.id}`}>
                <Button variant="secondary" size="sm" className="w-full gap-2">
                  <FolderOpen className="w-3.5 h-3.5" />
                  {t.dashboard.openProject}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
