import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";
import { useSelector } from "react-redux";
import { validateUserForm } from "../../utils/formValidation";

const EditUser = ({setOpen, id}) => {
  // const { id } = useParams();
  const navigate = useNavigate();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  const [photo, setPhoto] = useState(null);
  const [prisons, setPrisons] = useState([]);
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    gender: "",
    role: "",
    photo: "",
    prison: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);



  const fetchPrisons = async () => {
    
      try {
        const response = await axiosInstance.get("/prison/getall-prisons");
        console.log(response.data.prisons)
        if (response.data?.success) {
          setPrisons(response.data.prisons);
         
        }
      } catch (error) {
        console.error("Error fetching prisons:", error);
        toast.error("Failed to fetch prison data");
      } 
    };
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/user/get-user/${id}`);
        if (response.data) {
          setUser(response.data.user);
        } else {
          toast.error("Failed to fetch user details");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error(error.response?.data?.message || "Error fetching user details");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    fetchPrisons();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateUserForm(user);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError);
      return;
    }

    const formData = new FormData();
    formData.append("firstName", user.firstName);
    formData.append("middleName", user.middleName);
    formData.append("lastName", user.lastName);
    formData.append("email", user.email);
    formData.append("role", user.role);
    formData.append("gender", user.gender);
    formData.append("prison", user.prison);
    if (photo) formData.append("photo", photo);

    setSubmitting(true);
    try {
      const response = await axiosInstance.put(`/user/update-user/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data) {
        toast.success("User updated successfully!");
        setOpen(false)
        setTimeout(() => navigate("/admin-dashboard/users"), 1500);
      } else {
        toast.error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || "Error updating user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`w-full mx-auto  bg-white p-8 rounded-md shadow-md transition-all }`}>
      <div className="flex items-center mb-6">
        {/* <button
          className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="mr-2 text-lg" /> Back
        </button> */}
        <h2 className="text-2xl font-bold ml-4">Edit User</h2>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                value={user.firstName}
                onChange={handleChange}
                className={`mt-1 p-2 block w-full border ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                required
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={user.middleName}
                onChange={handleChange}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={user.lastName}
                onChange={handleChange}
                className={`mt-1 p-2 block w-full border ${
                  errors.lastName ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                required
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                className={`mt-1 p-2 block w-full border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={user.gender}
                onChange={handleChange}
                className={`mt-1 p-2 block w-full border ${
                  errors.gender ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Select Role</label>
              <select
                name="role"
                value={user.role}
                onChange={handleChange}
                className={`mt-1 p-2 block w-full border ${
                  errors.role ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                required
              >
                <option value="">Select Role</option>
                <option value="security">Security Staff</option>
                <option value="police-officer">Police Officer</option>
                <option value="inspector">Inspector</option>
                <option value="court">Court</option>
                <option value="woreda">Woreda</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-xs mt-1">{errors.role}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Select Prison</label>
              <select
                name="prison"
                value={user.prison}
                onChange={handleChange}
                className={`mt-1 p-2 block w-full border ${
                  errors.prison ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                required
              >
                <option value="">Select Prison</option>
                {prisons.map((prison) => (
                  <option key={prison._id} value={prison._id}>
                    {prison.prison_name}
                  </option>
                ))}
              </select>
              {errors.prison && (
                <p className="text-red-500 text-xs mt-1">{errors.prison}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
              />
              {user.photo && !photo && (
                <img src={user.photo} alt="Profile Preview" className="w-24 h-24 object-cover mt-2 rounded-full" />
              )}
              {photo && (
                <img src={URL.createObjectURL(photo)} alt="New Profile Preview" className="w-24 h-24 object-cover mt-2 rounded-full" />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white font-bold py-3 px-5 rounded-lg shadow-lg transform active:translate-y-1 transition-all duration-300"
            disabled={submitting}
          >
            {submitting ? "Updating..." : "Edit User"}
          </button>
        </form>
      )}
    </div>
  );
};

export default EditUser;
