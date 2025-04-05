import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import SimpleFaceCapture from '../SimpleFaceCapture';
import { LockClosedIcon, MailIcon, EyeIcon, EyeOffIcon } from '@heroicons/react/solid';
import { compareFaceDescriptors } from '../../utils/faceRecognition';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useFaceId, setUseFaceId] = useState(false);
  const [faceIdError, setFaceIdError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to log in: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async (faceData) => {
    if (!faceData || !faceData.descriptor) {
      toast.error('No face detected. Please try again.');
      return;
    }
    
    // Check liveness detection result
    if (!faceData.isLive) {
      toast.error('Liveness check failed. Please ensure you are a real person, not a photo.');
      return;
    }
    
    setLoading(true);
    
    try {
      // First, get the user based on email (if provided)
      let userId = null;
      if (email) {
        // If email is provided, try to get user record
        const response = await fetch('/api/users/find-by-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        if (data.success && data.user) {
          userId = data.user.id;
        } else {
          toast.error('User not found with this email. Please enter your email first.');
          setLoading(false);
          return;
        }
      }
      
      // Perform face login with the descriptor
      const faceLoginResponse = await fetch('/api/auth/face-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceDescriptor: Array.from(faceData.descriptor),
          userId, // Include userId if we have it from email lookup
          livenessScore: faceData.livenessScore
        })
      });
      
      const faceLoginResult = await faceLoginResponse.json();
      
      if (faceLoginResult.success) {
        toast.success('Face authentication successful!');
        navigate('/dashboard');
      } else {
        toast.error(faceLoginResult.message || 'Face authentication failed');
        setFaceIdError('Face not recognized. Please try again or use password login.');
      }
    } catch (error) {
      console.error('Face login error:', error);
      toast.error('Failed to authenticate face: ' + (error.message || 'Unknown error'));
      setFaceIdError('Error during face authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLoginError = (error) => {
    console.error('Face login error:', error);
    setFaceIdError(error);
    toast.error('Face authentication error: ' + error);
  };

  const toggleFaceId = () => {
    setUseFaceId(!useFaceId);
    setFaceIdError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {useFaceId ? (
          <div className="mt-8">
            <SimpleFaceCapture
              onFaceDetected={handleFaceLogin}
              onError={handleFaceLoginError}
            />
            {faceIdError && (
              <p className="mt-2 text-sm text-red-600">{faceIdError}</p>
            )}
            <button
              type="button"
              onClick={toggleFaceId}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Use Password Instead
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MailIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <svg className="animate-spin h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Processing...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
              
              <button
                type="button"
                onClick={toggleFaceId}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Sign in with Face ID
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login; 