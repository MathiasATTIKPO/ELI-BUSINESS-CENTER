import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Clock, 
  Award, 
  Plus, 
  Edit, 
  Trash2,
  X,
  CheckCircle,
  Loader2,
  Save,
  Globe
} from 'lucide-react'
import Toast from '../../components/Toast'  // chemin corrigé
import api from '../../services/api'       // chemin corrigé

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Paramètres
  const [settings, setSettings] = useState({
    reseller: {
      pickupDelayHours: 48,
      paymentCollectionHours: 5,
      maxOverdueOverride: 72,
      lateFeePercent: 10
    },
    general: {
      currency: 'FCFA',
      companyName: 'Eli Business Center',
      companyPhone: '+228 90 17 84 75',
      companyAddress: 'Lome, Togo'
    }
  })

  // Compétences
  const [skills, setSkills] = useState([])
  const [skillForm, setSkillForm] = useState({ name: '', description: '', category: 'Général' })
  const [editingSkill, setEditingSkill] = useState(null)
  const [showSkillForm, setShowSkillForm] = useState(false)
  const [skillLoading, setSkillLoading] = useState(false)

  const categories = ['Réparation', 'Diagnostic', 'Maintenance', 'Logiciel', 'Réseau', 'Général']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [settingsRes, skillsRes] = await Promise.all([
        api.get('/api/settings'),
        api.get('/api/settings/skills')
      ])
      if (settingsRes.data.success) setSettings(settingsRes.data.data)
      if (skillsRes.data.success) setSkills(skillsRes.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put('/api/settings', settings)
      if (res.data.success) {
        setSuccess('Paramètres mis à jour avec succès')
        setSettings(res.data.data)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // Gestion compétences
  const handleAddSkill = async (e) => {
    e.preventDefault()
    if (!skillForm.name.trim()) return
    setSkillLoading(true)
    try {
      if (editingSkill) {
        const res = await api.put(`/api/settings/skills/${editingSkill._id}`, skillForm)
        if (res.data.success) {
          setSkills(skills.map(s => s._id === editingSkill._id ? res.data.data : s))
          setSuccess('Compétence mise à jour')
        }
      } else {
        const res = await api.post('/api/settings/skills', skillForm)
        if (res.data.success) {
          setSkills([...skills, res.data.data])
          setSuccess('Compétence créée')
        }
      }
      setSkillForm({ name: '', description: '', category: 'Général' })
      setEditingSkill(null)
      setShowSkillForm(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    } finally {
      setSkillLoading(false)
    }
  }

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Supprimer cette compétence ?')) return
    try {
      await api.delete(`/api/settings/skills/${id}`)
      setSkills(skills.filter(s => s._id !== id))
      setSuccess('Compétence supprimée')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    }
  }

  const handleEditSkill = (skill) => {
    setEditingSkill(skill)
    setSkillForm({ name: skill.name, description: skill.description || '', category: skill.category || 'Général' })
    setShowSkillForm(true)
  }

  const tabs = [
    {
      key: 'general',
      label: 'Paramètres généraux',
      icon: SettingsIcon,
      description: 'Configurez les délais des contrats revendeurs et les informations de l\'entreprise.'
    },
    {
      key: 'skills',
      label: 'Compétences techniques',
      icon: Award,
      description: 'Gérez les spécialités des techniciens.'
    }
  ]

  const currentTab = tabs.find(t => t.key === activeTab) || tabs[0]
  const TabIcon = currentTab.icon

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-8">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Paramètres
        </h1>
        <p className="text-gray-500 mt-1">Configurez l'application et gérez les compétences des techniciens</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Onglets */}
        <div className="px-4 sm:px-6 pt-5 border-b border-gray-100 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.key === activeTab
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                  isActive
                    ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="p-6 space-y-6">
          {/* En-tête de l'onglet */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
              <TabIcon size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentTab.label}</h2>
              <p className="text-gray-600 mt-1">{currentTab.description}</p>
            </div>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Section Revendeurs */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <Clock size={18} className="text-amber-600" />
                  Contrats revendeurs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Délai de retrait (heures)</label>
                    <input
                      type="number"
                      min="1"
                      max="720"
                      value={settings.reseller.pickupDelayHours}
                      onChange={(e) => setSettings({
                        ...settings,
                        reseller: { ...settings.reseller, pickupDelayHours: parseInt(e.target.value) || 48 }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Délai pour retirer le téléphone après validation</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Délai d'encaissement (heures)</label>
                    <input
                      type="number"
                      min="1"
                      max="72"
                      value={settings.reseller.paymentCollectionHours}
                      onChange={(e) => setSettings({
                        ...settings,
                        reseller: { ...settings.reseller, paymentCollectionHours: parseInt(e.target.value) || 5 }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Délai pour encaisser après déclaration de vente</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Délai max de dépassement (heures)</label>
                    <input
                      type="number"
                      min="1"
                      max="720"
                      value={settings.reseller.maxOverdueOverride}
                      onChange={(e) => setSettings({
                        ...settings,
                        reseller: { ...settings.reseller, maxOverdueOverride: parseInt(e.target.value) || 72 }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Délai max avant que seul un manager puisse encaisser</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pénalité de retard (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.reseller.lateFeePercent}
                      onChange={(e) => setSettings({
                        ...settings,
                        reseller: { ...settings.reseller, lateFeePercent: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Pourcentage appliqué en cas de retard</p>
                  </div>
                </div>
              </div>

              {/* Section Général */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <Globe size={18} className="text-blue-600" />
                  Informations générales
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
                    <input
                      type="text"
                      value={settings.general.companyName}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, companyName: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="text"
                      value={settings.general.companyPhone}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, companyPhone: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={settings.general.companyAddress}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, companyAddress: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                    <input
                      type="text"
                      value={settings.general.currency}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, currency: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
              </button>
            </form>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {skills.length} compétence{skills.length > 1 ? 's' : ''} enregistrée{skills.length > 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => { setShowSkillForm(true); setEditingSkill(null); setSkillForm({ name: '', description: '', category: 'Général' }); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium"
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>

              {showSkillForm && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-semibold mb-3">{editingSkill ? 'Modifier' : 'Nouvelle'} compétence</h3>
                  <form onSubmit={handleAddSkill} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nom"
                      value={skillForm.name}
                      onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Description (optionnelle)"
                      value={skillForm.description}
                      onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <select
                        value={skillForm.category}
                        onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <button
                        type="submit"
                        disabled={skillLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {skillLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowSkillForm(false); setEditingSkill(null); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {skills.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Award size={48} className="mx-auto text-gray-300 mb-2" />
                  <p>Aucune compétence enregistrée</p>
                  <p className="text-sm">Ajoutez des compétences pour les techniciens</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {skills.map(skill => (
                    <div key={skill._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div>
                        <span className="font-medium">{skill.name}</span>
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{skill.category}</span>
                        {skill.description && <p className="text-xs text-gray-500 mt-0.5">{skill.description}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditSkill(skill)} className="p-1 hover:bg-blue-100 rounded-lg transition text-blue-600">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteSkill(skill._id)} className="p-1 hover:bg-red-100 rounded-lg transition text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}