import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";

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

// Create async thunk for logging out
export const logoutAndLog = createAsyncThunk(
  "user/logoutAndLog",
  async (_, { getState }) => {
    try {
      const user = getState().user.user;
      if (user && user._id) {
        // Call the logout endpoint to record activity
        await axiosInstance.post('/user/logout', { userId: user._id });
        console.log('Logout activity logged successfully');
      }
    } catch (error) {
      console.error('Error logging logout activity:', error);
    }
    
    // Clear localStorage regardless of API success
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    return null;
  }
);

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
  extraReducers: (builder) => {
    builder.addCase(logoutAndLog.fulfilled, (state) => {
      state.user = null;
    });
  },
});

export const { setUser, logout, updateUser } = userSlice.actions;
export default userSlice.reducer;
