import axios from "../utils/api";
import {
  ROLE_LIST_REQUEST,
  ROLE_LIST_SUCCESS,
  ROLE_LIST_FAIL,
  ROLE_CREATE_REQUEST,
  ROLE_CREATE_SUCCESS,
  ROLE_CREATE_FAIL,
  ROLE_UPDATE_REQUEST,
  ROLE_UPDATE_SUCCESS,
  ROLE_UPDATE_FAIL,
  ROLE_DELETE_REQUEST,
  ROLE_DELETE_SUCCESS,
  ROLE_DELETE_FAIL,
} from "../constants/roleConstants";


const getConfig = () => ({
  withCredentials: true,
});

export const listRoles = (page, limit) => async (dispatch) => {
  try {
    dispatch({ type: ROLE_LIST_REQUEST });
    const { data } = await axios.get(`/api/roles`, {
      ...getConfig(),
      ...(page !== undefined ? { params: { page, limit } } : {}),
    });
    dispatch({ type: ROLE_LIST_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: ROLE_LIST_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const createRole = (roleData) => async (dispatch) => {
  try {
    dispatch({ type: ROLE_CREATE_REQUEST });
    const { data } = await axios.post(
      `/api/roles`,
      roleData,
      getConfig(),
    );
    dispatch({ type: ROLE_CREATE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: ROLE_CREATE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const updateRole = (id, roleData) => async (dispatch) => {
  try {
    dispatch({ type: ROLE_UPDATE_REQUEST });
    const { data } = await axios.put(
      `/api/roles/${id}`,
      roleData,
      getConfig(),
    );
    dispatch({ type: ROLE_UPDATE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: ROLE_UPDATE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const deleteRole = (id) => async (dispatch) => {
  try {
    dispatch({ type: ROLE_DELETE_REQUEST });
    await axios.delete(`/api/roles/${id}`, getConfig());
    dispatch({ type: ROLE_DELETE_SUCCESS });
  } catch (error) {
    dispatch({
      type: ROLE_DELETE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
