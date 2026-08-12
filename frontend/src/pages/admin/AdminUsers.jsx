import { useEffect, useState } from 'react'
import { getAllUsers } from '../../services/api'

function RoleBadge({ role }) {
  const isAdmin = role === 'admin'
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${
        isAdmin ? 'bg-[#0071E3]/10 text-[#0071E3]' : 'bg-[#F5F5F7] text-[#6E6E73]'
      }`}
    >
      {isAdmin ? 'Admin' : 'Customer'}
    </span>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAllUsers()
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : (data?.users ?? [])
        setUsers(list)
        setAvailable(true)
      })
      .catch(() => {
        if (!cancelled) setAvailable(false)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <h1 className="text-[28px] font-bold text-[#1D1D1F]">Users Management</h1>
      <p className="mb-8 mt-1 text-sm text-[#6E6E73]">Read-only view of registered users</p>

      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-[#F5F5F7]" />
            ))}
          </div>
        ) : !available ? (
          <p className="py-12 text-center text-sm text-[#6E6E73]">
            User listing endpoint not available - users are managed via the API.
          </p>
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#6E6E73]">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8E8ED] text-[#6E6E73]">
                  <th className="py-3 pr-4 font-medium">ID</th>
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Role</th>
                  <th className="py-3 pr-4 font-medium">Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F7]'}>
                    <td className="py-3 pr-4 text-[#6E6E73]">{user.id}</td>
                    <td className="py-3 pr-4 font-medium text-[#1D1D1F]">{user.full_name ?? user.fullName ?? '—'}</td>
                    <td className="py-3 pr-4 text-[#1D1D1F]">{user.email}</td>
                    <td className="py-3 pr-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="py-3 pr-4 text-[#6E6E73]">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
