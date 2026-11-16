import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import api, { notifySessionChange, sessionGeneration } from '../utils/api'
import { logout } from '../actions/authActions'
import { AUTH_LOGIN_SUCCESS, AUTH_LOGOUT } from '../constants/authConstants'

export default function SessionManager({ children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userInfo } = useSelector((state) => state.auth)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [clock, setClock] = useState(Date.now())
  const sequence = useRef(0)
  const pending = useRef(false)
  const mutation = useRef(false)
  const latestSession = useRef(null)
  const session = userInfo?.session
  latestSession.current = session
  const now = session ? session.serverNow + clock - session.receivedAt : clock
  const deadline = session ? Math.min(session.expiresAt, session.deadline) : 0
  const open = Boolean(session && now >= session.confirmAt)
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000))

  const sync = useCallback(async () => {
    if (pending.current || mutation.current) return
    pending.current = true
    const id = ++sequence.current
    const generation = sessionGeneration()
    try {
      const { data } = await api.get('/api/auth/session', { timeout: 3000 })
      if (id === sequence.current && generation === sessionGeneration()) {
        dispatch({ type: AUTH_LOGIN_SUCCESS, payload: data })
        setClock(Date.now())
      }
    } catch (requestError) {
      if (id !== sequence.current || generation !== sessionGeneration()) return
      if (requestError.response?.status === 401) {
        dispatch({ type: AUTH_LOGOUT })
        navigate('/', { replace: true })
      } else {
        const current = latestSession.current
        if (!current || current.serverNow + Date.now() - current.receivedAt >= Math.min(current.expiresAt, current.deadline)) {
          dispatch({ type: AUTH_LOGOUT })
          navigate('/', { replace: true })
        }
      }
    } finally { pending.current = false }
  }, [dispatch, navigate])

  useEffect(() => {
    sync()
    const expire = () => {
      ++sequence.current
      dispatch({ type: AUTH_LOGOUT })
      navigate('/', { replace: true })
      setError('')
    }
    const storage = (event) => { if (event.key === 'portal-session-event') sync() }
    const visible = () => { if (document.visibilityState === 'visible') sync() }
    window.addEventListener('portal-session-expired', expire)
    window.addEventListener('storage', storage)
    window.addEventListener('focus', visible)
    document.addEventListener('visibilitychange', visible)
    return () => {
      window.removeEventListener('portal-session-expired', expire)
      window.removeEventListener('storage', storage)
      window.removeEventListener('focus', visible)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [dispatch, navigate, sync])

  useEffect(() => {
    if (!userInfo) return
    const tick = setInterval(() => setClock(Date.now()), 250)
    const poll = setInterval(sync, 15000)
    return () => { clearInterval(tick); clearInterval(poll) }
  }, [Boolean(userInfo), sync])

  useEffect(() => {
    if (!session || now < deadline) return
    // Recheck first: another tab may already have continued this session.
    sync()
  }, [session, now >= deadline, sync, busy])

  const continueSession = async () => {
    mutation.current = true
    setBusy(true)
    setError('')
    ++sequence.current
    try {
      const { data } = await api.post('/api/auth/session/continue')
      dispatch({ type: AUTH_LOGIN_SUCCESS, payload: data })
      setClock(Date.now())
      notifySessionChange()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not continue. Please try again before the timer ends.')
    } finally { mutation.current = false; setBusy(false) }
  }
  const signOut = async () => {
    mutation.current = true
    setBusy(true)
    ++sequence.current
    try { await dispatch(logout()); setError(''); navigate('/', { replace: true }) }
    catch { setError('Could not sign out. Please retry.'); }
    finally { mutation.current = false; setBusy(false) }
  }

  // Recheck an elapsed deadline without showing an intermediate status page.
  // Protected content stays hidden until the bounded check restores or clears it.
  if (session && now >= deadline) return null
  return <>
    {children}
    <Dialog open={open} disableEscapeKeyDown aria-labelledby="session-title" aria-describedby="session-description" fullWidth maxWidth="xs">
      <DialogTitle id="session-title" className="!pr-20">Continue your session?</DialogTitle>
      <span role="timer" aria-label={`${seconds} seconds remaining`} className="absolute right-4 top-4 rounded-lg bg-amber-50 px-2 py-1 font-mono text-lg font-semibold text-amber-800">{seconds}s</span>
      <DialogContent>
        <p id="session-description" className="text-sm text-stone-600">Select Continue to stay signed in. You will be signed out automatically if you do not respond within 30 seconds. Your session still expires 24 hours after login.</p>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </DialogContent>
      <DialogActions className="!px-6 !pb-5">
        <button className="portal-outline-button" disabled={busy} onClick={signOut}>Sign out</button>
        <button className="portal-button" disabled={busy || seconds === 0} onClick={continueSession}>Continue</button>
      </DialogActions>
    </Dialog>
  </>
}
