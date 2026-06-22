import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  ArrowLeft, 
  Save, 
  Smartphone, 
  Tag, 
  DollarSign, 
  Package, 
  Image, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Upload,
  Camera,
  Info,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
  Star,
  Shield,
  Box,
  Eye,
  EyeOff,
  Truck
} from 'lucide-react'
import api from '../services/api'
import Toast from '../components/Toast'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    mode: 'onChange'
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [preview, setPreview] = useState(null)
  const [active, setActive] = useState(true)
  const [dragActive, setDragActive] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const watchPrice = watch('price')
  const watchStock = watch('stock')

  const isEditing = id && id !== 'new'

  useEffect(() => {
    if (isEditing && !isFetching) {
      fetchProduct()
    }
  }, [id]) // Dépendance uniquement sur id

  const fetchProduct = async () => {
    if (isFetching) return; // Évite les appels multiples
    
    setIsFetching(true)
    setLoading(true)
    
    try {
      const response = await api.get(`/api/admin/products/${id}`)
      const product = response.data.data
      
      // Mise à jour des valeurs du formulaire
      setValue('name', product.name || '')
      setValue('brand', product.brand || '')
      setValue('price', product.price || 0)
      setValue('stock', product.stock || 0)
      setActive(product.active !== undefined ? product.active : true)
      
      // Gestion de la photo
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'
      const firstPhoto = product.photos && product.photos.length > 0 ? product.photos[0] : null
      setPreview(firstPhoto ? `${base}${firstPhoto}` : null)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setToast({ type: 'error', message: 'Erreur lors du chargement du produit' })
    } finally {
      setLoading(false)
      setIsFetching(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const processFile = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setToast({ type: 'error', message: 'Veuillez sélectionner une image valide' })
    }
  }

  const onSubmit = async (data) => {
    try {
      const formData = new FormData()
      formData.append('name', data.name || '')
      formData.append('brand', data.brand || '')
      formData.append('price', String(data.price || 0))
      formData.append('stock', String(data.stock || 0))
      formData.append('active', active ? 'true' : 'false')
      
      if (data.photo?.[0]) {
        formData.append('photo', data.photo[0])
      }

      if (isEditing) {
        await api.put(`/api/admin/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setToast({ type: 'success', message: 'Produit mis à jour avec succès' })
      } else {
        await api.post('/api/admin/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setToast({ type: 'success', message: 'Produit créé avec succès' })
      }

      setTimeout(() => navigate('/admin/products'), 1500)
    } catch (error) {
      console.error('Erreur:', error)
      setToast({ type: 'error', message: error.response?.data?.message || 'Erreur lors de l\'enregistrement' })
    }
  }

  // État de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600"></div>
            <ShoppingBag className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">
            {isEditing ? 'Chargement du produit...' : 'Préparation du formulaire...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group mb-3"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Retour au catalogue</span>
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing 
              ? 'Modifiez les informations et caractéristiques du produit' 
              : 'Ajoutez un nouveau produit à votre catalogue'}
          </p>
        </div>
        
        {isEditing && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl">
            <Info size={16} />
            <span className="text-sm font-medium">Mode édition</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Carte Informations principales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                <Smartphone size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Informations du produit</h2>
                <p className="text-sm text-gray-500">Caractéristiques principales et essentielles</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom du produit */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-blue-600" />
                  Nom du produit
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    {...register('name', { 
                      required: 'Le nom du produit est requis',
                      minLength: { value: 2, message: 'Le nom doit contenir au moins 2 caractères' }
                    })}
                    className={`w-full pl-4 pr-12 py-3 border-2 rounded-xl transition-all duration-200
                      ${errors.name 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
                      }`}
                    placeholder="Ex: iPhone 15 Pro Max"
                  />
                  <Smartphone size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Marque */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Star size={16} className="text-blue-600" />
                  Marque
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    {...register('brand', { 
                      required: 'La marque est requise'
                    })}
                    className={`w-full pl-4 pr-12 py-3 border-2 rounded-xl transition-all duration-200
                      ${errors.brand 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
                      }`}
                    placeholder="Ex: Apple, Samsung"
                  />
                  <Shield size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                {errors.brand && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.brand.message}
                  </p>
                )}
              </div>

              {/* Prix */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-emerald-600" />
                  Prix de vente (FCFA)
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    {...register('price', { 
                      required: 'Le prix est requis',
                      min: { value: 0, message: 'Le prix doit être positif' },
                      valueAsNumber: true
                    })}
                    type="number"
                    className={`w-full pl-4 pr-16 py-3 border-2 rounded-xl transition-all duration-200
                      ${errors.price 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
                      }`}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-semibold text-gray-400 group-hover:text-emerald-500 transition-colors">
                    FCFA
                  </span>
                </div>
                {errors.price && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.price.message}
                  </p>
                )}
                {watchPrice > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                    <Sparkles size={14} className="text-emerald-600" />
                    <p className="text-sm text-emerald-700">
                      Prix formaté : <span className="font-bold">{Number(watchPrice).toLocaleString('fr-FR')} FCFA</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Package size={16} className="text-blue-600" />
                  Quantité en stock
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    {...register('stock', { 
                      required: 'Le stock est requis',
                      min: { value: 0, message: 'Le stock ne peut pas être négatif' },
                      valueAsNumber: true
                    })}
                    type="number"
                    className={`w-full pl-4 pr-12 py-3 border-2 rounded-xl transition-all duration-200
                      ${errors.stock 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
                      }`}
                    placeholder="0"
                  />
                  <Box size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                {errors.stock && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.stock.message}
                  </p>
                )}
                {watchStock !== undefined && watchStock >= 0 && (
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${
                    watchStock === 0 
                      ? 'bg-red-50' 
                      : watchStock < 5 
                        ? 'bg-orange-50' 
                        : 'bg-green-50'
                  }`}>
                    {watchStock === 0 ? (
                      <>
                        <XCircle size={14} className="text-red-600" />
                        <p className="text-sm text-red-700">Produit en rupture de stock</p>
                      </>
                    ) : watchStock < 5 ? (
                      <>
                        <AlertTriangle size={14} className="text-orange-600" />
                        <p className="text-sm text-orange-700">Stock faible : {watchStock} unité(s) restante(s)</p>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} className="text-green-600" />
                        <p className="text-sm text-green-700">Stock disponible : {watchStock} unité(s)</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Carte Photo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <Camera size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Photo du produit</h2>
                <p className="text-sm text-gray-500">Ajoutez une image attractive pour le produit</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50 scale-105' 
                    : preview 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                {preview ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img 
                        src={preview} 
                        alt="Aperçu du produit" 
                        className="w-48 h-48 object-cover rounded-2xl shadow-lg ring-4 ring-white" 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreview(null)
                          const input = document.querySelector('input[type="file"]')
                          if (input) input.value = ''
                        }}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                      <CheckCircle size={16} />
                      Image chargée avec succès
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                      <Upload size={32} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">
                        Glissez-déposez une image ici
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ou cliquez pour sélectionner un fichier
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Formats acceptés : JPG, PNG, WebP • Max 5MB
                    </p>
                  </div>
                )}
                
                <input
                  {...register('photo')}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {!preview && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                  <Info size={16} className="text-blue-600" />
                  <p className="text-sm text-blue-700">
                    Une bonne photo augmente les ventes de 30%. Utilisez une image claire et professionnelle.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carte Statut */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-r ${active ? 'from-emerald-500 to-green-500' : 'from-red-500 to-rose-500'}`}>
                {active ? <Eye size={20} className="text-white" /> : <EyeOff size={20} className="text-white" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Statut du produit</h2>
                <p className="text-sm text-gray-500">Contrôlez la visibilité du produit dans le catalogue</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setActive(true)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                  active 
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100 scale-105' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl ${active ? 'bg-emerald-500' : 'bg-gray-300'} transition-colors`}>
                    <CheckCircle size={24} className="text-white" />
                  </div>
                  {active && (
                    <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                      Actif
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Produit actif</h3>
                <p className="text-sm text-gray-600">
                  Visible dans le catalogue et disponible à la vente
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
                  <Truck size={16} />
                  <span>Prêt à la vente</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActive(false)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                  !active 
                    ? 'border-red-500 bg-red-50 shadow-lg shadow-red-100 scale-105' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl ${!active ? 'bg-red-500' : 'bg-gray-300'} transition-colors`}>
                    <XCircle size={24} className="text-white" />
                  </div>
                  {!active && (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      Inactif
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Produit inactif</h3>
                <p className="text-sm text-gray-600">
                  Masqué du catalogue et indisponible à la vente
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
                  <EyeOff size={16} />
                  <span>Non visible</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
          >
            <XCircle size={18} />
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105"
          >
            <Save size={18} />
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Enregistrement...
              </>
            ) : (
              isEditing ? 'Mettre à jour le produit' : 'Créer le produit'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}