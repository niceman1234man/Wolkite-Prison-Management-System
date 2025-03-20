import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function TransferRequestForm() {
  const [prisoners, setPrisoners] = useState([]);
  const [prisons, setPrisons] = useState([]);
  const [staff, setStaff] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [transferData, setTransferData] = useState({
    prisonerId: "",
    fromPrison: "",
    toPrison: "",
    escortStaffId: "",
    vehicleId: "",
    transferDate: new Date().toISOString().split("T")[0], // Default to today's date
    reason: "",
    status: "Pending", // Default status
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchPrisoners();
    fetchPrisons();
    fetchStaff();
    fetchVehicles();
  }, []);

  const fetchPrisoners = async () => {
    try {
      const response = await axiosInstance.get("/prisoner/getall-prisoners", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data?.prisoners?.length > 0) {
        setPrisoners(response.data.prisoners);
      }
    } catch (error) {
      console.error("Error fetching prisoners:", error);
      alert(error.response?.data?.error || "Failed to fetch prisoner data.");
    }
  };

  const fetchPrisons = async () => {
    try {
      const response = await axiosInstance.get("/prison/getall-prisons", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data?.prisons?.length > 0) {
        setPrisons(response.data.prisons);
      }
    } catch (error) {
      console.error("Error fetching prisons:", error);
      alert(error.response?.data?.error || "Failed to fetch prison data.");
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await axiosInstance.get("/staff/getall-staff", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data?.staff?.length > 0) {
        setStaff(response.data.staff);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      alert(error.response?.data?.error || "Failed to fetch staff data.");
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axiosInstance.get("/vehicle/getall-vehicles", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data?.vehicles?.length > 0) {
        setVehicles(response.data.vehicles);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      alert(error.response?.data?.error || "Failed to fetch vehicle data.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransferData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post("/transfer/new-transfer", transferData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data) {
        alert("Transfer request submitted successfully!");
        navigate("/woreda-dashboard/transfers");
      }
    } catch (error) {
      console.error("Error submitting transfer request:", error);
      alert("Failed to submit transfer request.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-xl font-bold mb-4">Transfer Request Form</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {/* Select Prisoner */}
        <div className="col-span-2">
          <label className="block mb-2">Select Prisoner</label>
          <select
            name="prisonerId"
            value={transferData.prisonerId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Prisoner</option>
            {prisoners.map((prisoner) => (
              <option key={prisoner._id} value={prisoner._id}>
                {prisoner.firstName} {prisoner.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* From Prison */}
        <div className="col-span-1">
          <label className="block mb-2">From Prison</label>
          <select
            name="fromPrison"
            value={transferData.fromPrison}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select From Prison</option>
            {prisons.map((prison) => (
              <option key={prison._id} value={prison.prison_name}>
                {prison.prison_name}
              </option>
            ))}
          </select>
        </div>

        {/* To Prison */}
        <div className="col-span-1">
          <label className="block mb-2">To Prison</label>
          <select
            name="toPrison"
            value={transferData.toPrison}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select To Prison</option>
            {prisons.map((prison) => (
              <option key={prison._id} value={prison.prison_name}>
                {prison.prison_name}
              </option>
            ))}
          </select>
        </div>

        {/* Escort Staff */}
        <div className="col-span-1">
          <label className="block mb-2">Escort Staff</label>
          <select
            name="escortStaffId"
            value={transferData.escortStaffId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Escort Staff</option>
            {staff.map((staffMember) => (
              <option key={staffMember._id} value={staffMember._id}>
                {staffMember.firstName} {staffMember.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle */}
        <div className="col-span-1">
          <label className="block mb-2">Vehicle</label>
          <select
            name="vehicleId"
            value={transferData.vehicleId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle._id} value={vehicle._id}>
                {vehicle.vehicleType} - {vehicle.licensePlate}
              </option>
            ))}
          </select>
        </div>

        {/* Transfer Date */}
        <div className="col-span-1">
          <label className="block mb-2">Transfer Date</label>
          <input
            type="date"
            name="transferDate"
            value={transferData.transferDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Reason for Transfer */}
        <div className="col-span-2">
          <label className="block mb-2">Reason for Transfer</label>
          <textarea
            name="reason"
            value={transferData.reason}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="col-span-2">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            Submit Transfer Request
          </button>
        </div>
      </form>
    </div>
  );
}