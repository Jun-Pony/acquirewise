'use client'

import React from 'react'
import { Menu } from 'lucide-react'
import { LangToggle } from './LangToggle'
import { useLang } from '@/context/LangContext'

interface NavbarProps {
  onMenuClick?: () => void
  projectName?: string
}

export function Navbar({ onMenuClick, projectName }: NavbarProps) {
  const { t } = useLang()

  return (
    <header className="h-14 bg-[#1F3864] flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="text-white/70 hover:text-white p-1 rounded md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-white font-bold text-lg tracking-tight">
          {t.app.name}
        </span>
        {projectName && (
          <>
            <span className="text-white/40 text-sm">/</span>
            <span className="text-white/80 text-sm font-medium truncate max-w-[200px]">
              {projectName}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <LangToggle />
      </div>
    </header>
  )
}
