import { createSlice } from "@reduxjs/toolkit";

// Get initial user data from localStorage
const getUserFromLocalStorage = () => {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    return null;
  }
};

const initialState = {
  user: getUserFromLocalStorage(),
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    logout(state) {
      state.user = null;
      // Clear localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
});

export const { setUser, logout, updateUser } = userSlice.actions;
export default userSlice.reducer;
