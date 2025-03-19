import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { columns, UserButtons } from "../../../utils/InstructionHelper";
import axiosInstance from "../../../utils/axiosInstance";
import CourtInstructions from "./CourtInstructions";
import AddModal from "@/components/Modals/AddModal";

const InstructionList = () => {
  const [instructions, setInstructions] = useState([]);
  const [filteredInstructions, setFilteredInstructions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [add, setAdd] = useState(false);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/instruction/allInstruction");
        if (response.data && response.data.instructions) {
          let Uno = 1;
          const data = response.data.instructions.map((instuct) => ({
            U_no: Uno++,
            _id: instuct._id,
            courtCaseNumber: instuct.courtCaseNumber,
            prisonName: instuct.prisonName,
            judgeName: instuct.judgeName,
            verdict: instuct.verdict,
            instructions: instuct.instructions,
            hearingDate: instuct.hearingDate,
            effectiveDate: instuct.effectiveDate,
            sendDate: instuct.sendDate,
            action: <UserButtons _id={instuct._id} />,
          }));

          setInstructions(data);
          setFilteredInstructions(data);
        } else {
          console.error("Unexpected data format:", response.data.instructions);
          setInstructions([]);
        }
      } catch (error) {
        console.error("Error fetching instructions:", error);
        alert(error.response?.data?.error || "Failed to load instructions.");
        setInstructions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, []);

  const handleFilter = (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = instructions.filter(
      (instruct) =>
        instruct.courtCaseNumber.toLowerCase().includes(query) ||
        instruct.prisonName.toLowerCase().includes(query)
    );
    setFilteredInstructions(filtered);
  };

  return (
    <div className="flex-1 relative min-h-screen">
      {/* Sticky Header */}
      <div
        className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-wrap items-center justify-between transition-all duration-300 ml-2 gap-2 ${
          isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
        }`}
      >
        {/* Back Button */}
        <button
          className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
          onClick={() => window.history.back()}
        >
          <FaArrowLeft className="mr-2 text-lg" /> Back
        </button>

        <div className="flex-1" />

        {/* Search Input */}
        <div className="relative flex items-center w-60 md:w-1/3">
          <FaSearch className="absolute left-3 text-gray-500" />
          <input
            type="text"
            placeholder="Search by court case number or prison name"
            className="h-10 px-4 py-2 border border-gray-300 rounded-md w-full pl-10"
            onChange={handleFilter}
          />
        </div>

        {/* Add Button */}
        <button
          onClick={() => setAdd(true)}
          className="h-10 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center justify-center min-w-[150px] md:w-auto"
        >
           Add New Instruction
        </button>

        <AddModal open={add} setOpen={setAdd}>
          <CourtInstructions setOpen={setAdd} />
        </AddModal>
      </div>

      {/* Table Container */}
      <div
        className={`p-6 mt-32 transition-all duration-300 ${
          isCollapsed ? "ml-16 w-[calc(100%-4rem)]" : "ml-64 w-[calc(100%-16rem)]"
        }`}
      >
        {/* Instruction Table */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-md overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredInstructions}
            pagination
            progressPending={loading}
            progressComponent={<p className="text-center">Loading...</p>}
          />
        </div>
      </div>
    </div>
  );
};

export default InstructionList;
