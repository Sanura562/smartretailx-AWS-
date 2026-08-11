import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { registerUser } from '../services/api'

function extractErrorMessage(err, fallback) {
  return err?.response?.data?.detail || err?.response?.data?.message || fallback
}

const inputClass =
  'h-12 w-full rounded-[10px] border-[1.5px] border-transparent bg-[#F5F5F7] px-4 text-sm text-[#1D1D1F] transition focus:border-[#0071E3] focus:bg-white focus:outline-none'
const labelClass = 'mb-1.5 block text-sm font-medium text-[#1D1D1F]'

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/'

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(loginForm.email, loginForm.password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid email or password.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await registerUser(registerForm.email, registerForm.password, registerForm.fullName)
      await login(registerForm.email, registerForm.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create your account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-48px)] items-center justify-center bg-[#F5F5F7] px-4 py-12">
      <div className="w-full max-w-[440px] rounded-[20px] bg-white p-12 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <h1 className="text-center text-2xl font-bold text-[#1D1D1F]">SmartRetailX</h1>
        <p className="mb-6 mt-1 text-center text-sm text-[#6E6E73]">
          {tab === 'login' ? 'Sign in to your account' : 'Create your account'}
        </p>

        <div className="mb-6 flex rounded-lg bg-[#F5F5F7] p-1">
          <button
            onClick={() => {
              setTab('login')
              setError('')
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === 'login' ? 'bg-white text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-[#6E6E73]'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setTab('register')
              setError('')
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === 'register' ? 'bg-white text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-[#6E6E73]'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-full bg-[#FF3B30]/10 px-4 py-2.5 text-center text-sm text-[#FF3B30]">
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[50px] w-full rounded-[10px] bg-[#0071E3] text-base font-semibold text-white transition hover:bg-[#0077ED] disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                required
                value={registerForm.fullName}
                onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type="password"
                required
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[50px] w-full rounded-[10px] bg-[#0071E3] text-base font-semibold text-white transition hover:bg-[#0077ED] disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[#6E6E73]">
          <Link to="/" className="text-[#0071E3] hover:underline">
            Continue browsing without an account
          </Link>
        </p>
      </div>
    </div>
  )
}
