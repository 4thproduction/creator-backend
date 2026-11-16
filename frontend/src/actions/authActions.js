import api, { notifySessionChange } from '../utils/api'
import { AUTH_LOGIN_REQUEST, AUTH_LOGIN_SUCCESS, AUTH_LOGIN_FAIL, AUTH_LOGOUT } from '../constants/authConstants'
export const login = (email, password) => async (dispatch) => {
  dispatch({ type: AUTH_LOGIN_REQUEST })
  try {
    const { data } = await api.post('/api/auth/login', { email, password })
    dispatch({ type: AUTH_LOGIN_SUCCESS, payload: data })
    notifySessionChange()
  } catch (error) {
    dispatch({ type: AUTH_LOGIN_FAIL, payload: error.response?.data?.message || 'Could not sign in' })
  }
}
export const logout = () => async (dispatch) => {
  await api.post('/api/auth/logout')
  dispatch({ type: AUTH_LOGOUT })
  notifySessionChange()
}
