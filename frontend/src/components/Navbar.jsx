import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function CartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.994-4.694 2.602-7.163.084-.34-.17-.67-.52-.67H5.106M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  )
}

export default function Navbar() {
  const { isAuthenticated, user, isAdmin, logout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = search.trim()
    navigate(trimmed ? `/?search=${encodeURIComponent(trimmed)}` : '/')
    setMobileOpen(false)
  }

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  const firstName = (user?.full_name ?? user?.email ?? 'Account').split(' ')[0]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-12 border-b border-[#E8E8ED] bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : ''
      }`}
    >
      <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-between gap-4 px-6">
        <Link to="/" className="shrink-0 text-lg font-semibold text-[#1D1D1F]">
          SmartRetailX
        </Link>

        <form onSubmit={handleSearch} className="mx-4 hidden flex-1 max-w-[280px] md:flex">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-8 w-[280px] rounded-lg border-0 bg-[#F5F5F7] px-3 text-sm text-[#1D1D1F] placeholder:text-[#6E6E73] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
          />
        </form>

        <div className="hidden items-center gap-5 md:flex">
          <Link to="/notifications" className="text-[#1D1D1F] transition hover:text-[#0071E3]" aria-label="Notifications">
            <BellIcon />
          </Link>
          <Link to="/cart" className="relative text-[#1D1D1F] transition hover:text-[#0071E3]" aria-label="Cart">
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0071E3] px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-1 rounded-full bg-[#F5F5F7] px-3 py-1 text-sm font-medium text-[#1D1D1F] transition hover:bg-[#E8E8ED]"
              >
                {firstName}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-[#E8E8ED] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                  <Link
                    to="/orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7]"
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7]"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-[#1D1D1F] hover:bg-[#F5F5F7]"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-[#0071E3] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#0077ED]"
            >
              Login
            </Link>
          )}
        </div>

        <button
          className="text-[#1D1D1F] md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <MenuIcon />
        </button>
      </div>

      {mobileOpen && (
        <div className="space-y-3 border-t border-[#E8E8ED] bg-white px-6 py-4 md:hidden">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-8 w-full rounded-lg border-0 bg-[#F5F5F7] px-3 text-sm text-[#1D1D1F] placeholder:text-[#6E6E73] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
            />
          </form>
          <div className="flex items-center gap-5">
            <Link to="/notifications" onClick={() => setMobileOpen(false)} className="text-[#1D1D1F]">
              <BellIcon />
            </Link>
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="relative text-[#1D1D1F]">
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0071E3] px-1 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
          {isAuthenticated ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#1D1D1F]">{user?.full_name ?? user?.email}</p>
              <Link to="/orders" onClick={() => setMobileOpen(false)} className="block text-sm text-[#6E6E73]">
                My Orders
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="block text-sm text-[#6E6E73]">
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout()
                  setMobileOpen(false)
                }}
                className="block text-sm text-[#6E6E73]"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="block rounded-full bg-[#0071E3] px-4 py-2 text-center text-sm font-medium text-white"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
