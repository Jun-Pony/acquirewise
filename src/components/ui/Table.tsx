import React from 'react'
import { cn } from '@/lib/utils'

export function Table({
  className,
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <table
        className={cn('w-full text-sm border-collapse', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function Thead({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-[#1F3864] text-white', className)} {...props}>
      {children}
    </thead>
  )
}

export function Tbody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn('divide-y divide-gray-50 bg-white', className)}
      {...props}
    >
      {children}
    </tbody>
  )
}

export function Th({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function Td({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-2.5 text-gray-700 whitespace-nowrap', className)}
      {...props}
    >
      {children}
    </td>
  )
}

export function Tr({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('hover:bg-blue-50/30 transition-colors', className)}
      {...props}
    >
      {children}
    </tr>
  )
}
