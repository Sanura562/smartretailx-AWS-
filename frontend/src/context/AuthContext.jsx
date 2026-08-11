import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginUser } from '../services/api'

const AuthContext = createContext(null)

// Decodes the payload of a JWT without verifying the signature.
// Verification happens server-side; this is only used to restore
// a lightweight client-side session from a previously stored token.
function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('smrx_token')
    if (storedToken) {
      const decoded = decodeToken(storedToken)
      if (decoded) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time session restore on mount
        setToken(storedToken)
        setUser({
          id: decoded.id ?? decoded.user_id ?? decoded.sub,
          email: decoded.email,
          full_name: decoded.full_name ?? decoded.fullName,
          role: decoded.role,
        })
      } else {
        localStorage.removeItem('smrx_token')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const { access_token, user: loggedInUser } = await loginUser(email, password)
    localStorage.setItem('smrx_token', access_token)
    setToken(access_token)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('smrx_token')
    setToken(null)
    setUser(null)
  }, [])

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'admin',
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook pattern
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
