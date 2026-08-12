import { useCallback, useEffect, useState } from 'react'
import { getAllOrders, updateOrderStatus } from '../../services/api'
import Toast from '../../components/Toast'
import Spinner from '../../components/Spinner'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

const STATUS_STYLES = {
  pending: 'bg-[#F5F5F7] text-[#6E6E73]',
  confirmed: 'bg-[#0071E3]/10 text-[#0071E3]',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-[#1D7A1D]/10 text-[#1D7A1D]',
  cancelled: 'bg-[#FF3B30]/10 text-[#FF3B30]',
}

const SAMPLE_ORDERS = [
  {
    id: 1001,
    user_id: 2,
    status: 'pending',
    created_at: new Date().toISOString(),
    items: [
      { product_name: 'Wireless Headphones', quantity: 1, unit_price: 129.99 },
      { product_name: 'USB-C Cable', quantity: 2, unit_price: 14.99 },
    ],
  },
  {
    id: 1002,
    user_id: 3,
    status: 'shipped',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    items: [{ product_name: 'Smart Watch', quantity: 1, unit_price: 249.0 }],
  },
  {
    id: 1003,
    user_id: 4,
    status: 'delivered',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    items: [{ product_name: 'Bluetooth Speaker', quantity: 1, unit_price: 89.5 }],
  },
]

function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
      {status}
    </span>
  )
}

function orderTotal(order) {
  if (order.total != null) return Number(order.total)
  const items = order.items ?? []
  return items.reduce((sum, item) => sum + (item.unit_price ?? item.price ?? 0) * (item.quantity ?? 1), 0)
}

function OrderRow({ order, onStatusChange, isUpdating }) {
  const [expanded, setExpanded] = useState(false)
  const items = order.items ?? []

  return (
    <>
      <tr className="cursor-pointer hover:bg-[#F5F5F7]" onClick={() => setExpanded((e) => !e)}>
        <td className="py-3 pr-4 font-medium text-[#1D1D1F]">#{order.id}</td>
        <td className="py-3 pr-4 text-[#6E6E73]">{order.user_id}</td>
        <td className="py-3 pr-4 text-[#6E6E73]">{items.length}</td>
        <td className="py-3 pr-4 text-[#1D1D1F]">${orderTotal(order).toFixed(2)}</td>
        <td className="py-3 pr-4">
          <StatusBadge status={order.status} />
        </td>
        <td className="py-3 pr-4 text-[#6E6E73]">
          {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
        </td>
        <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order, e.target.value)}
              disabled={isUpdating}
              className="rounded-lg border border-[#D2D2D7] px-2 py-1.5 text-xs font-medium capitalize focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40 disabled:opacity-60"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {isUpdating && <Spinner className="h-3 w-3 text-[#6E6E73]" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[#F5F5F7]">
          <td colSpan={7} className="px-4 py-4">
            {items.length === 0 ? (
              <p className="text-sm text-[#6E6E73]">No item details available.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-[#1D1D1F]">
                      {item.product_name ?? `Product #${item.product_id}`} &times; {item.quantity}
                    </span>
                    <span className="text-[#6E6E73]">
                      ${((item.unit_price ?? item.price ?? 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [usingSampleData, setUsingSampleData] = useState(false)
  const [filter, setFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const loadOrders = useCallback(() => {
    setIsLoading(true)
    getAllOrders()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.orders ?? [])
        if (list.length === 0) {
          setOrders(SAMPLE_ORDERS)
          setUsingSampleData(true)
        } else {
          setOrders(list)
          setUsingSampleData(false)
        }
      })
      .catch(() => {
        setOrders(SAMPLE_ORDERS)
        setUsingSampleData(true)
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadOrders()
  }, [loadOrders])

  const handleStatusChange = async (order, newStatus) => {
    setUpdatingId(order.id)
    try {
      await updateOrderStatus(order.id, newStatus)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)))
      setToast({ message: `Order #${order.id} updated to ${newStatus}.`, type: 'success' })
    } catch {
      setToast({ message: 'Failed to update order status.', type: 'error' })
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div>
      <h1 className="text-[28px] font-bold text-[#1D1D1F]">Orders Management</h1>
      <p className="mb-6 mt-1 text-sm text-[#6E6E73]">Track and update customer orders</p>

      {usingSampleData && !isLoading && (
        <div className="mb-4 rounded-lg bg-[#0071E3]/10 px-4 py-3 text-sm text-[#0071E3]">
          The orders list endpoint isn&apos;t available yet — showing sample data for preview.
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {['all', ...STATUSES.slice(0, 4)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              filter === s
                ? 'bg-[#1D1D1F] text-white'
                : 'border border-[#D2D2D7] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-[#F5F5F7]" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#6E6E73]">No orders match this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8E8ED] text-[#6E6E73]">
                  <th className="py-3 pr-4 font-medium">Order ID</th>
                  <th className="py-3 pr-4 font-medium">User ID</th>
                  <th className="py-3 pr-4 font-medium">Items</th>
                  <th className="py-3 pr-4 font-medium">Total</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Date</th>
                  <th className="py-3 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    isUpdating={updatingId === order.id}
                  />
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
