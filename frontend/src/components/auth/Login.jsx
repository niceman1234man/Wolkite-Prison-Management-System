import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaLock, FaSpinner, FaEye, FaEyeSlash, FaInfoCircle } from "react-icons/fa";
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
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [user, setUsers] = useState({ email: "", password: "" });
  const didLogRef = useRef(false);

  // Get redirect URL from query parameter if it exists
  const getRedirectUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const redirect = searchParams.get('redirect');
    console.log("Redirect URL from query param:", redirect);
    return redirect || null;
  };

  // Debug login context - only log once
  useEffect(() => {
    if (!didLogRef.current) {
      console.log("Login component mounted with:");
      console.log("- isVisitor:", isVisitor);
      console.log("- Current path:", location.pathname);
      console.log("- Redirect URL:", getRedirectUrl());
      console.log("- Has onClose handler:", !!onClose);
      didLogRef.current = true;
    }
  }, []);

  const handleChange = (e) => {
    setUsers({ ...user, [e.target.name]: e.target.value });
    setError("");
  };

  // Function to display toast with consistent configuration
  const showToast = (message, type = "info") => {
    const toastOptions = {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    };

    switch (type) {
      case "success":
        toast.success(message, toastOptions);
        break;
      case "error":
        toast.error(message, toastOptions);
        break;
      case "info":
        toast.info(message, toastOptions);
        break;
      default:
        toast(message, toastOptions);
    }
  };

  // Function to help with debugging
  const fetchDebugInfo = async () => {
    try {
      setIsLoading(true);
      
      // Only do this in development
      if (process.env.NODE_ENV !== 'production') {
        // Get sample of visitors
        const visitorResponse = await axiosInstance.get("/auth/sample-users");
        
        // Get sample of staff users
        const staffResponse = await axiosInstance.get("/user/sample-users");
        
        setDebugInfo({
          visitors: visitorResponse.data?.users || [],
          staff: staffResponse.data?.users || []
        });
        
        setShowDebugInfo(true);
      }
    } catch (error) {
      console.error("Error fetching debug info:", error);
      showToast("Could not fetch debug information", "error");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to create a test visitor account
  const createTestVisitor = async () => {
    try {
      setIsLoading(true);
      
      // Only do this in development
      if (process.env.NODE_ENV !== 'production') {
        const testUser = {
          firstName: "Test",
          lastName: "Visitor",
          middleName: "User",
          email: `testvisitor_${Math.floor(Math.random() * 10000)}@example.com`,
          password: "password123",
          phone: "1234567890",
          role: "visitor"
        };
        
        console.log("Creating test visitor:", testUser);
        
        const response = await axiosInstance.post("/auth/register", testUser);
        
        if (response.data && response.data.success) {
          showToast(`Test visitor created: ${testUser.email}`, "success");
          
          // Auto-fill the login form with test credentials
          setUsers({
            email: testUser.email,
            password: testUser.password
          });
          
          console.log("Test visitor created successfully:", response.data);
        } else {
          showToast("Failed to create test visitor", "error");
        }
        
        // Refresh debug info
        fetchDebugInfo();
      }
    } catch (error) {
      console.error("Error creating test visitor:", error);
      showToast(error.response?.data?.message || "Could not create test visitor", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a test staff account
  const createTestStaff = async () => {
    try {
      setIsLoading(true);
      
      // Only do this in development
      if (process.env.NODE_ENV !== 'production') {
        const testUser = {
          firstName: "Test",
          lastName: "Staff",
          middleName: "User",
          email: `teststaff_${Math.floor(Math.random() * 10000)}@example.com`,
          password: "password123",
          gender: "Male",
          role: "police-officer", // Set a default role
          isactivated: true
        };
        
        console.log("Creating test staff:", testUser);
        
        const response = await axiosInstance.post("/user/create-account", testUser);
        
        if (response.data && !response.data.error) {
          showToast(`Test staff created: ${testUser.email}`, "success");
          
          // Auto-fill the login form with test credentials
          setUsers({
            email: testUser.email,
            password: testUser.password
          });
          
          console.log("Test staff created successfully:", response.data);
        } else {
          showToast(response.data?.message || "Failed to create test staff", "error");
        }
        
        // Refresh debug info
        fetchDebugInfo();
      }
    } catch (error) {
      console.error("Error creating test staff:", error);
      showToast(error.response?.data?.message || "Could not create test staff", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.email || !user.password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    
    try {
      // First try to log in as a staff member
      const staffEndpoint = "/user/login";
      const staffPayload = {
        email: user.email,
        password: user.password
      };
      
      console.log(`Trying staff login first with email: ${user.email}`);
      
      let successfulLogin = false;
      let response;
      
      try {
        // Try staff login first
        response = await axiosInstance.post(staffEndpoint, staffPayload);
        console.log("Staff login successful:", response.data);
        
        // If we get here, staff login was successful
        if (response.data && response.data.accessToken) {
          // Store token
          localStorage.setItem("token", response.data.accessToken);
          
          // Store user data
          const userData = response.data.userInfo;
          if (!userData) {
            throw new Error("User data missing from response");
          }
          
          console.log("Staff user info:", userData);
          dispatch(setUser(userData));
          localStorage.setItem("user", JSON.stringify(userData));
          
          // Check if user is activated
          if (userData.isactivated !== false) {
            showToast("Login successful", "success");
            
            // Check if there's a redirect URL
            const redirectUrl = getRedirectUrl();
            if (redirectUrl) {
              console.log(`Redirecting to: ${redirectUrl}`);
              navigate(redirectUrl);
              return;
            }
            
            // Navigate based on role
            const role = (userData.role || "").toLowerCase();
            console.log("User role:", role);
            
            switch (role) {
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
                console.error("Unknown role:", userData.role);
                setError("Unknown user role. Please contact an administrator.");
                navigate("/login");
                break;
            }
          } else {
            navigate("/block");
          }
          
          successfulLogin = true;
        }
      } catch (staffError) {
        console.log("Staff login failed, trying visitor login...");
        // Staff login failed, try visitor login
      }
      
      // If staff login failed, try visitor login
      if (!successfulLogin) {
        try {
          const visitorEndpoint = "/auth/login";
          const visitorPayload = {
            email: user.email,
            password: user.password
          };
          console.log("Trying visitor login with:", visitorPayload);
          
          response = await axiosInstance.post(visitorEndpoint, visitorPayload);
          console.log("Visitor login response:", response.data);
          
          if (response.data && response.data.token) {
            // Store token
            localStorage.setItem("token", response.data.token);
            
            // Store user data
            const userData = response.data.data;
            dispatch(setUser(userData));
            localStorage.setItem("user", JSON.stringify(userData));
            
            showToast("Login successful", "success");
            onClose && onClose();
            
            // Check if there's a redirect URL
            const redirectUrl = getRedirectUrl();
            if (redirectUrl) {
              console.log(`Redirecting visitor to: ${redirectUrl}`);
              navigate(redirectUrl);
            } else {
              navigate("/visitor-dashboard");
            }
            
            successfulLogin = true;
          }
        } catch (visitorError) {
          console.log("Visitor login also failed");
          // Both login attempts failed
          throw visitorError; // Re-throw the visitor error for display to user
        }
      }
      
      // If we get here and successfulLogin is still false, something went wrong
      if (!successfulLogin) {
        throw new Error("Login failed. Invalid credentials.");
      }
      
    } catch (error) {
      console.error(`Login error:`, error);
      
      // Check specific error conditions
      if (error.response) {
        console.log(`Login failed with status:`, error.response.status);
        console.log(`Login error data:`, error.response.data);
        
        // Detailed logging for 401 errors
        if (error.response.status === 401) {
          console.log("401 Unauthorized Error Details:");
          console.log("- Request URL:", error.config.url);
          console.log("- Request Method:", error.config.method);
          console.log("- Request Headers:", error.config.headers);
          console.log("- Response Headers:", error.response.headers);
          
          // Show specific response data structure
          console.log("- Error response structure:", Object.keys(error.response.data));
          
          setError("Invalid email or password. Please try again.");
        } else if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError("Login failed. Please check your credentials and try again.");
        }
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Login failed. Please try again.");
      }
      
      showToast(error.response?.data?.message || "Login failed. Please check your credentials.", "error");
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
        
        {/* DEBUG section - remove in production */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 text-center">
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  if (showDebugInfo) {
                    setShowDebugInfo(false);
                  } else {
                    fetchDebugInfo();
                  }
                }}
                className="text-xs text-gray-500 flex items-center justify-center"
              >
                <FaInfoCircle className="mr-1" />
                {showDebugInfo ? "Hide Debug Info" : "Debug Info"}
              </button>
              
              {isVisitor ? (
                <button
                  type="button"
                  onClick={createTestVisitor}
                  className="text-xs text-teal-600 flex items-center justify-center"
                  disabled={isLoading}
                >
                  <FaUser className="mr-1" />
                  Create Test Visitor
                </button>
              ) : (
                <button
                  type="button"
                  onClick={createTestStaff}
                  className="text-xs text-blue-600 flex items-center justify-center"
                  disabled={isLoading}
                >
                  <FaUser className="mr-1" />
                  Create Test Staff
                </button>
              )}
            </div>
            
            {showDebugInfo && debugInfo && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40">
                <div>
                  <strong>Test Accounts:</strong>
                  <div className="mt-1">
                    <p className="font-semibold">Visitors:</p>
                    <ul className="list-disc pl-4">
                      {debugInfo.visitors.length > 0 ? (
                        debugInfo.visitors.map((v, i) => (
                          <li 
                            key={`visitor-${i}`}
                            className="cursor-pointer hover:text-teal-600"
                            onClick={() => {
                              setUsers({
                                email: v.email,
                                password: "password123" // Default test password
                              });
                              showToast(`Filled in ${v.email} credentials - try logging in`, "info");
                            }}
                          >
                            {v.email} - {v.firstName} {v.lastName}
                          </li>
                        ))
                      ) : (
                        <li>No test visitors found</li>
                      )}
                    </ul>
                  </div>
                  <div className="mt-1">
                    <p className="font-semibold">Staff:</p>
                    <ul className="list-disc pl-4">
                      {debugInfo.staff.length > 0 ? (
                        debugInfo.staff.map((s, i) => (
                          <li 
                            key={`staff-${i}`}
                            className="cursor-pointer hover:text-blue-600"
                            onClick={() => {
                              setUsers({
                                email: s.email,
                                password: "password123" // Default test password
                              });
                              showToast(`Filled in ${s.email} credentials - try logging in`, "info");
                            }}
                          >
                            {s.email} - {s.role} - {s.isactivated ? "Active" : "Inactive"}
                          </li>
                        ))
                      ) : (
                        <li>No test staff found</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;
