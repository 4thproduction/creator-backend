import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login } from '../actions/authActions'
import logo from '../assets/cultmkt_logo.png'
import hero from '../assets/hero-creator.jpg'

const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, userInfo } = useSelector((state) => state.auth)

  useEffect(() => {
    if (userInfo) navigate('/dashboard')
  }, [userInfo, navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(login(email, password))
  }

  return (
    <div className="min-h-screen portal-hero grid lg:grid-cols-2">
      <section className="flex flex-col justify-between px-6 py-6 sm:px-10 lg:px-16 lg:py-10">
        <div className="flex items-center gap-3">
          <img src={logo} alt="CULTMKT" className="h-11 w-11 rounded-xl shadow-sm" />
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">Creator Network</span>
        </div>
        <div className="mx-auto w-full max-w-md py-12 lg:py-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-3 py-1 text-xs font-medium text-stone-600"><span className="h-1.5 w-1.5 rounded-full bg-red-600" /> CULTMKT Creator Portal</span>
          <h1 className="mt-6 text-4xl leading-tight text-stone-800 sm:text-5xl">Welcome back to the <em className="not-italic text-amber-600">network.</em></h1>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">Sign in to manage your team, roles, and creator network access.</p>
          <div className="portal-card mt-8 p-6 sm:p-8">

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="portal-input text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="portal-input text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="portal-button w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
          </div>
        </div>
        <p className="text-xs text-stone-500">© {new Date().getFullYear()} CULTMKT Digital Agency · Built for creators, crafted for brands.</p>
      </section>
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={hero} alt="Creator photographing a brand campaign" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/10 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">CULTMKT Creator Network</span>
          <p className="mt-3 max-w-lg font-['Fraunces'] text-4xl leading-tight">A space for creators and brands to build something memorable.</p>
        </div>
      </aside>
    </div>
  )
}

export default LoginScreen
