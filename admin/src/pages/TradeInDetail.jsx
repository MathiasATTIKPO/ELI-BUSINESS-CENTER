import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Package } from 'lucide-react'
import api from '../services/api'
import Toast from '../components/Toast'
import ImageGallery from '../components/ImageGallery'
import Modal from '../components/Modal'

export default function TradeInDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tradein, setTradein] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [valueModal, setValueModal] = useState({ isOpen: false, value: '' })
  const [exchangeModal, setExchangeModal] = useState({ isOpen: false, selectedProduct: null })
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchTradein()
    fetchProducts()
  }, [id])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/admin/products')
      setProducts(response.data.data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des produits')
    }
  }

  const fetchTradein = async () => {
    try {
      const response = await api.get(`/api/admin/tradein/${id}`)
      setTradein(response.data.data)
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateValue = async () => {
    try {
      await api.put(`/api/admin/tradein/${id}/value`, { proposedValue: parseFloat(valueModal.value) })
      setToast({ type: 'success', message: 'Valeur proposée enregistrée' })
      setValueModal({ isOpen: false, value: '' })
      fetchTradein()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la sauvegarde' })
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'accepted') {
      setExchangeModal({ isOpen: true, selectedProduct: null })
      return
    }
    try {
      await api.put(`/api/admin/tradein/${id}/status`, { status: newStatus })
      setToast({ type: 'success', message: 'Statut mis à jour' })
      fetchTradein()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la mise à jour' })
    }
  }

  const handleAcceptExchange = async () => {
    if (!exchangeModal.selectedProduct) {
      setToast({ type: 'error', message: 'Veuillez sélectionner un produit d\'échange' })
      return
    }
    try {
      await api.put(`/api/admin/tradein/${id}/accept`, { 
        status: 'accepted',
        exchangeProduct: exchangeModal.selectedProduct 
      })
      setToast({ type: 'success', message: 'Échange accepté avec succès' })
      setExchangeModal({ isOpen: false, selectedProduct: null })
      fetchTradein()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de l\'acceptation' })
    }
  }

  if (loading) return <div className="p-8 text-center">Chargement...</div>
  if (!tradein) return <div className="p-8 text-center">Demande non trouvée</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <button
        onClick={() => navigate('/admin/tradeins')}
        className="text-primary hover:text-blue-700 flex items-center gap-2"
      >
        ← Retour aux demandes
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-primary mb-4">Demande d'Échange #{tradein._id?.substring(0, 8)}</h1>

        {/* Infos client */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Informations Client</h3>
            <p><strong>Nom :</strong> {tradein.clientName}</p>
            <p>
              <strong>WhatsApp :</strong>{' '}
              <a
                href={`https://wa.me/${tradein.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                +{tradein.whatsapp}
              </a>
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Téléphone à Échanger</h3>
            <p><strong>Modèle :</strong> {tradein.phoneModel}</p>
            <p><strong>État :</strong> {tradein.condition}</p>
            <p><strong>Souhaite échanger contre :</strong> <span className="text-accent font-bold">{tradein.targetProduct || 'Non spécifié'}</span></p>
          </div>
        </div>

        {/* Photos */}
        {tradein.photos && tradein.photos.length > 0 && (
          <div className="mb-6">
            <ImageGallery images={tradein.photos} title="Photos du téléphone" />
          </div>
        )}
      </div>

      {/* Section Administration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Valeur proposée */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Valeur de Reprise</h3>
          <p className="text-2xl font-bold text-accent mb-4">
            {tradein.proposedValue ? `${tradein.proposedValue.toLocaleString('fr-FR')} FCFA` : 'Non définie'}
          </p>
          <button
            onClick={() => setValueModal({ isOpen: true, value: tradein.proposedValue?.toString() || '' })}
            className="btn-primary w-full"
          >
            {tradein.proposedValue ? 'Modifier' : 'Proposer une'} valeur
          </button>
        </div>

        {/* Statut et Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Statut</h3>
          <p className="text-lg font-semibold text-gray-700 mb-4">
            État actuel : <span className="text-accent">{tradein.status}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange('accepted')}
              className="flex-1 btn-success"
            >
              ✓ Accepter
            </button>
            <button
              onClick={() => handleStatusChange('refused')}
              className="flex-1 btn-danger"
            >
              ✕ Refuser
            </button>
          </div>
        </div>
      </div>

      {/* Modal Valeur */}
      <Modal
        isOpen={valueModal.isOpen}
        title="Proposer une valeur de reprise"
        confirmText="Enregistrer"
        onClose={() => setValueModal({ isOpen: false, value: '' })}
        onConfirm={handleUpdateValue}
      >
        <input
          type="number"
          value={valueModal.value}
          onChange={(e) => setValueModal({ ...valueModal, value: e.target.value })}
          placeholder="Montant en FCFA"
          className="input-base"
        />
      </Modal>

      {/* Modal Échange */}
      <Modal
        isOpen={exchangeModal.isOpen}
        title="Sélectionner le produit d'échange"
        confirmText="Accepter l'échange"
        onClose={() => setExchangeModal({ isOpen: false, selectedProduct: null })}
        onConfirm={handleAcceptExchange}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sélectionnez le produit que vous souhaitez échanger contre le téléphone du client.
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {products.filter(p => p.isActive).map(product => (
              <div
                key={product._id}
                onClick={() => setExchangeModal({ ...exchangeModal, selectedProduct: product })}
                className={`p-3 border rounded-lg cursor-pointer transition ${
                  exchangeModal.selectedProduct?._id === product._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="text-gray-400" size={20} />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Prix: {product.price?.toLocaleString('fr-FR')} FCFA | Stock: {product.stock || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {exchangeModal.selectedProduct && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">Produit sélectionné:</p>
              <p className="text-sm text-green-700">{exchangeModal.selectedProduct.name}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
