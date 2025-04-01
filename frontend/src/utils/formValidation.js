// User form validation
export const validateUserForm = (userData) => {
    const errors = {};
  
    // First Name validation
    if (!userData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (userData.firstName.length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }
  
    // Last Name validation
    if (!userData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (userData.lastName.length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }
  
    // Email validation
    if (!userData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = "Email address is invalid";
    }
  
    // Gender validation
    if (!userData.gender) {
      errors.gender = "Please select a gender";
    }
  
    // Role validation
    if (!userData.role) {
      errors.role = "Please select a role";
    }
  
    // Password validation
    if (!userData.password) {
      errors.password = "Password is required";
    } else if (userData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(userData.password)) {
      errors.password = "Password must contain uppercase, lowercase, and number";
    }
  
    return errors;
  };
  
  // Inmate form validation
  export const validateInmateForm = (inmateData) => {
    const errors = {};
    
    // Example validation for inmates
    if (!inmateData.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    
    if (!inmateData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    
    if (!inmateData.birthDate) {
      errors.birthDate = "Birth date is required";
    }
    
    return errors;
  };
  
  // Parole request validation
  export const validateParoleRequest = (paroleData) => {
    const errors = {};
    
    if (!paroleData.reason || paroleData.reason.trim().length < 10) {
      errors.reason = "Reason must be at least 10 characters";
    }
    
    if (!paroleData.date) {
      errors.date = "Date is required";
    }
    
    return errors;
  };
  
  // Login validation
  export const validateLogin = (loginData) => {
    const errors = {};
    
    if (!loginData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      errors.email = "Email address is invalid";
    }
    
    if (!loginData.password) {
      errors.password = "Password is required";
    }
    
    return errors;
  };