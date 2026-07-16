import React from 'react'

export default function TradeinsTab({ pendingTradeinsCount, navigate }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gestion des échanges</h2>
            <p className="text-sm text-gray-500 mt-1">Liste complète des demandes d'échange</p>
          </div>
          {pendingTradeinsCount > 0 && (
            <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">{pendingTradeinsCount} en attente</span>
          )}
        </div>
      </div>
      <div className="p-6 text-center">
        <button onClick={() => navigate('/admin/tradeins')} className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
          Voir tous les échanges
        </button>
      </div>
    </div>
  )
}
