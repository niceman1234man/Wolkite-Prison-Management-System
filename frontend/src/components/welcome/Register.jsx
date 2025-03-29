import React from 'react';

function Register({ formData, handleChange, handleSubmit, setShowLoginModal }) {
  return (
    <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="max-w-4xl w-full mx-6 p-8 rounded-2xl bg-white/10 backdrop-blur-sm">
        <h2 className="text-4xl font-bold mb-8 text-white text-center">Create Visitor Account</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              required
            />
            <label htmlFor="terms" className="text-gray-700 text-sm">
              I agree to the terms and conditions
            </label>
          </div>
          <button
            type="submit"
            className={`w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg transition-colors duration-300 ${
              formData.firstName &&
              formData.lastName &&
              formData.email &&
              formData.password &&
              formData.confirmPassword &&
              formData.phone
                ? ""
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={
              !formData.firstName ||
              !formData.lastName ||
              !formData.email ||
              !formData.password ||
              !formData.confirmPassword ||
              !formData.phone
            }
          >
            Create Account
          </button>
          <p className="mt-4 text-center text-gray-600">
            Already have an account?{" "}
            <button
              onClick={setShowLoginModal}
              className="text-teal-600 hover:text-teal-700 font-semibold"
            >
              Login here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register; 