import React from "react";
import { Link } from "react-router-dom"; 
import { useLanguage } from "../context/LanguageContext";
import { T } from "../components/common/TranslatedText";
import LanguageSelector from "../components/common/LanguageSelector";

function Visitor() {
  const { isAmharic } = useLanguage();

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-green-600 text-white flex justify-between items-center px-5 py-4 shadow-md">
        <h1 className="font-bold text-lg">
          <T>Prison Management System</T>
        </h1>
        <div className="flex space-x-6 items-center">
          <Link to='/' className="hover:underline">
            <T>Home</T>
          </Link>
          <LanguageSelector />
          <Link to="/register" className="hover:underline">
            <T>Register</T>
          </Link>
          <Link to="/login" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
            <T>Login</T>
          </Link>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl my-10 text-gray-950">
          <T>Welcome To Gurage Zone Prison Management System Visitor Page</T>
        </h1>
        <p className="text-3xl text-gray-900 mb-6">
          <T>Order is the foundation of justice; a well-managed prison is its pillar.</T>
        </p>
        <button className="bg-red-500 text-white py-2 px-4 rounded text-xl hover:bg-red-600">
          <Link to="/login">
            <T>Sign In</T>
          </Link>
        </button>
        <Link to="/register" className="bg-green-400 rounded px-4 py-2 mt-4 hover:bg-green-500">
          <T>Register</T>
        </Link>
      </main>

      <footer className="bg-gray-800 text-white text-center py-4">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} <T>Wolkite Prison Management. All rights reserved.</T>
        </p>
      </footer>
    </div>
  );
}

export default Visitor;