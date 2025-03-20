import axiosInstance from "../../utils/axiosInstance";
import React, { useState, useEffect } from "react";
import ConfirmModal from "../Modals/ConfirmModal";

const ViewParole = ({id}) => {
   const [inmates, setInmates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDelete, setOpenDelete] = useState(false);
const [openActivate, setOpenActivate] = useState(false);

const fetchInmates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/parole-tracking/${id}`);
     console.log(response)
      if (response.data && response.data?.parole) {
        setInmates(response.data.parole)
       
      } else {
        console.error("Invalid API response:", response);
      }
    } catch (error) {
      console.error("Error fetching parole:", error);
      alert(error.response?.data?.error || "Failed to fetch parole data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInmates();
  }, []);



  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-lg font-semibold animate-pulse">Loading parole details...</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-white p-8 rounded-md shadow-md">
      
      <h2 className="text-2xl font-bold mb-8 text-center">Parole Details</h2>

      {inmates && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         

            {/* User Details */}
            <div>
              <p className="text-lg font-bold">Inmate Full Name: <span className="font-medium">{inmates.fullName}</span></p>
              <p className="text-lg font-bold">Age: <span className="font-medium">{inmates.age}</span></p>
              <p className="text-lg font-bold">Gender: <span className="font-medium">{inmates.gender}</span></p>
              <p className="text-lg font-bold">Status: <span className="font-medium">{inmates.paroleEligible?"Elegible":"Not Elegible"}</span></p>
              <p className="text-lg font-bold">Total Point: <span className="font-medium">{inmates.totalPoints}</span></p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
          <button
  className={`py-2 px-3 rounded font-semibold w-1/2 bg-green-600 text-white`}
  onClick={() => setOpenActivate(true)}
>
  Request
</button>
{/* <ConfirmModal
  open={openActivate}
  setOpen={setOpenActivate}
  onDelete={toggleActivation}
  message={`Do you want to  activate this user account?`}
/> */}



 </div>
 </>
      )}
    </div>
  );
};

export default ViewParole;
