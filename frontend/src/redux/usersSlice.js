import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers(state, action) {
      state.users = action.payload;
    },
    setCurrentUser(state, action) {
      state.currentUser = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    clearUserData(state) {
      state.currentUser = null;
      state.error = null;
    },
  },
});

export const { setUsers, setCurrentUser, setLoading, setError, clearUserData } =
  usersSlice.actions;
export default usersSlice.reducer;
