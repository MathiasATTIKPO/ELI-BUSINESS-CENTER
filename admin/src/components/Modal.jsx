import React from 'react'

export default function Modal({ isOpen, title, children, onClose, onConfirm, confirmText = 'Confirmer', isDanger = false }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
        <h2 className="text-xl font-bold text-primary mb-4">{title}</h2>
        
        <div className="mb-6">
          {children}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              className={isDanger ? 'btn-danger' : 'btn-primary'}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
