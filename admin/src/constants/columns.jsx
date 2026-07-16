import React from 'react'
import { CheckCircle, XCircle, AlertCircle, Smartphone, Wrench, RefreshCw, FileText } from 'lucide-react'
import { TYPE_COLORS } from './chartConfig'

export const buildProductColumns = () => [
  { header: 'Produit', render: (p) => <span className="font-medium text-gray-900">{p.name}</span> },
  { header: 'Marque', render: (p) => p.brand || '-' },
  { header: 'Prix', render: (p) => <span className="font-semibold text-emerald-600">{p.price?.toLocaleString('fr-FR')} FCFA</span> },
  { header: 'Stock', render: (p) => p.stock },
  {
    header: 'Statut',
    render: (p) => (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${p.stock > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
        {p.stock > 0 ? <CheckCircle size={12} /> : <XCircle size={12} />}
        {p.stock > 0 ? 'En stock' : 'Rupture'}
      </span>
    ),
  },
]

export const buildInventoryColumns = () => [
  { header: 'Article', render: (i) => <span className="font-medium text-gray-900">{i.name}</span> },
  { header: 'Catégorie', render: (i) => i.category || '-' },
  { header: 'Quantité', render: (i) => i.quantity },
  { header: 'Prix', render: (i) => <span className="font-semibold text-emerald-600">{i.unitPrice?.toLocaleString('fr-FR')} FCFA</span> },
  {
    header: 'Statut',
    render: (i) => (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
        i.quantity > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : i.quantity > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
      }`}>
        {i.quantity > 10 ? <CheckCircle size={12} /> : i.quantity > 0 ? <AlertCircle size={12} /> : <XCircle size={12} />}
        {i.quantity > 10 ? 'Stock ok' : i.quantity > 0 ? 'Stock faible' : 'Rupture'}
      </span>
    ),
  },
]

export const buildEmployeeColumns = () => [
  { header: 'Nom', render: (e) => <span className="font-medium text-gray-900">{e.name}</span> },
  { header: 'Email', render: (e) => e.email },
  {
    header: 'Rôle',
    render: (e) => (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
        e.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : e.role === 'technician' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`}>
        {e.role === 'admin' ? 'Admin' : e.role === 'technician' ? 'Technicien' : 'Caissier'}
      </span>
    ),
  },
  { header: 'Téléphone', render: (e) => e.phone || '-' },
]

const typeLabel = (type) => (type === 'phone' ? 'Téléphone' : type === 'repair' ? 'Réparation' : 'Échange')
const typeIcon = (type) => (type === 'phone' ? Smartphone : type === 'repair' ? Wrench : RefreshCw)

export const buildTransactionColumns = () => [
  {
    header: 'Type',
    render: (s) => {
      const Icon = typeIcon(s.type)
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${TYPE_COLORS[s.type] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
          <Icon size={12} />
          {typeLabel(s.type)}
        </span>
      )
    },
  },
  { header: 'Client', render: (s) => s.clientName || '-' },
  { header: 'Produit/Appareil', render: (s) => s.productName || s.deviceModel || '-' },
  { header: 'Montant', render: (s) => <span className="font-semibold text-emerald-600">{(s.amount || 0).toLocaleString('fr-FR')} FCFA</span> },
  { header: 'Date', render: (s) => new Date(s.date).toLocaleDateString('fr-FR') },
]

export const buildInvoiceColumns = (onDownloadInvoice) => [
  ...buildTransactionColumns(),
  {
    header: 'Facture',
    render: (s) => (
      <button
        onClick={() => onDownloadInvoice(s)}
        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
      >
        <FileText size={14} />
        PDF
      </button>
    ),
  },
]
