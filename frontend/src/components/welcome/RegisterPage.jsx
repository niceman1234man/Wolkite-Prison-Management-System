import React, { useState } from "react";
import Register from "./Register"; // Adjust this path

function RegisterPage() {
  // ✅ State to store form data
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
console.log(formData)
  // ✅ Updates formData state when user types
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // ✅ Handles form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents page reload

    console.log("Form Data Submitted:", formData);

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    alert("Account created successfully!");
  };

  return (
    <Register
      formData={formData}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      setShowLoginModal={() => alert("Redirect to Login")}
    />
  );
}

export default RegisterPage;
