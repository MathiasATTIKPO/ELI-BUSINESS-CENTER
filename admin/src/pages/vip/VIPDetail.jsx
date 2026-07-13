import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../services/api'
import PageHeader from '../../components/PageHeader'

const VIPDetail = () => {
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/api/admin/vips/${id}`)
        if (res.data.success) setData(res.data.data)
      } catch (e) { console.error(e) }
    }
    fetch()
  }, [id])

  if (!data) return <div className="eli-content">Chargement...</div>

  return (
    <div className="eli-canvas">
      <div className="eli-content">
      <PageHeader title={`VIP: ${data.name}`} />
      <div className="eli-shell p-5 space-y-2">
        <div>Téléphone: {data.phone}</div>
        <div>Email: {data.email}</div>
        <div>Actif: {data.isActive ? 'Oui' : 'Non'}</div>
      </div>
      </div>
    </div>
  )
}

export default VIPDetail
