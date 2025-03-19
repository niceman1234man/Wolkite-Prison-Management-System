import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/userSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import prisonImage from "../../assets/prisonLogin.webp"; // Import the prison image

function Login() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [user, setUsers] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setUsers({ ...user, [e.target.name]: e.target.value });
    setError(""); // Clear errors on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.email || !user.password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true); // Start loading
    try {
      const response = await axiosInstance.post("/user/login", user);
      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        dispatch(setUser(response.data.userInfo));

        if (response.data.userInfo.isactivated) {
          switch (response.data.userInfo.role) {
            case "admin":
              navigate("/admin-dashboard");
              break;
            case "visitor":
              navigate("/visitor-dashboard");
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
            default:
              navigate("/login");
          }
        } else {
          navigate("/block");
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || "Login error, please try again.");
      toast.error("Login failed. Please check your credentials."); // Error notification
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="flex flex-col min-h-[40vh] bg-gradient-to-r from-green-50 to-teal-100">
      {/* Header with Prison Image */}
      {/* <header className="bg-gradient-to-r from-green-700 to-teal-600 text-white py-4 text-center shadow-lg relative">
        <div className="absolute inset-0 bg-black bg-opacity-50"></div> {/* Overlay for better text visibility */}
        {/* <div className="relative z-10">
          <h1 className="text-2xl font-bold">Wolkite Prison Management System</h1>
          <p className="text-sm mt-2">Secure and Efficient Prison Management</p>
        </div>
        <img
          src={prisonImage} // Prison image
          alt="Prison"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      </header> */} 

      {/* Main Content */}
      <main className="flex-grow items-center justify-center px-4 py-6">
         
          {/* Login Title */}
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Login</h1>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            {/* Email Input */}
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-500" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={user.email}
                onChange={handleChange}
                className="pl-10 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            {/* Password Input with Toggle */}
            <div className="relative">
              <FaLock className="absolute left-3 top-3 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"} // Toggle input type
                name="password"
                placeholder="Password"
                value={user.password}
                onChange={handleChange}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
              {/* Toggle Password Visibility Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />} {/* Toggle between eye and eye-slash icons */}
              </button>
            </div>

            {/* Login Button */}
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

            {/* Forgot Password & Register Links */}
            <div className="text-center mt-3 space-y-2">
              <button
                onClick={() => navigate("/forgot-password")}
                className="text-teal-600 hover:text-teal-700 hover:underline transition duration-300 text-sm"
              >
                Forgot Password?
              </button>
              <p className="text-gray-600 text-sm">or</p>
              <button
                onClick={() => navigate("/register")}
                className="text-teal-600 hover:text-teal-700 hover:underline font-semibold transition duration-300 text-sm"
              >
                New Visitor? Register Here
              </button>
            </div>
          </form>
         
      </main>
    </div>
  );
}

export default Login;