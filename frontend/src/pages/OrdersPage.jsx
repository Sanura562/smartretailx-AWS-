import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserOrders } from '../services/api'

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#F5F5F7"/><path d="M24 52l12-15 8 9 12-16 14 22H24z" fill="#D2D2D7"/><circle cx="30" cy="30" r="6" fill="#D2D2D7"/></svg>`,
  )

const STATUS_STYLES = {
  pending: 'bg-[#F5F5F7] text-[#6E6E73]',
  confirmed: 'bg-[#0071E3]/10 text-[#0071E3]',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-[#1D7A1D]/10 text-[#1D7A1D]',
  cancelled: 'bg-[#FF3B30]/10 text-[#FF3B30]',
}

function StatusBadge({ status }) {
  const className = STATUS_STYLES[status] ?? 'bg-[#F5F5F7] text-[#6E6E73]'
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${className}`}>
      {status}
    </span>
  )
}

function OrdersEmptyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mx-auto h-20 w-20 text-[#D2D2D7]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 0a2.25 2.25 0 00-2.25 2.25v6.75A2.25 2.25 0 003.75 20.25h16.5a2.25 2.25 0 002.25-2.25v-6.75A2.25 2.25 0 0020.25 9m-16.5 0V6.75A2.25 2.25 0 015.25 4.5h13.5a2.25 2.25 0 012.25 2.25V9" />
    </svg>
  )
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false)
  const items = order.items ?? []
  const total = order.total ?? items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  return (
    <div className="mb-4 rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-[#1D1D1F]">Order #{order.id}</p>
          <p className="mt-1 text-sm text-[#6E6E73]">
            {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {items.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-[#E8E8ED] pt-4">
          {(expanded ? items : items.slice(0, 2)).map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F5F5F7]">
                <img src={PLACEHOLDER_IMAGE} alt="" className="h-full w-full object-cover" />
              </div>
              <span className="flex-1 text-sm text-[#1D1D1F]">
                {item.product_name} &times; {item.quantity}
              </span>
              <span className="text-sm text-[#6E6E73]">${(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-[#E8E8ED] pt-4">
        <p className="text-base font-bold text-[#1D1D1F]">Total: ${Number(total).toFixed(2)}</p>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="rounded-lg border border-[#D2D2D7] px-4 py-1.5 text-sm font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
        >
          {expanded ? 'Hide Details' : 'Order Details'}
        </button>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset loading state when the user id becomes available
    setIsLoading(true)
    getUserOrders(user.id)
      .then((data) => {
        if (!cancelled) setOrders(Array.isArray(data) ? data : (data?.orders ?? []))
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load your orders right now.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  return (
    <div className="mx-auto max-w-[1200px] px-12 pb-20 pt-6">
      <h1 className="text-[32px] font-bold text-[#1D1D1F]">Order History</h1>
      <p className="mb-8 mt-1 text-sm text-[#6E6E73]">Track your shipments</p>

      {error && (
        <div className="mb-6 rounded-lg bg-[#FF3B30]/10 px-4 py-3 text-sm text-[#FF3B30]">{error}</div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#F5F5F7]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D2D2D7] py-20 text-center">
          <OrdersEmptyIcon />
          <p className="mt-6 text-lg font-medium text-[#1D1D1F]">No orders yet</p>
          <p className="mt-1 text-sm text-[#6E6E73]">Your placed orders will show up here.</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-[#0071E3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ED]"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
