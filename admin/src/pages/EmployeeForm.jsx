import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Briefcase, 
  Plus, 
  CheckCircle,
  Shield,
  Wrench,
  CreditCard,
  Award,
  Star,
  Zap,
  Eye,
  EyeOff,
  AlertCircle,
  UserCheck,
  Calendar,
  Clock,
  Loader2,
  Tag
} from 'lucide-react'
import Toast from '../components/Toast'
import api from '../services/api'

export default function EmployeeForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const existingEmployee = location.state?.employee

  // État principal du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'technician',
    isActive: true,
    skills: [] // tableau d'ObjectId
  })

  const [availableSkills, setAvailableSkills] = useState([]) // liste des compétences disponibles
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loadingSkills, setLoadingSkills] = useState(true)

  const roles = [
    {
      value: 'super_admin',
      label: 'Super Administrateur',
      description: 'Pilotage global et administration avancée',
      icon: Shield,
      gradient: 'from-slate-700 to-slate-900',
      color: 'slate',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-300',
      textColor: 'text-slate-700'
    },
    { 
      value: 'admin', 
      label: 'Administrateur', 
      description: 'Accès complet à toutes les fonctionnalités',
      icon: Shield,
      gradient: 'from-purple-500 to-violet-500',
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-700'
    },
    {
      value: 'commercial_manager',
      label: 'Gestionnaire Commercial',
      description: 'Suivi revendeurs, VIP et performance commerciale',
      icon: Shield,
      gradient: 'from-fuchsia-500 to-pink-500',
      color: 'fuchsia',
      bgColor: 'bg-fuchsia-50',
      borderColor: 'border-fuchsia-300',
      textColor: 'text-fuchsia-700'
    },
    { 
      value: 'technician', 
      label: 'Technicien', 
      description: 'Gestion des réparations et échanges',
      icon: Wrench,
      gradient: 'from-blue-500 to-cyan-500',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-700'
    },
    { 
      value: 'cashier', 
      label: 'Caissier', 
      description: 'Gestion des ventes et paiements',
      icon: CreditCard,
      gradient: 'from-emerald-500 to-green-500',
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
      textColor: 'text-emerald-700'
    }
  ]

  const isEditing = Boolean(id && existingEmployee)

  // Chargement des compétences disponibles
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoadingSkills(true)
        const res = await api.get('/api/skills')
        if (res.data.success) {
          setAvailableSkills(res.data.data)
        } else {
          console.error('Erreur chargement compétences:', res.data.message)
        }
      } catch (err) {
        console.error('Erreur chargement compétences:', err)
        setError('Impossible de charger les compétences.')
      } finally {
        setLoadingSkills(false)
      }
    }
    fetchSkills()
  }, [])

  // Remplissage du formulaire en mode édition
  useEffect(() => {
    if (isEditing && existingEmployee) {
      setFormData({
        name: existingEmployee.name || '',
        email: existingEmployee.email || '',
        phone: existingEmployee.phone || '',
        password: '',
        role: existingEmployee.role || 'technician',
        isActive: existingEmployee.isActive !== false,
        skills: existingEmployee.skills?.map(s => s._id || s) || [] // on extrait les IDs
      })
    }
  }, [id, existingEmployee, isEditing])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSkillToggle = (skillId) => {
    setFormData(prev => {
      const currentSkills = prev.skills
      if (currentSkills.includes(skillId)) {
        return { ...prev, skills: currentSkills.filter(id => id !== skillId) }
      } else {
        return { ...prev, skills: [...currentSkills, skillId] }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation de base
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Les champs nom, email et téléphone sont obligatoires')
      return
    }

    if (formData.password && formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      setLoading(true)
      const payload = { ...formData }
      if (!payload.password) delete payload.password

      let response
      if (isEditing) {
        response = await api.put(`/api/admin/employees/${id}`, payload)
      } else {
        response = await api.post('/api/admin/employees', payload)
      }

      if (response.data.success) {
        setSuccess(isEditing ? 'Employé mis à jour avec succès' : 'Employé créé avec succès')
        setTimeout(() => navigate('/admin/employees'), 1500)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const getSelectedRole = () => roles.find(r => r.value === formData.role) || roles[1]

  // Fonction pour obtenir le nom d'une compétence à partir de son ID
  const getSkillName = (skillId) => {
    const skill = availableSkills.find(s => s._id === skillId)
    return skill ? skill.name : skillId
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-6">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/employees')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group mb-3"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Retour aux employés</span>
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {isEditing ? 'Modifier l\'employé' : 'Nouvel employé'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing 
              ? 'Modifiez les informations et permissions de l\'employé' 
              : 'Ajoutez un nouveau membre à votre équipe'}
          </p>
        </div>
        
        {isEditing && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl">
            <UserCheck size={16} />
            <span className="text-sm font-medium">Mode édition</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Carte Informations Personnelles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Informations Personnelles</h2>
                <p className="text-sm text-gray-500">Coordonnées et identifiants de l'employé</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom complet */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User size={16} className="text-blue-600" />
                  Nom complet
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Jean Dupont"
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all duration-200"
                    required
                  />
                  <User size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Mail size={16} className="text-blue-600" />
                  Adresse email
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jean@example.com"
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all duration-200"
                    required
                  />
                  <Mail size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Phone size={16} className="text-blue-600" />
                  Téléphone
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+225 XX XX XX XX XX"
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all duration-200"
                    required
                  />
                  <Phone size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Lock size={16} className="text-blue-600" />
                  {isEditing ? 'Nouveau mot de passe' : 'Mot de passe (optionnel)'}
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isEditing ? 'Laisser vide pour ne pas changer' : 'Minimum 6 caractères'}
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all duration-200"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!isEditing && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Si laissé vide, un mot de passe temporaire sera généré automatiquement
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Carte Rôle et Permissions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Rôle et Permissions</h2>
                <p className="text-sm text-gray-500">Définissez le niveau d'accès de l'employé</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roles.map((roleOption) => {
                const Icon = roleOption.icon
                const isSelected = formData.role === roleOption.value
                
                return (
                  <button
                    key={roleOption.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: roleOption.value }))}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left group ${
                      isSelected
                        ? `${roleOption.borderColor} ${roleOption.bgColor} shadow-lg scale-105`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${roleOption.gradient} ${
                        !isSelected && 'opacity-50 group-hover:opacity-100'
                      } transition-opacity`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      {isSelected && (
                        <CheckCircle size={20} className={roleOption.textColor} />
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{roleOption.label}</h3>
                    <p className="text-sm text-gray-600">{roleOption.description}</p>
                    {isSelected && (
                      <div className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${roleOption.bgColor} ${roleOption.textColor}`}>
                        <Star size={12} />
                        Rôle sélectionné
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Carte Compétences (uniquement pour technicien) */}
        {formData.role === 'technician' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500">
                  <Award size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Compétences Techniques</h2>
                  <p className="text-sm text-gray-500">Spécialités et domaines d'expertise</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {loadingSkills ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
              ) : availableSkills.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Tag size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Aucune compétence disponible</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Veuillez créer des compétences dans la <button 
                      onClick={() => navigate('/admin/skills')} 
                      className="text-blue-600 hover:underline font-medium"
                    >
                      gestion des compétences
                    </button>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableSkills.map((skill) => {
                      const isSelected = formData.skills.includes(skill._id)
                      return (
                        <div
                          key={skill._id}
                          onClick={() => handleSkillToggle(skill._id)}
                          className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{skill.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{skill.category || 'Général'}</div>
                              {skill.description && (
                                <div className="text-xs text-gray-400 mt-1 truncate">{skill.description}</div>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Affichage des compétences sélectionnées sous forme de tags */}
                  {formData.skills.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {formData.skills.length} compétence{formData.skills.length > 1 ? 's' : ''} sélectionnée{formData.skills.length > 1 ? 's' : ''} :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skillId) => {
                          const skill = availableSkills.find(s => s._id === skillId)
                          return skill ? (
                            <span
                              key={skill._id}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-200"
                            >
                              <Star size={14} className="text-blue-500" />
                              {skill.name}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSkillToggle(skill._id)
                                }}
                                className="ml-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Carte Statut (pour modification) */}
        {isEditing && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-r ${
                  formData.isActive ? 'from-emerald-500 to-green-500' : 'from-red-500 to-rose-500'
                }`}>
                  {formData.isActive ? (
                    <CheckCircle size={20} className="text-white" />
                  ) : (
                    <X size={20} className="text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Statut du compte</h2>
                  <p className="text-sm text-gray-500">Activez ou désactivez l'accès à l'application</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: true }))}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                    formData.isActive
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100 scale-105'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-xl ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-300'} transition-colors`}>
                      <CheckCircle size={24} className="text-white" />
                    </div>
                    {formData.isActive && (
                      <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                        Actif
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Compte actif</h3>
                  <p className="text-sm text-gray-600">
                    L'employé peut se connecter et accéder à l'application
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: false }))}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                    !formData.isActive
                      ? 'border-red-500 bg-red-50 shadow-lg shadow-red-100 scale-105'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-xl ${!formData.isActive ? 'bg-red-500' : 'bg-gray-300'} transition-colors`}>
                      <X size={24} className="text-white" />
                    </div>
                    {!formData.isActive && (
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        Inactif
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Compte inactif</h3>
                  <p className="text-sm text-gray-600">
                    L'employé ne peut pas se connecter à l'application
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barre d'actions */}
        <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 shadow-lg">
          <div className="w-full flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/employees')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
            >
              <X size={18} />
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditing ? 'Mettre à jour l\'employé' : 'Créer l\'employé'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}