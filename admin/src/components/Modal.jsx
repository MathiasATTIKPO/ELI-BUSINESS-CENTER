import React, { useEffect, useId } from 'react'

export default function Modal({ isOpen, title, children, onClose, onConfirm, confirmText = 'Confirmer', isDanger = false }) {
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="mb-4 break-words text-lg font-bold text-primary sm:text-xl">{title}</h2>
        
        <div className="mb-5 min-w-0 sm:mb-6">
          {children}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
          >
            Annuler
          </button>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className={`${isDanger ? 'btn-danger' : 'btn-primary'} w-full sm:w-auto`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
