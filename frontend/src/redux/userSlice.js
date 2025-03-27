import { createSlice } from "@reduxjs/toolkit";

// Load user data from localStorage if it exists
const loadUserFromStorage = () => {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : {};
  } catch (error) {
    console.error("Error loading user from localStorage:", error);
    return {};
  }
};

const initialState = {
  user: loadUserFromStorage(),
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload)); // Persist user data
    },
    logout(state) {
      state.user = {};
      localStorage.clear(); // Clear everything on logout
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
