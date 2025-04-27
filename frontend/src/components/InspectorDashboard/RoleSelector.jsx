import React, { useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { FaUserShield, FaUserPlus } from "react-icons/fa";

const RoleSelector = ({ 
  officers, 
  selectedOfficers, 
  onAddOfficer,
  onClose,
  maxMembers = 5
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter officers based on search term
  const filteredOfficers = officers.filter(officer => 
    (officer.firstName + " " + officer.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-teal-600 text-white rounded-t-lg">
          <h2 className="text-xl font-bold flex items-center">
            <FaUserPlus className="mr-2" />
            Select Police Officers for Committee
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-5">
          <div className="mb-4">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <div className="pl-4 pr-2">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full p-3 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="p-3 text-gray-400 hover:text-gray-600"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {selectedOfficers.length} of {maxMembers} members selected
              </p>
              {selectedOfficers.length === maxMembers && (
                <p className="text-sm text-green-600 font-medium">
                  Maximum members selected
                </p>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-teal-600 h-2 rounded-full" 
                style={{ width: `${(selectedOfficers.length / maxMembers) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prison
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOfficers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <FiSearch className="text-3xl mb-2 text-gray-300" />
                        <p>No police officers found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOfficers.map((officer) => (
                    <tr key={officer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaUserShield className="text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {officer.firstName} {officer.lastName}
                            </div>
                            <div className="text-sm text-gray-500">Police Officer</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{officer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{officer.phone || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{officer.prison?.prison_name || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => onAddOfficer(officer)}
                          disabled={
                            selectedOfficers.some(m => m._id === officer._id) || 
                            (selectedOfficers.length >= maxMembers)
                          }
                          className={`px-3 py-1.5 rounded-md ${
                            selectedOfficers.some(m => m._id === officer._id)
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : selectedOfficers.length >= maxMembers
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-teal-600 text-white hover:bg-teal-700"
                          }`}
                        >
                          {selectedOfficers.some(m => m._id === officer._id) ? (
                            "Added"
                          ) : (
                            <>
                              <FaUserPlus className="inline mr-1" /> Add to Committee
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="px-5 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector; 