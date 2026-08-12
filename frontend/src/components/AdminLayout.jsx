import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/users', label: 'Users' },
]

export default function AdminLayout() {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-white md:flex-row">
      <aside className="fixed left-0 top-12 z-40 hidden h-[calc(100vh-3rem)] w-60 shrink-0 overflow-y-auto bg-[#1D1D1F] text-white md:block">
        <div className="border-b border-white/10 px-6 py-6">
          <p className="text-base font-semibold">SmartRetailX</p>
          <p className="text-xs text-white/50">Admin</p>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#0071E3] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 px-3 py-4">
          <NavLink
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            &larr; Back to Store
          </NavLink>
        </div>
      </aside>

      <nav className="scrollbar-hide flex w-full gap-1 overflow-x-auto border-b border-[#E8E8ED] bg-[#1D1D1F] px-3 py-2 md:hidden">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                isActive ? 'bg-[#0071E3] text-white' : 'text-white/70'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <main className="min-h-[calc(100vh-3rem)] w-full flex-1 overflow-y-auto bg-[#F5F5F7] md:ml-60">
        <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
