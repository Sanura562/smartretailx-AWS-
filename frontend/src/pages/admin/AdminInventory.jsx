import { useCallback, useEffect, useState } from 'react'
import { getProducts, getInventory, updateInventory, createInventory } from '../../services/api'
import Toast from '../../components/Toast'
import Spinner from '../../components/Spinner'

function statusFor(quantity, threshold) {
  if (quantity <= 0) return { label: 'Out of Stock', className: 'bg-[#FF3B30]/10 text-[#FF3B30]' }
  if (quantity <= threshold) return { label: 'Low Stock', className: 'bg-[#FF6B00]/10 text-[#FF6B00]' }
  return { label: 'In Stock', className: 'bg-[#1D7A1D]/10 text-[#1D7A1D]' }
}

function UpdateStockModal({ row, onClose, onSaved, onError }) {
  const [quantity, setQuantity] = useState(row.quantity)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateInventory(row.product_id, Number(quantity))
      onSaved('Stock updated successfully.')
    } catch {
      onError('Failed to update stock.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.24)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F]">Update Stock</h2>
        <p className="mt-1 text-sm text-[#6E6E73]">{row.product_name}</p>

        <form onSubmit={handleSubmit} className="mt-4">
          <label className="mb-1 block text-sm font-medium text-[#1D1D1F]">Quantity</label>
          <input
            type="number"
            min="0"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-[#D2D2D7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
          />

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#D2D2D7] px-4 py-2 text-sm font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-[#0071E3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0077ED] disabled:opacity-60"
            >
              {isSaving && <Spinner className="h-4 w-4" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddInventoryModal({ onClose, onSaved, onError }) {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [threshold, setThreshold] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await createInventory({
        product_id: Number(productId),
        quantity: Number(quantity) || 0,
        threshold: Number(threshold) || 10,
      })
      onSaved('Inventory record created successfully.')
    } catch {
      onError('Failed to create inventory record.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.24)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F]">Add Inventory Record</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1D1D1F]">Product ID</label>
            <input
              type="number"
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-lg border border-[#D2D2D7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1D1D1F]">Quantity</label>
            <input
              type="number"
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-[#D2D2D7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1D1D1F]">Low Stock Threshold</label>
            <input
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="10"
              className="w-full rounded-lg border border-[#D2D2D7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#D2D2D7] px-4 py-2 text-sm font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-[#0071E3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0077ED] disabled:opacity-60"
            >
              {isSaving && <Spinner className="h-4 w-4" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminInventory() {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updateTarget, setUpdateTarget] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const loadInventory = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const productsData = await getProducts()
      const products = Array.isArray(productsData) ? productsData : (productsData?.products ?? [])

      const inventoryResults = await Promise.allSettled(
        products.map((p) => getInventory(p.id)),
      )

      const merged = products.map((product, idx) => {
        const result = inventoryResults[idx]
        const inv = result.status === 'fulfilled' ? result.value : null
        return {
          product_id: product.id,
          product_name: product.name,
          quantity: inv?.quantity ?? inv?.stock ?? 0,
          threshold: inv?.threshold ?? inv?.reorder_level ?? inv?.low_stock_threshold ?? 10,
        }
      })

      setRows(merged)
    } catch {
      setError('Unable to load inventory right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadInventory()
  }, [loadInventory])

  const handleSaved = (message) => {
    setUpdateTarget(null)
    setShowAddModal(false)
    setToast({ message, type: 'success' })
    loadInventory()
  }

  const handleError = (message) => {
    setToast({ message, type: 'error' })
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-[28px] font-bold text-[#1D1D1F]">Inventory Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-[#0071E3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0077ED]"
        >
          + Add Inventory Record
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        {error && (
          <div className="mb-4 rounded-lg bg-[#FF3B30]/10 px-4 py-3 text-sm text-[#FF3B30]">{error}</div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-[#F5F5F7]" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#6E6E73]">No inventory records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8E8ED] text-[#6E6E73]">
                  <th className="py-3 pr-4 font-medium">Product ID</th>
                  <th className="py-3 pr-4 font-medium">Product Name</th>
                  <th className="py-3 pr-4 font-medium">Current Stock</th>
                  <th className="py-3 pr-4 font-medium">Threshold</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const status = statusFor(row.quantity, row.threshold)
                  const isLow = row.quantity <= row.threshold
                  return (
                    <tr
                      key={row.product_id}
                      className={isLow ? 'bg-[#FF6B00]/5' : 'bg-white'}
                    >
                      <td className="py-3 pr-4 text-[#6E6E73]">#{row.product_id}</td>
                      <td className="py-3 pr-4 font-medium text-[#1D1D1F]">{row.product_name}</td>
                      <td className="py-3 pr-4 text-[#1D1D1F]">{row.quantity}</td>
                      <td className="py-3 pr-4 text-[#6E6E73]">{row.threshold}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => setUpdateTarget(row)}
                          className="rounded-lg border border-[#D2D2D7] px-3 py-1.5 text-xs font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
                        >
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {updateTarget && (
        <UpdateStockModal
          row={updateTarget}
          onClose={() => setUpdateTarget(null)}
          onSaved={handleSaved}
          onError={handleError}
        />
      )}

      {showAddModal && (
        <AddInventoryModal
          onClose={() => setShowAddModal(false)}
          onSaved={handleSaved}
          onError={handleError}
        />
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  )
}
