import React from 'react'

export default function RepairRequestForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = 'Créer la réparation',
  clientLocked = false,
  className = 'space-y-5'
}) {
  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Nom du client *</label>
          <input
            type="text"
            value={value.clientName}
            onChange={(e) => onChange({ ...value, clientName: e.target.value })}
            className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${clientLocked ? 'bg-slate-50 text-slate-700' : ''}`}
            required
            readOnly={clientLocked}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">WhatsApp *</label>
          <input
            type="text"
            value={value.clientWhatsapp}
            onChange={(e) => onChange({ ...value, clientWhatsapp: e.target.value })}
            placeholder="+225 XX XX XX XX"
            className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 ${clientLocked ? 'bg-slate-50 text-slate-700' : ''}`}
            required
            readOnly={clientLocked}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Modèle *</label>
        <input
          type="text"
          value={value.deviceModel}
          onChange={(e) => onChange({ ...value, deviceModel: e.target.value })}
          placeholder="iPhone 13, Samsung..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Description</label>
        <textarea
          value={value.issueDescription}
          onChange={(e) => onChange({ ...value, issueDescription: e.target.value })}
          rows="3"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Devis (FCFA)</label>
          <input
            type="number"
            value={value.estimatedPrice}
            onChange={(e) => onChange({ ...value, estimatedPrice: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Notes</label>
          <textarea
            value={value.notes}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            rows="2"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
            Annuler
          </button>
        )}
        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-medium shadow-sm">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}