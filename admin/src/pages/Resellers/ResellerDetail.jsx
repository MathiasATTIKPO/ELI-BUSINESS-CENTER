import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const ResellerDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);

  const fetch = async () => {
    try {
      const res = await api.get(`/api/admin/resellers/${id}`);
      if (res.data && res.data.success) setData(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetch(); }, [id]);

  if (!data) return <div className="eli-content">Chargement...</div>;

  return (
    <div className="eli-canvas">
      <div className="eli-content">
      <PageHeader title={`Revendeur: ${data.seller.name}`} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="eli-shell p-5">
          <h3 className="font-bold">Infos</h3>
          <p>Téléphone: {data.seller.phone}</p>
          <p>Email: {data.seller.email}</p>
          <p>Adresse: {data.seller.address}</p>
        </div>
        <div className="eli-shell p-5">
          <h3 className="font-bold">Stats</h3>
          <p>Téléphones retirés: {data.seller.stats.withdrawnCount}</p>
          <p>Téléphones vendus: {data.seller.stats.soldCount}</p>
          <p>Téléphones retournés: {data.seller.stats.returnedCount}</p>
          <p>Montant total: {data.seller.stats.totalGenerated}</p>
        </div>
      </div>

      <div className="eli-shell p-5 mt-6">
        <h3 className="font-bold">Contrats</h3>
        <ul>
          {data.contracts.map(c => (
            <li key={c._id} className="border border-slate-200 rounded-lg p-3 my-2 bg-white">
              <div>#{c.number} - {c.status}</div>
              <div>Produit: {c.product?.name || c.product}</div>
              <div>IMEI: {c.imei}</div>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
};

export default ResellerDetail;
