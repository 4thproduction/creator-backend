import axios from "../utils/api";
import {
  USER_LIST_REQUEST,
  USER_LIST_SUCCESS,
  USER_LIST_FAIL,
  USER_CREATE_REQUEST,
  USER_CREATE_SUCCESS,
  USER_CREATE_FAIL,
  USER_UPDATE_REQUEST,
  USER_UPDATE_SUCCESS,
  USER_UPDATE_FAIL,
  USER_DELETE_REQUEST,
  USER_DELETE_SUCCESS,
  USER_DELETE_FAIL,
} from "../constants/userConstants";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getConfig = () => ({
  withCredentials: true,
});

export const listUsers =
  (page = 1, limit = 10) =>
  async (dispatch) => {
    try {
      dispatch({ type: USER_LIST_REQUEST });
      const { data } = await axios.get(`${API_URL}/api/users`, {
        ...getConfig(),
        params: { page, limit },
      });
      dispatch({ type: USER_LIST_SUCCESS, payload: data });
    } catch (error) {
      dispatch({
        type: USER_LIST_FAIL,
        payload: error.response?.data?.message || error.message,
      });
    }
  };

export const createUser = (userData) => async (dispatch) => {
  try {
    dispatch({ type: USER_CREATE_REQUEST });
    const { data } = await axios.post(
      `${API_URL}/api/users`,
      userData,
      getConfig(),
    );
    dispatch({ type: USER_CREATE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: USER_CREATE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const updateUser = (id, userData) => async (dispatch) => {
  try {
    dispatch({ type: USER_UPDATE_REQUEST });
    const { data } = await axios.put(
      `${API_URL}/api/users/${id}`,
      userData,
      getConfig(),
    );
    dispatch({ type: USER_UPDATE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: USER_UPDATE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const deleteUser = (id) => async (dispatch) => {
  try {
    dispatch({ type: USER_DELETE_REQUEST });
    await axios.delete(`${API_URL}/api/users/${id}`, getConfig());
    dispatch({ type: USER_DELETE_SUCCESS });
  } catch (error) {
    dispatch({
      type: USER_DELETE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
