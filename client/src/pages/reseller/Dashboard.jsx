import React, { useEffect, useState } from 'react';

const ResellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ resellerId: '', productId: '', proposedPrice: '', comment: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/client/products')
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data); })
      .catch(console.error);
  }, []);

  const submitRequest = async (e) => {
    e.preventDefault();
    setMessage('Envoi...');
    try {
      const res = await fetch('/api/reseller/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) setMessage('Demande envoyée'); else setMessage(data.message || 'Erreur');
    } catch (e) { setMessage('Erreur'); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Espace Revendeur</h1>
      <section className="mb-6">
        <h2 className="font-semibold">Catalogue</h2>
        <div className="grid grid-cols-3 gap-4 mt-3">
          {products.map(p => (
            <div key={p._id} className="border p-3 rounded">
              <div className="font-bold">{p.name}</div>
              <div className="text-sm">{p.brand}</div>
              <div className="text-sm">Prix: {p.price}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Demander un téléphone</h2>
        <form onSubmit={submitRequest} className="space-y-3 mt-3">
          <input placeholder="Votre ID revendeur" value={form.resellerId} onChange={e=>setForm({...form,resellerId:e.target.value})} className="input" />
          <select value={form.productId} onChange={e=>setForm({...form,productId:e.target.value})} className="input">
            <option value="">Sélectionner un produit</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.name} - {p.brand}</option>)}
          </select>
          <input placeholder="Prix proposé" value={form.proposedPrice} onChange={e=>setForm({...form,proposedPrice:e.target.value})} className="input" />
          <textarea placeholder="Commentaire" value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})} className="input" />
          <div>
            <button className="btn btn-primary" type="submit">Envoyer la demande</button>
            <span className="ml-3">{message}</span>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ResellerDashboard;
