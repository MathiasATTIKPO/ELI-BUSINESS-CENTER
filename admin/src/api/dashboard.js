import client from './client'

export const getRepairs = () => client.get('/api/admin/repairs')
export const getEmployees = () => client.get('/api/admin/employees')
export const getTradeins = () => client.get('/api/admin/tradeins')
export const getProducts = () => client.get('/api/admin/products')
export const getInventory = () => client.get('/api/admin/inventory')
export const getSales = () => client.get('/api/admin/sales')

export const getResellers = () => client.get('/api/admin/resellers').catch(() => ({ data: { data: [] } }))
export const getResellerContracts = () => client.get('/api/admin/resellers/contracts/all').catch(() => ({ data: { data: [] } }))
export const getVipClients = () => client.get('/api/admin/vips').catch(() => ({ data: { data: [] } }))
export const getVipRepairs = () => client.get('/api/admin/vips/repairs').catch(() => ({ data: { data: [] } }))
export const getVipInvoices = () => client.get('/api/admin/vips/invoices').catch(() => ({ data: { data: [] } }))

export const downloadInvoicePdf = (type, id) => {
  let endpoint = ''
  if (type === 'phone') endpoint = `/api/admin/sales/${id}/invoice`
  if (type === 'repair') endpoint = `/api/admin/repairs/${id}/invoice`
  if (type === 'tradein') endpoint = `/api/admin/tradeins/${id}/invoice`
  return client.get(endpoint, { responseType: 'blob' })
}
