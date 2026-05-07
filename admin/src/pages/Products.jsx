import React, { useState, useEffect } from 'react'
import api from '../services/api'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Toast from '../components/Toast'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/admin/products')
      setProducts(response.data.data || [])
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement des produits' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (product) => {
    try {
      await api.delete(`/api/admin/products/${product._id}`)
      setToast({ type: 'success', message: 'Produit supprimé avec succès' })
      fetchProducts()
      setDeleteModal({ isOpen: false, product: null })
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la suppression' })
    }
  }

  const toggleStatus = async (product) => {
    try {
      await api.put(`/api/admin/products/${product._id}`, {
        active: !product.active,
      })
      setToast({ type: 'success', message: 'Statut mis à jour' })
      fetchProducts()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la mise à jour' })
    }
  }

  const columns = [
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'price', label: 'Prix', sortable: true, render: (val) => `${val.toLocaleString('fr-FR')} FCFA` },
    { key: 'stock', label: 'Stock', sortable: true },
    {
      key: 'active',
      label: 'Statut',
      render: (val) => (
        <span className={val ? 'badge-success' : 'badge-danger'}>
          {val ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
  ]

  const actionColumn = (product) => (
    <div className="flex gap-2">
      <button
        onClick={() => window.location.href = `/admin/products/${product._id}`}
        className="btn-info btn-sm"
      >
        ✎
      </button>
      <button
        onClick={() => toggleStatus(product)}
        className="btn-warning btn-sm"
      >
        {product.active ? '✕' : '✓'}
      </button>
      <button
        onClick={() => setDeleteModal({ isOpen: true, product })}
        className="btn-danger btn-sm"
      >
        🗑
      </button>
    </div>
  )

  if (loading) return <div className="p-8 text-center">Chargement...</div>

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Produits</h1>
          <p className="text-gray-600">Gérez votre catalogue de produits</p>
        </div>
        <a href="/admin/products/new" className="btn-primary">
          ➕ Ajouter un produit
        </a>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Table
          columns={columns}
          data={products}
          actionColumn={actionColumn}
          searchField="name"
          onRowClick={(product) => window.location.href = `/admin/products/${product._id}`}
        />
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        title="Confirmer la suppression"
        confirmText="Supprimer"
        isDanger={true}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        onConfirm={() => handleDelete(deleteModal.product)}
      >
        <p>Êtes-vous sûr de vouloir supprimer le produit "<strong>{deleteModal.product?.name}</strong>" ?</p>
      </Modal>
    </div>
  )
}
