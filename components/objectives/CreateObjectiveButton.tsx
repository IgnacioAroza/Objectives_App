'use client'

import { useState } from 'react'
import ObjectiveFormModal from './ObjectiveFormModal'

export default function CreateObjectiveButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-body font-medium hover:bg-navy transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nuevo objetivo
      </button>

      <ObjectiveFormModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
