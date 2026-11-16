import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { authReducer } from "./reducers/authReducer";
import {
  userListReducer,
  userCreateReducer,
  userUpdateReducer,
  userDeleteReducer,
} from "./reducers/userReducer";
import {
  roleListReducer,
  roleCreateReducer,
  roleUpdateReducer,
  roleDeleteReducer,
} from "./reducers/roleReducer";

localStorage.removeItem("userInfo");
const preloadedState = { auth: { userInfo: null } };

const rootReducer = combineReducers({
  auth: authReducer,
  userList: userListReducer,
  userCreate: userCreateReducer,
  userUpdate: userUpdateReducer,
  userDelete: userDeleteReducer,
  roleList: roleListReducer,
  roleCreate: roleCreateReducer,
  roleUpdate: roleUpdateReducer,
  roleDelete: roleDeleteReducer,
});

const store = createStore(rootReducer, preloadedState, applyMiddleware(thunk));

export default store;
