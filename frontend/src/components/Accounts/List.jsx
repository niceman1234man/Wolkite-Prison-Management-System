import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { columns, UserButtons } from "../../utils/UserHelper.jsx";
import axiosInstance from "../../utils/axiosInstance.js";
import { useSelector } from "react-redux";
import AddModal from "../Modals/AddModal.jsx";
import AddUser from "./Add.jsx";
import { FaUserPlus, FaSearch, FaSync, FaFilter, FaDownload, FaUserShield, FaUser } from "react-icons/fa";
import { toast } from "react-toastify";

const List = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  const customStyles = {
    table: {
      style: {
        borderRadius: '8px',
        overflow: 'hidden'
      }
    },
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottomWidth: '1px',
        borderBottomColor: '#e2e8f0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#334155',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px'
      },
    },
    rows: {
      style: {
        fontSize: '14px',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        '&:not(:last-of-type)': {
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomColor: '#f1f5f9',
        },
        '&:hover': {
          backgroundColor: '#f1f5f9',
          transition: 'all 0.1s ease-in-out'
        }
      },
    },
    pagination: {
      style: {
        borderTopWidth: '1px',
        borderTopColor: '#e2e8f0',
        paddingTop: '16px',
        paddingBottom: '16px'
      },
      pageButtonsStyle: {
        borderRadius: '6px',
        border: 'none',
        padding: '6px 12px',
        backgroundColor: '#e2e8f0',
        marginLeft: '4px',
        marginRight: '4px',
        '&:hover:not(:disabled)': {
          backgroundColor: '#cbd5e1',
        },
        '&:focus': {
          outline: 'none',
          backgroundColor: '#0d9488',
          color: 'white'
        },
      },
    },
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshKey]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/user/getAlluser");

      if (response.data && response.data.user) {
        let Uno = 1;

        const data = response.data.user.map((user) => ({
          U_no: Uno++,
          _id: user._id,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          email: user.email,
          gender: user.gender,
          role: user.role,
          status: user.isactivated ? "Active" : "Inactive",
          action: <UserButtons _id={user._id} onUserUpdated={() => setRefreshKey(prev => prev + 1)} />,
        }));

        setUsers(data);
        setFilteredUsers(data);
      } else {
        console.error("Unexpected data format:", response.data.user);
        setUsers([]);
        toast.error("Failed to load user data");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.error || "Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    applyFilters(query, roleFilter, statusFilter);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    applyFilters(searchQuery, role, statusFilter);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    applyFilters(searchQuery, roleFilter, status);
  };

  const applyFilters = (query, role, status) => {
    let filtered = [...users];
    
    // Apply search query filter
    if (query) {
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(query) ||
          (user.middleName && user.middleName.toLowerCase().includes(query)) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }
    
    // Apply role filter
    if (role !== "all") {
      filtered = filtered.filter(user => user.role === role);
    }
    
    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter(user => user.status === status);
    }
    
    setFilteredUsers(filtered);
  };

  const exportCSV = () => {
    // Simple CSV export functionality
    const headers = ["Name", "Email", "Gender", "Role", "Status"];
    
    const csvData = filteredUsers.map(user => [
      `${user.firstName} ${user.middleName || ''} ${user.lastName}`,
      user.email,
      user.gender,
      user.role,
      user.status
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to get role display text
  const getRoleDisplay = (role) => {
    switch (role) {
      case 'security': return 'Security Staff';
      case 'police-officer': return 'Police Officer';
      case 'inspector': return 'Inspector';
      case 'court': return 'Court';
      case 'woreda': return 'Woreda';
      default: return role;
    }
  };

  return (
    <div
      className={`p-4 md:p-6 transition-all duration-300 mt-10 ${
        isCollapsed ? "ml-16" : "ml-64"
      }`}
    >
      {/* Dashboard Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaUserShield className="text-teal-600 mr-2" />
              User Management
            </h1>
            <p className="text-gray-500 mt-1">Manage system users and their access permissions</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center shadow-sm"
              onClick={() => setOpen(true)}
            >
              <FaUserPlus className="mr-2" />
              Add New User
            </button>
            <AddModal open={open} setOpen={setOpen}>
              <AddUser setOpen={setOpen} />
            </AddModal>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search by name, email..."
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
          
          {/* Role Filter */}
          <div className="flex-shrink-0">
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Roles</option>
              <option value="security">Security Staff</option>
              <option value="police-officer">Police Officer</option>
              <option value="inspector">Inspector</option>
              <option value="court">Court</option>
              <option value="woreda">Woreda</option>
            </select>
          </div>
          
          {/* Status Filter */}
          <div className="flex-shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button 
              onClick={() => setRefreshKey(prev => prev + 1)} 
              className="p-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="Refresh data"
            >
              <FaSync />
            </button>
            <button 
              onClick={exportCSV} 
              className="p-2.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
              title="Export to CSV"
            >
              <FaDownload />
            </button>
          </div>
        </div>
        
        {/* Filter tags */}
        {(roleFilter !== "all" || statusFilter !== "all" || searchQuery) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {searchQuery && (
              <div className="bg-blue-50 text-blue-700 text-sm py-1 px-3 rounded-full flex items-center">
                <FaSearch className="mr-1 text-xs" />
                Search: "{searchQuery}"
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    applyFilters("", roleFilter, statusFilter);
                  }} 
                  className="ml-1 text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </div>
            )}
            
            {roleFilter !== "all" && (
              <div className="bg-teal-50 text-teal-700 text-sm py-1 px-3 rounded-full flex items-center">
                <FaFilter className="mr-1 text-xs" />
                Role: {getRoleDisplay(roleFilter)}
                <button 
                  onClick={() => handleRoleFilter("all")} 
                  className="ml-1 text-teal-500 hover:text-teal-700"
                >
                  ×
                </button>
              </div>
            )}
            
            {statusFilter !== "all" && (
              <div className="bg-teal-50 text-teal-700 text-sm py-1 px-3 rounded-full flex items-center">
                <FaFilter className="mr-1 text-xs" />
                Status: {statusFilter}
                <button 
                  onClick={() => handleStatusFilter("all")} 
                  className="ml-1 text-teal-500 hover:text-teal-700"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Clear all filters */}
            <button 
              onClick={() => {
                setRoleFilter("all");
                setStatusFilter("all");
                setSearchQuery("");
                setFilteredUsers(users);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          {(roleFilter !== "all" || statusFilter !== "all" || searchQuery) && ' with applied filters'}
        </p>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <DataTable
          columns={columns}
          data={filteredUsers}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          progressPending={loading}
          progressComponent={
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center">
                <FaSync className="animate-spin text-teal-600 text-2xl mb-3" />
                <p className="text-gray-500">Loading user data...</p>
              </div>
            </div>
          }
          responsive
          customStyles={customStyles}
          noDataComponent={
            <div className="p-10 text-center text-gray-500">
              <FaUser className="text-gray-300 text-4xl mx-auto mb-3" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm mt-2">Try changing your search parameters</p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default List;
