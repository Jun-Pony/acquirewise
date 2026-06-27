'use client'

import React from 'react'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { GateStatus } from '@/types'
import { useLang } from '@/context/LangContext'
import { cn } from '@/lib/utils'

interface GateIndicatorProps {
  gate: GateStatus
  ratio?: number
  large?: boolean
}

const config = {
  PASS: {
    icon: CheckCircle,
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    iconColor: 'text-green-500',
    badge: 'bg-green-500',
  },
  WATCH: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-500',
  },
  BLOCK: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    iconColor: 'text-red-500',
    badge: 'bg-red-500',
  },
}

export function GateIndicator({ gate, ratio, large = false }: GateIndicatorProps) {
  const { t } = useLang()
  const cfg = config[gate]
  const Icon = cfg.icon

  const gateLabel = gate === 'PASS' ? t.gate.pass : gate === 'WATCH' ? t.gate.watch : t.gate.block
  const hint = gate === 'PASS' ? t.gate.passHint : gate === 'WATCH' ? t.gate.watchHint : t.gate.blockHint

  if (large) {
    return (
      <div className={cn('rounded-xl border-2 p-6 flex flex-col items-center gap-3', cfg.bg)}>
        <Icon className={cn('w-12 h-12', cfg.iconColor)} />
        <div className={cn('text-3xl font-bold', cfg.text)}>{gateLabel}</div>
        {ratio !== undefined && (
          <div className={cn('text-lg font-medium', cfg.text)}>
            {(ratio * 100).toFixed(1)}%
          </div>
        )}
        <p className={cn('text-sm text-center', cfg.text)}>{hint}</p>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border px-4 py-3 flex items-center gap-3', cfg.bg)}>
      <Icon className={cn('w-5 h-5 flex-shrink-0', cfg.iconColor)} />
      <div>
        <span className={cn('font-bold text-sm', cfg.text)}>{gateLabel}</span>
        {ratio !== undefined && (
          <span className={cn('ml-2 text-sm', cfg.text)}>({(ratio * 100).toFixed(1)}%)</span>
        )}
        <p className={cn('text-xs mt-0.5', cfg.text)}>{hint}</p>
      </div>
    </div>
  )
}
