'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Settings,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  ListChecks,
  ShoppingCart,
  Tag,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/context/LangContext'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  projectId?: string
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ projectId, open = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLang()
  const supabase = createClient()

  const topLinks = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: t.nav.dashboard,
    },
  ]

  const projectLinks = projectId
    ? [
        {
          href: `/projects/${projectId}`,
          icon: BarChart3,
          label: t.project.overview,
          exact: true,
        },
        {
          href: `/projects/${projectId}/assumptions`,
          icon: Settings,
          label: t.nav.assumptions,
        },
        {
          href: `/projects/${projectId}/nav`,
          icon: TrendingDown,
          label: t.nav.navModel,
        },
        {
          href: `/projects/${projectId}/lanav`,
          icon: AlertTriangle,
          label: t.nav.lanav,
        },
        {
          href: `/projects/${projectId}/scenarios`,
          icon: BarChart3,
          label: t.nav.scenarios,
        },
        {
          href: `/projects/${projectId}/mcda`,
          icon: ListChecks,
          label: t.nav.mcda,
        },
        {
          href: `/projects/${projectId}/buyer`,
          icon: ShoppingCart,
          label: t.nav.buyer,
        },
        {
          href: `/projects/${projectId}/seller`,
          icon: Tag,
          label: t.nav.seller,
        },
      ]
    : []

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-56 bg-[#1F3864] flex flex-col transition-transform duration-200',
          'md:static md:translate-x-0 md:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 md:hidden">
          <span className="text-white font-bold">Menu</span>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {topLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <link.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{link.label}</span>
            </Link>
          ))}

          {projectLinks.length > 0 && (
            <>
              <div className="pt-2 pb-1 px-3">
                <p className="text-white/30 text-xs uppercase tracking-widest font-medium">
                  Analysis
                </p>
              </div>
              {projectLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(link.href, link.exact)
                      ? 'bg-[#2E75B6] text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <link.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{link.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
