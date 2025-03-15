import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { columns, UserButtons } from "../../utils/VisitorHelper.jsx";
import axiosInstance from "../../utils/axiosInstance.js";
import { useSelector } from "react-redux";
import AddModal from "../Modals/AddModal.jsx";
import RegisterVisitor from "./RegisterVisitor.jsx";

const List = () => {
  const [visitors, setVisitors] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,setOpen]=useState(false);
 
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/visitor/allVisitors");

        if (response.data && response.data.visitors) {
          let Uno = 1;
          const data = response.data.visitors.map((visitor, index) => ({
            U_no: Uno++,
            _id: visitor._id,
            firstName: visitor.firstName,
            middleName: visitor.middleName,
            lastName: visitor.lastName,
            inmate: visitor.inmate,
            relation: visitor.relation,
            purpose: visitor.purpose,
            phone: visitor.phone,
            date: new Date(visitor.date).toLocaleDateString(),
            action: <UserButtons _id={visitor._id} />, 
          }));

          setVisitors(data);
          setFilteredUsers(data);
        } else {
          console.error("Unexpected data format:", response.data.visitor);
          setVisitors([]);
        }
      } catch (error) {
        console.error("Error fetching Visitors:", error);
        alert(error.response?.data?.error || "Failed to load visitors.");
        setVisitors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleFilter = (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = visitors.filter(
      (visitor) =>
        visitor.firstName.toLowerCase().includes(query) ||
        visitor.middleName.toLowerCase().includes(query) ||
        visitor.lastName.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  return (
    <div className={`p-4 md:p-6 mt-12 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
      {/* Fixed Header Section */}
      <div className="sticky top-0 bg-white z-10 shadow-md p-4 w-full">
        <div className="text-center mb-4">
          <h3 className="text-xl md:text-2xl font-bold">Manage Visitors</h3>
        </div>

        {/* Search & Add Button (Fixed) */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
          <input
            type="text"
            onChange={handleFilter}
            placeholder="Search visitors..."
            className="px-3 py-2 border rounded-md w-full sm:w-64 text-sm"
          />
          <button
            onClick={()=>setOpen(true)}
            className="px-3 py-2 bg-teal-600 text-white rounded-md text-center w-full sm:w-auto text-sm"
          >
            Add New Visitor
          </button>
          <AddModal open={open} setOpen={setOpen}>
          <RegisterVisitor setOpen={setOpen} />
        </AddModal>
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="mt-6 bg-white p-4 rounded shadow-md ml-0 overflow-auto max-h-[calc(100vh-150px)]">
        <div className="min-w-full ml-0">
          <DataTable
            columns={columns}
            data={filteredUsers}
            pagination
            progressPending={loading}
            progressComponent={<p className="text-center">Loading...</p>}
            responsive
          />
        </div>
      </div>
    </div>
  );
};

export default List;
