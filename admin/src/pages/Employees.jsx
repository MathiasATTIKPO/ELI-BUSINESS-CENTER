import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, Power, AlertCircle } from 'lucide-react'
import Table from '../components/Table'
import Toast from '../components/Toast'
import api from '../services/api'

export default function Employees() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/api/admin/employees')
      if (response.data.success) {
        setEmployees(response.data.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des employés')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = async (id) => {
    try {
      const response = await api.delete(`/api/admin/employees/${id}`)
      if (response.data.success) {
        setSuccess('Employé supprimé avec succès')
        setDeleteConfirm(null)
        fetchEmployees()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const handleToggleEmployeeStatus = async (employee) => {
    try {
      const response = await api.put(`/api/admin/employees/${employee._id}`, {
        isActive: !employee.isActive
      })
      if (response.data.success) {
        setSuccess(`Employé ${response.data.data.isActive ? 'activé' : 'désactivé'} avec succès`)
        fetchEmployees()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut')
    }
  }

  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Téléphone' },
    {
      key: 'role',
      label: 'Rôle',
      render: (value) => (
        <span className={`badge-role-${value === 'technician' ? 'tech' : value === 'cashier' ? 'cashier' : 'admin'}`}>
          {value === 'admin' ? 'Admin' :
           value === 'technician' ? 'Technicien' :
           'Caissier'}
        </span>
      )
    },
    {
      key: 'isActive',
      label: 'Statut',
      render: (value) => (
        <span className={value ? 'badge-success' : 'badge-danger'}>
          {value ? 'Actif' : 'Inactif'}
        </span>
      )
    },
    {
      key: 'skills',
      label: 'Compétences',
      render: (value) => (
        <div className="text-sm text-gray-600">
          {Array.isArray(value) && value.length > 0 ? value.join(', ') : '-'}
        </div>
      )
    }
  ]

  const actionColumn = (employee) => (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleToggleEmployeeStatus(employee)
        }}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition ${employee.isActive ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
      >
        <Power size={16} />
        {employee.isActive ? 'Désactiver' : 'Activer'}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          navigate(`/admin/employees/${employee._id}`, { state: { employee } })
        }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
      >
        <Edit2 size={16} /> Modifier
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setDeleteConfirm(employee)
        }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
      >
        <Trash2 size={16} /> Supprimer
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Employés</h1>
          <p className="text-gray-600 mt-1">Gérez les employés, leurs rôles et permissions</p>
        </div>
        <button
          onClick={() => navigate('/admin/employees/new')}
          className="flex items-center gap-2 btn-primary"
        >
          <Plus size={20} />
          Nouvel Employé
        </button>
      </div>

      {error && (
        <Toast
          message={error}
          type="error"
          onClose={() => setError('')}
        />
      )}

      {success && (
        <Toast
          message={success}
          type="success"
          onClose={() => setSuccess('')}
        />
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Chargement des employés...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={32} />
          <p className="text-gray-600 mb-4">Aucun employé trouvé</p>
          <button
            onClick={() => navigate('/admin/employees/new')}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Créer un employé
          </button>
        </div>
      ) : (
        <Table columns={columns} data={employees} actionColumn={actionColumn} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer <strong>{deleteConfirm.name}</strong> ?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteEmployee(deleteConfirm._id)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
