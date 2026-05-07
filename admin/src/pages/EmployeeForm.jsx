import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, X } from 'lucide-react'
import Toast from '../components/Toast'
import api from '../services/api'

export default function EmployeeForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const existingEmployee = location.state?.employee

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'technician',
    isActive: true,
    skills: []
  })

  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const roles = [
    { value: 'admin', label: 'Administrateur', description: 'Accès complet' },
    { value: 'technician', label: 'Technicien', description: 'Gestion des réparations' },
    { value: 'cashier', label: 'Caissier', description: 'Gestion des ventes' }
  ]

  useEffect(() => {
    if (id && existingEmployee) {
      setFormData({
        name: existingEmployee.name || '',
        email: existingEmployee.email || '',
        phone: existingEmployee.phone || '',
        password: '',
        role: existingEmployee.role || 'technician',
        isActive: existingEmployee.isActive !== false,
        skills: existingEmployee.skills || []
      })
    }
  }, [id, existingEmployee])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.email || !formData.phone) {
      setError('Les champs nom, email et téléphone sont obligatoires')
      return
    }

    if (!id && !formData.password) {
      setError('Le mot de passe est obligatoire pour un nouvel employé')
      return
    }

    try {
      setLoading(true)
      const payload = { ...formData }
      if (!payload.password) delete payload.password

      let response
      if (id) {
        response = await api.put(`/api/admin/employees/${id}`, payload)
      } else {
        response = await api.post('/api/admin/employees', payload)
      }

      if (response.data.success) {
        setSuccess(id ? 'Employé mis à jour avec succès' : 'Employé créé avec succès')
        setTimeout(() => navigate('/admin/employees'), 1500)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/employees')}
        className="flex items-center gap-2 text-primary hover:underline transition font-semibold"
      >
        <ArrowLeft size={20} />
        Retour aux employés
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-black text-primary mb-8 uppercase tracking-tight">
          {id ? 'Modifier l\'employé' : 'Nouvel employé'}
        </h1>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations Personnelles */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-accent pl-3">Informations Personnelles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {id ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={id ? 'Laisser vide pour ne pas changer' : '••••••••'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!id}
                />
              </div>
            </div>
          </div>

          {/* Rôle et Permissions */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-accent pl-3">Rôle et Permissions</h2>
            <div className="grid grid-cols-1 gap-3">
              {roles.map(roleOption => (
                <label
                  key={roleOption.value}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                    formData.role === roleOption.value
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={roleOption.value}
                    checked={formData.role === roleOption.value}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{roleOption.label}</p>
                    <p className="text-sm text-gray-600">{roleOption.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Compétences (pour technicien) */}
          {formData.role === 'technician' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Compétences</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Ex: Écran, Batterie, Carte mère..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Ajouter
                  </button>
                </div>

                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map(skill => (
                      <div
                        key={skill}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statut */}
          {id && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statut</h2>
              <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium text-gray-900">Employé actif</p>
                  <p className="text-sm text-gray-600">
                    {formData.isActive ? 'Actif - peut accéder à l\'application' : 'Inactif - ne peut pas accéder'}
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 btn-primary disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/employees')}
              className="btn-secondary"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
