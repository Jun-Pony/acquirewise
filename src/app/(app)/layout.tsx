'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const params = useParams()
  const projectId = params?.id as string | undefined

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc]">
      {/* Sidebar — hidden on mobile by default */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar projectId={projectId} open={true} />
      </div>

      {/* Mobile sidebar */}
      <Sidebar
        projectId={projectId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
