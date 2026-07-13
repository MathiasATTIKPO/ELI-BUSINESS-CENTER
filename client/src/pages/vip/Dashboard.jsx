import React, { useState } from 'react';

const VIPDashboard = () => {
  const [vipId, setVipId] = useState('');
  const [invoices, setInvoices] = useState([]);

  const fetchInvoices = async () => {
    if (!vipId) return;
    try {
      const res = await fetch(`/api/vip/invoices?vipClientId=${vipId}`);
      const data = await res.json();
      if (data.success) setInvoices(data.data);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Espace Client VIP</h1>
      <div className="mb-4">
        <input className="input" placeholder="Votre ID VIP" value={vipId} onChange={e=>setVipId(e.target.value)} />
        <button className="btn btn-primary ml-2" onClick={fetchInvoices}>Voir factures</button>
      </div>
      <div>
        {invoices.map(inv => (
          <div key={inv._id} className="border p-3 my-2">
            <div>Facture #{inv._id.toString().slice(-6)} - Total: {inv.total}</div>
            <div>Période: {new Date(inv.periodStart).toLocaleDateString()} - {new Date(inv.periodEnd).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VIPDashboard;
