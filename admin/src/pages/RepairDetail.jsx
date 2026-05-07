import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import ImageGallery from '../components/ImageGallery'

export default function RepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [repair, setRepair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [priceModal, setPriceModal] = useState({ isOpen: false, price: '', method: 'cash', notes: '' })
  const [statusModal, setStatusModal] = useState({ isOpen: false, status: '' })
  const [assignModal, setAssignModal] = useState({ isOpen: false, technicianId: '' })
  const [technicians, setTechnicians] = useState([])

  useEffect(() => {
    fetchRepair()
    fetchTechnicians()
  }, [id])

  const fetchRepair = async () => {
    try {
      const response = await api.get(`/api/admin/repair/${id}`)
      setRepair(response.data.data)
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/api/admin/employees')
      const technicianList = response.data.data?.filter(emp => emp.role === 'technician') || []
      setTechnicians(technicianList)
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error)
    }
  }

  const handleSavePrice = async () => {
    try {
      const payload = { 
        price: parseFloat(priceModal.price), 
        estimatedPrice: parseFloat(priceModal.price),
        saleInfo: {
          amount: parseFloat(priceModal.price),
          amountPaid: parseFloat(priceModal.price),
          paymentMethod: priceModal.method,
          paymentDate: new Date(),
          notes: priceModal.notes
        }
      }
      await api.put(`/api/admin/repair/${id}/price`, payload)
      setToast({ type: 'success', message: 'Devis enregistré' })
      setPriceModal({ isOpen: false, price: '' })
      fetchRepair()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la sauvegarde' })
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/api/admin/repair/${id}/status`, { status: newStatus })
      setToast({ type: 'success', message: 'Statut mis à jour' })
      setStatusModal({ isOpen: false, status: '' })
      fetchRepair()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la mise à jour' })
    }
  }

  const handleGenerateInvoice = () => {
    // Simulation de génération de facture
    const invoiceNumber = `INV-${id.substring(0, 8).toUpperCase()}`;
    setToast({ type: 'success', message: `Facture ${invoiceNumber} générée (Téléchargement...)` });
    // Ici on pourrait appeler une route backend pour générer un PDF
  };

  const handleAssignTechnician = async () => {
    if (!assignModal.technicianId) {
      setToast({ type: 'error', message: 'Veuillez sélectionner un technicien' })
      return
    }
    try {
      await api.put(`/api/admin/repair/${id}/assign`, { employeeId: assignModal.technicianId })
      setToast({ type: 'success', message: 'Réparation attribuée au technicien' })
      setAssignModal({ isOpen: false, technicianId: '' })
      fetchRepair()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de l\'attribution' })
    }
  }

  if (loading) return <div className="p-8 text-center">Chargement...</div>
  if (!repair) return <div className="p-8 text-center">Demande non trouvée</div>

  const statuses = ['pending', 'quoted', 'accepted', 'repairing', 'ready', 'completed', 'cancelled']

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <button
        onClick={() => navigate('/admin/repairs')}
        className="text-primary hover:text-blue-700 flex items-center gap-2"
      >
        ← Retour aux demandes
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-primary mb-4">Demande #{repair._id?.substring(0, 8)}</h1>

        {/* Infos client */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Informations Client</h3>
            <p><strong>Nom :</strong> {repair.clientName}</p>
            <p>
              <strong>WhatsApp :</strong>{' '}
              <a
                href={`https://wa.me/${repair.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                +{repair.whatsapp}
              </a>
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Détails Réparation</h3>
            <p><strong>Téléphone :</strong> {repair.phoneModel}</p>
            <p><strong>Date :</strong> {new Date(repair.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        {/* Description de la panne */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Description de la panne</h3>
          <p className="text-gray-600 bg-gray-50 p-4 rounded">{repair.description}</p>
        </div>

        {/* Photos */}
        {repair.photos && repair.photos.length > 0 && (
          <div className="mb-6">
            <ImageGallery images={repair.photos} title="Photos du téléphone" />
          </div>
        )}
      </div>

      {/* Section Administration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Devis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Prix du Devis</h3>
          <p className="text-2xl font-bold text-accent mb-2">
            {repair.saleInfo?.amountPaid || repair.saleInfo?.amount || repair.price
              ? `${(repair.saleInfo?.amountPaid || repair.saleInfo?.amount || repair.price).toLocaleString('fr-FR')} FCFA`
              : 'Non défini'}
          </p>
          {repair.saleInfo?.paymentDate && (
            <p className="text-sm text-gray-500 mb-2">
              Paiement : {new Date(repair.saleInfo.paymentDate).toLocaleDateString('fr-FR')} {new Date(repair.saleInfo.paymentDate).toLocaleTimeString('fr-FR')}
            </p>
          )}
          {repair.saleInfo?.paymentMethod && (
            <p className="text-sm text-gray-500 mb-2">
              Méthode : {repair.saleInfo.paymentMethod === 'cash' ? 'Espèces' : repair.saleInfo.paymentMethod === 'mobile_money' ? 'Mobile Money' : repair.saleInfo.paymentMethod === 'card' ? 'Carte' : repair.saleInfo.paymentMethod === 'check' ? 'Chèque' : 'Virement'}
            </p>
          )}
          {repair.saleInfo?.notes && (
            <p className="text-sm text-gray-500 mb-4">Notes : {repair.saleInfo.notes}</p>
          )}
          <button
            onClick={() => setPriceModal({ isOpen: true, price: repair.price?.toString() || '' })}
            className="btn-primary w-full"
          >
            {repair.price ? 'Modifier' : 'Ajouter'} le devis
          </button>
        </div>

        {/* Statut */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Statut</h3>
          <select
            value={repair.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="input-base mb-4"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button 
            onClick={handleGenerateInvoice}
            className="btn-accent w-full"
          >
            Générer facture
          </button>
        </div>

        {/* Attribuer à un technicien */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Technicien</h3>
          <p className="text-sm text-gray-600 mb-4">
            {repair.assignedTo 
              ? `Attribué à: ${repair.assignedTo.name || 'Inconnu'}` 
              : 'Non attribué'}
          </p>
          <button
            onClick={() => setAssignModal({ isOpen: true, technicianId: repair.assignedTo?._id || '' })}
            className="btn-primary w-full"
          >
            {repair.assignedTo ? 'Modifier' : 'Attribuer'} au technicien
          </button>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={priceModal.isOpen}
        title="Définir le prix du devis"
        confirmText="Enregistrer"
        onClose={() => setPriceModal({ isOpen: false, price: '' })}
        onConfirm={handleSavePrice}
      >
        <input
          type="number"
          value={priceModal.price}
          onChange={(e) => setPriceModal({ ...priceModal, price: e.target.value })}
          placeholder="Montant en FCFA"
          className="input-base"
        />
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de paiement</label>
          <select 
            value={priceModal.method} 
            onChange={(e) => setPriceModal({...priceModal, method: e.target.value})}
            className="input-base"
          >
            <option value="cash">Espèces</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="card">Carte Bancaire</option>
          </select>
        </div>
        <textarea
          className="input-base mt-4"
          placeholder="Notes (ex: Payé en avance)"
          value={priceModal.notes}
          onChange={(e) => setPriceModal({...priceModal, notes: e.target.value})}
        />
      </Modal>

      {/* Modal d'attribution technicien */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Attribuer à un technicien</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionnez un technicien
              </label>
              <select
                value={assignModal.technicianId}
                onChange={(e) => setAssignModal({ ...assignModal, technicianId: e.target.value })}
                className="input-base"
              >
                <option value="">-- Choisir un technicien --</option>
                {technicians.map(tech => (
                  <option key={tech._id} value={tech._id}>
                    {tech.name}
                    {tech.skills && tech.skills.length > 0 && ` (${tech.skills.join(', ')})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setAssignModal({ isOpen: false, technicianId: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignTechnician}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Attribuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
