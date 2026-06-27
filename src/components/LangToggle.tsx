'use client'

import React from 'react'
import { useLang } from '@/context/LangContext'
import { cn } from '@/lib/utils'

export function LangToggle() {
  const { lang, setLang } = useLang()

  return (
    <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
      <button
        onClick={() => setLang('zh')}
        className={cn(
          'px-3 py-1 rounded-full transition-colors',
          lang === 'zh'
            ? 'bg-[#2E75B6] text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        中文
      </button>
      <button
        onClick={() => setLang('en')}
        className={cn(
          'px-3 py-1 rounded-full transition-colors',
          lang === 'en'
            ? 'bg-[#2E75B6] text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        EN
      </button>
    </div>
  )
}
