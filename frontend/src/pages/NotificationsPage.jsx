import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getNotifications, markNotificationRead } from '../services/api'

function BellEmptyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mx-auto h-16 w-16 text-[#D2D2D7]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset loading state when the user id becomes available
    setIsLoading(true)
    getNotifications(user.id)
      .then((data) => {
        if (!cancelled) setNotifications(Array.isArray(data) ? data : (data?.notifications ?? []))
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load notifications right now.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const handleMarkRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try {
      await markNotificationRead(id)
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)))
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-12 pb-20 pt-6">
      <h1 className="mb-8 text-[32px] font-bold text-[#1D1D1F]">Notifications</h1>

      {error && (
        <div className="mb-6 rounded-lg bg-[#FF3B30]/10 px-4 py-3 text-sm text-[#FF3B30]">{error}</div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[#F5F5F7]" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D2D2D7] py-20 text-center">
          <BellEmptyIcon />
          <p className="mt-6 text-lg font-medium text-[#1D1D1F]">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-xl bg-white p-5 ${
                n.read
                  ? 'border-l-4 border-[#D2D2D7] opacity-70 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'border-l-4 border-[#0071E3] shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
              }`}
            >
              <div>
                <p className="text-[15px] text-[#1D1D1F]">{n.message}</p>
                <span className="mt-1 block text-xs text-[#6E6E73]">
                  {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                </span>
              </div>
              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="shrink-0 text-xs font-medium text-[#0071E3] hover:underline"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
