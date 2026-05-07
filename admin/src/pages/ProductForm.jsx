import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../services/api'
import Toast from '../components/Toast'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, watch } = useForm()
  const [loading, setLoading] = useState(!!id)
  const [toast, setToast] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (id && id !== 'new') {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/admin/products/${id}`)
      const product = response.data.data
      setValue('name', product.name)
      setValue('brand', product.brand)
      setValue('price', product.price)
      setValue('stock', product.stock)
      setValue('active', product.active)
      setPreview(product.photo)
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data) => {
    console.log('Form data received:', data)
    try {
      const formData = new FormData()
      formData.append('name', data.name || '')
      formData.append('brand', data.brand || '')
      formData.append('price', String(data.price || 0))
      formData.append('stock', String(data.stock || 0))
      formData.append('active', data.active ? 'true' : 'false')
      if (data.photo?.[0]) {
        formData.append('photo', data.photo[0])
      }

      console.log('FormData contents:')
      for (let [key, value] of formData.entries()) {
        console.log(key, value)
      }

      if (id && id !== 'new') {
        await api.put(`/api/admin/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setToast({ type: 'success', message: 'Produit mis à jour' })
      } else {
        await api.post('/api/admin/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setToast({ type: 'success', message: 'Produit créé' })
      }

      setTimeout(() => navigate('/admin/products'), 1500)
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Erreur' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <div>
        <h1 className="text-3xl font-bold text-primary">{id && id !== 'new' ? 'Modifier' : 'Ajouter'} un produit</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom du produit *</label>
          <input
            {...register('name', { required: true })}
            className="input-base"
            placeholder="iPhone 13 Pro"
          />
        </div>

         {/* marque */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Marque *</label>
          <input
            {...register('brand', { required: true })}
            className="input-base"
            placeholder="Apple"
          />
        </div>


        {/* Prix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prix (FCFA) *</label>
          <input
            {...register('price', { required: true, valueAsNumber: true })}
            type="number"
            className="input-base"
            placeholder="350000"
          />
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
          <input
            {...register('stock', { required: true, valueAsNumber: true })}
            type="number"
            className="input-base"
            placeholder="10"
          />
        </div>

        {/* Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo du produit</label>
          <input
            {...register('photo')}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="input-base"
          />
          {preview && (
            <img src={preview} alt="Preview" className="mt-4 max-w-xs h-40 object-cover rounded" />
          )}
        </div>

        {/* Actif */}
        <div className="flex items-center gap-3">
          <input
            {...register('active')}
            type="checkbox"
            className="w-4 h-4"
          />
          <label className="text-sm font-medium text-gray-700">Produit actif</label>
        </div>

        {/* Boutons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            {id && id !== 'new' ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  )
}
