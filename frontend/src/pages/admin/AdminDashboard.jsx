import { useCallback, useEffect, useState } from 'react'
import { getProducts, getUserOrders, getLowStock, updateInventory } from '../../services/api'
import Toast from '../../components/Toast'
import Spinner from '../../components/Spinner'

function ProductsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  )
}

function OrdersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.994-4.694 2.602-7.163.084-.34-.17-.67-.52-.67H5.106M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  )
}

function LowStockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function StatCard({ icon, value, label, isLoading }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#1D1D1F]">
          {icon}
        </div>
        <div>
          {isLoading ? (
            <div className="h-7 w-16 animate-pulse rounded bg-[#F5F5F7]" />
          ) : (
            <p className="text-2xl font-bold text-[#1D1D1F]">{value}</p>
          )}
          <p className="text-sm text-[#6E6E73]">{label}</p>
        </div>
      </div>
    </div>
  )
}

function productName(item) {
  return item.product_name ?? item.name ?? `Product #${item.product_id ?? item.id}`
}

function productId(item) {
  return item.product_id ?? item.id
}

function quantityOf(item) {
  return item.quantity ?? item.stock ?? 0
}

function thresholdOf(item) {
  return item.threshold ?? item.reorder_level ?? item.low_stock_threshold ?? 10
}

export default function AdminDashboard() {
  const [productCount, setProductCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [lowStock, setLowStock] = useState([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [restockingId, setRestockingId] = useState(null)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const loadData = useCallback(async () => {
    setIsLoadingStats(true)

    const [productsResult, ordersResult, lowStockResult] = await Promise.allSettled([
      getProducts(),
      getUserOrders(1),
      getLowStock(),
    ])

    if (productsResult.status === 'fulfilled') {
      const products = Array.isArray(productsResult.value)
        ? productsResult.value
        : (productsResult.value?.products ?? [])
      setProductCount(products.length)
    }

    if (ordersResult.status === 'fulfilled') {
      const orders = Array.isArray(ordersResult.value)
        ? ordersResult.value
        : (ordersResult.value?.orders ?? [])
      setOrderCount(orders.length)
    }

    if (lowStockResult.status === 'fulfilled') {
      const items = Array.isArray(lowStockResult.value)
        ? lowStockResult.value
        : (lowStockResult.value?.items ?? [])
      setLowStock(items)
    }

    setIsLoadingStats(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadData()
  }, [loadData])

  const handleRestock = async (item) => {
    const id = productId(item)
    setRestockingId(id)
    try {
      const newQuantity = thresholdOf(item) + 20
      await updateInventory(id, newQuantity)
      setToast({ message: `Restocked ${productName(item)}`, type: 'success' })
      loadData()
    } catch {
      setToast({ message: 'Failed to restock item.', type: 'error' })
    } finally {
      setRestockingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold text-[#1D1D1F]">Dashboard</h1>
      <p className="mb-8 mt-1 text-sm text-[#6E6E73]">Overview of your store</p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<ProductsIcon />} value={productCount} label="Total Products" isLoading={isLoadingStats} />
        <StatCard icon={<OrdersIcon />} value={orderCount} label="Total Orders" isLoading={isLoadingStats} />
        <StatCard icon={<LowStockIcon />} value={lowStock.length} label="Low Stock Items" isLoading={isLoadingStats} />
        <StatCard icon={<UsersIcon />} value="Growing" label="Active Users" isLoading={false} />
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F]">Low Stock Alerts</h2>
        <p className="mb-4 mt-1 text-sm text-[#6E6E73]">Items that need restocking soon</p>

        {isLoadingStats ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-[#F5F5F7]" />
            ))}
          </div>
        ) : lowStock.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#6E6E73]">No low stock items. Everything looks good.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8E8ED] text-[#6E6E73]">
                  <th className="py-3 pr-4 font-medium">Product Name</th>
                  <th className="py-3 pr-4 font-medium">Current Stock</th>
                  <th className="py-3 pr-4 font-medium">Threshold</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item, idx) => (
                  <tr
                    key={productId(item) ?? idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F7]'}
                  >
                    <td className="py-3 pr-4 text-[#1D1D1F]">{productName(item)}</td>
                    <td className="py-3 pr-4 text-[#FF3B30] font-medium">{quantityOf(item)}</td>
                    <td className="py-3 pr-4 text-[#6E6E73]">{thresholdOf(item)}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleRestock(item)}
                        disabled={restockingId === productId(item)}
                        className="flex items-center gap-2 rounded-lg bg-[#0071E3] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0077ED] disabled:opacity-60"
                      >
                        {restockingId === productId(item) && <Spinner className="h-3 w-3" />}
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  )
}
