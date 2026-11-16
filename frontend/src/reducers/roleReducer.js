import {
  ROLE_LIST_REQUEST, ROLE_LIST_SUCCESS, ROLE_LIST_FAIL,
  ROLE_CREATE_REQUEST, ROLE_CREATE_SUCCESS, ROLE_CREATE_FAIL, ROLE_CREATE_RESET,
  ROLE_UPDATE_REQUEST, ROLE_UPDATE_SUCCESS, ROLE_UPDATE_FAIL, ROLE_UPDATE_RESET,
  ROLE_DELETE_REQUEST, ROLE_DELETE_SUCCESS, ROLE_DELETE_FAIL, ROLE_DELETE_RESET,
} from '../constants/roleConstants'

export const roleListReducer = (state = { roles: [], total: 0 }, action) => {
  switch (action.type) {
    case ROLE_LIST_REQUEST:
      return { ...state, loading: true, error: undefined }
    case ROLE_LIST_SUCCESS:
      return Array.isArray(action.payload)
        ? { loading: false, roles: action.payload, total: action.payload.length }
        : { loading: false, ...action.payload }
    case ROLE_LIST_FAIL:
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}

export const roleCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case ROLE_CREATE_REQUEST:
      return { loading: true }
    case ROLE_CREATE_SUCCESS:
      return { loading: false, success: true, role: action.payload }
    case ROLE_CREATE_FAIL:
      return { loading: false, error: action.payload }
    case ROLE_CREATE_RESET:
      return {}
    default:
      return state
  }
}

export const roleUpdateReducer = (state = {}, action) => {
  switch (action.type) {
    case ROLE_UPDATE_REQUEST:
      return { loading: true }
    case ROLE_UPDATE_SUCCESS:
      return { loading: false, success: true, role: action.payload }
    case ROLE_UPDATE_FAIL:
      return { loading: false, error: action.payload }
    case ROLE_UPDATE_RESET:
      return {}
    default:
      return state
  }
}

export const roleDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case ROLE_DELETE_REQUEST:
      return { loading: true }
    case ROLE_DELETE_SUCCESS:
      return { loading: false, success: true }
    case ROLE_DELETE_FAIL:
      return { loading: false, error: action.payload }
    case ROLE_DELETE_RESET:
      return {}
    default:
      return state
  }
}
