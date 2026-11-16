import {
  AUTH_LOGIN_REQUEST,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGIN_FAIL,
  AUTH_LOGOUT,
} from '../constants/authConstants'

export const authReducer = (state = { userInfo: null }, action) => {
  switch (action.type) {
    case AUTH_LOGIN_REQUEST:
      return { loading: true, userInfo: null }
    case AUTH_LOGIN_SUCCESS:
      return { loading: false, userInfo: action.payload }
    case AUTH_LOGIN_FAIL:
      return { loading: false, error: action.payload }
    case AUTH_LOGOUT:
      return { userInfo: null }
    default:
      return state
  }
}
