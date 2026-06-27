'use client'

import React, { createContext, useContext, useState } from 'react'
import { translations } from '@/lib/i18n/translations'
import type { Lang } from '@/types'

type TranslationDict = typeof translations[keyof typeof translations]

interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: TranslationDict
}

const LangContext = createContext<LangContextType>({
  lang: 'zh',
  setLang: () => {},
  t: translations['zh'],
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh')
  const t = translations[lang]

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
