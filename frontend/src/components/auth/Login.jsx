import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/userSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import prisonImage from "../../assets/prisonLogin.webp"; // Import the prison image

function Login({ onClose, isVisitor = false }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [user, setUsers] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setUsers({ ...user, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.email || !user.password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      // Use different endpoints based on user type
      const endpoint = isVisitor ? "/auth/login" : "/user/login";
      const response = await axiosInstance.post(endpoint, user);
      console.log("Login response:", response.data);

      if (response.data && (response.data.accessToken || response.data.token)) {
        // Handle both token formats
        const token = response.data.accessToken || response.data.token;
        localStorage.setItem("token", token);

        if (response.data.userInfo || response.data.data) {
          const userInfo = response.data.userInfo || response.data.data;
          dispatch(setUser(userInfo));
          localStorage.setItem("user", JSON.stringify(userInfo));
        }

        if (isVisitor) {
          onClose();
          window.location.href = "/visitor-dashboard";
        } else {
          if (response.data.userInfo.isactivated) {
            switch (response.data.userInfo.role) {
              case "admin":
                navigate("/admin-dashboard");
                break;
              case "police-officer":
                navigate("/policeOfficer-dashboard");
                break;
              case "inspector":
                navigate("/inspector-dashboard");
                break;
              case "security":
                navigate("/securityStaff-dashboard");
                break;
              case "court":
                navigate("/court-dashboard");
                break;
              case "woreda":
                navigate("/woreda-dashboard");
                break;
              default:
                navigate("/login");
            }
          } else {
            navigate("/block");
          }
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2> */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <FaUser className="absolute left-3 top-3 text-gray-500" />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={user.email}
            onChange={handleChange}
            className="pl-10 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
            required
          />
        </div>

        <div className="relative">
          <FaLock className="absolute left-3 top-3 text-gray-500" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={user.password}
            onChange={handleChange}
            className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <button
          type="submit"
          className={`py-2 bg-teal-600 text-white font-semibold rounded-lg w-full transition duration-300 ${
            user.email && user.password
              ? "hover:bg-teal-700 transform hover:scale-105"
              : "opacity-50 cursor-not-allowed"
          }`}
          disabled={!user.email || !user.password || isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <FaSpinner className="animate-spin mr-2" />
              Logging in...
            </div>
          ) : (
            "Login"
          )}
        </button>

        {!isVisitor && (
          <div className="text-center mt-3 space-y-2">
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-teal-600 hover:text-teal-700 hover:underline transition duration-300 text-sm"
            >
              Forgot Password?
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;
