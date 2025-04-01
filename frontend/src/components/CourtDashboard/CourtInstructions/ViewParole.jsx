import React, { useEffect, useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { useParams, useNavigate } from "react-router-dom";
import { TiArrowBack } from "react-icons/ti";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import ParoleRejectModal from "./ParoleRejectModal";
import ConfirmModal from "@/components/Modals/ConfirmModal";
import ParoleAccept from "./ParoleAccept";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ViewParole = ({ id }) => {
  // const { id } = useParams();
  const [inmateData, setInmateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false); // Manage modal state
  const [openAccept, setOpenAccept] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInmateDetails = async () => {
      try {
       
        const response = await axiosInstance.get(`/parole-tracking/${id}`);
        console.log(response.data.parole);
        setInmateData(response.data.parole);
      } catch (error) {
        console.error("Error fetching inmate details:", error);
        toast.error("Failed to load inmate details.");
      } finally {
        setLoading(false);
      }
    };

    fetchInmateDetails();
  }, [id]); 

  const handleRejectParole = async ({ reason, date }) => {
    try {
       const status="rejected"
      await axiosInstance.put(`/parole-tracking/update/${id}`, { reason, date,status });
      toast.success("Parole request rejected successfully.");
    } catch (error) {
      toast.error("Failed to reject parole request.");
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!inmateData) {
    return <div>No data available</div>;
  }

  const acceptParole = async( {reason, date }) => {
    try {
      const status="accepted"
      await axiosInstance.put(`/parole-tracking/update/${id}`, {reason, date,status });
      toast.success("Parole request Accept successfully.");
    } catch (error) {
      toast.error("Failed to accept parole request.");
    }
  };
  

  return (
    <div className="w-full mx-auto  bg-white p-8 rounded-md shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center">
        Parole Request Details
      </h2>
      <CardContent>
        <div className="float-end">
          <div className="flex ">
            ቁጥር
            <Input type="number" name="number" value={inmateData.request.number} className="mb-2 ml-3 w-auto" readOnly />
          </div>
          <div className="flex">
            ቀን <Input type="date" name="date" value={formatDate(inmateData.request.date)} className="mb-2 ml-3 w-auto" readOnly />
          </div>
        </div>
        <br />
        <br />
        <br />
        <br />
        <br />
        <div className="flex">
          ለ{" "}
          <Input
            name="receiverName"
            placeholder="ለ"
            value={inmateData.request.receiverName}
            className="mb-2 ml-3 w-auto"
            readOnly
          />
          ፍ/ቤት
        </div>
        <div className="flex">
          የወ/መ/ቁ{" "}
          <Input
            name="referenceNumber"
            placeholder="የማጣቀሻ ቁጥር"
            value={inmateData.request.referenceNumber}
            className="mb-2 ml-3 w-auto"
            readOnly
          />
        </div>
        <div className="space-y-4">
          <p>
            የህግ ታራሚ ስም:
            <Input
              name="prisonerName"
              placeholder="የእስረኛው ስም"
              value={inmateData.fullName}
              className="mb-2 inline-block w-auto"
              readOnly
            />
            የተባለው የህግ ታራሚ በአመክሮ መፈቻ ጥያቄ በተከሰሰበት
            <Input
              name="crimeType"
              placeholder="የወንጀሉ አይነት"
              value={inmateData.caseType}
              className="mb-2 inline-block w-auto"
              readOnly
            />
            ወንጀል እስራት እንዲቀጣ በወሰነው መሠረት ከዚህ ውስጥ 2/3ኛው
            <Input
              name="sentenceReduction"
              placeholder="ቅናሽ"
              value={inmateData.durationToParole}
              className="mb-2 inline-block w-auto"
              readOnly
            />
            በእስራት የፈጸመ ሲሆን 1/3ኛውን
            <Input
              name="additionalReduction"
              placeholder="ቅናሽ"
              value={inmateData.durationFromParoleToEnd}
              className="mb-2 inline-block w-auto"
              readOnly
            />
            ቅናሽ አግጋቶዋል፡፡ አሁንም በጠቅላላው ከተፈረደበት የእስራት ጊዜ ውስጥ ወደፊት የሚቀረው
            <Input
              name="remainingSentence"
              placeholder="ቀሪ"
              value={inmateData.durationFromParoleToEnd}
              className="mb-2 inline-block w-auto"
              readOnly
            />
          </p>
        </div>
        በዚህ መሠረት የህግ ታራሚው ጠቅላይ ፍርድ 2/3ኛውን የታሠረ በመሆኑ በአከሮ ለመፈታት የደረሰ ሆኖ
        ተገኝቶዋል፡፡የኸውም የህግ ታራሚው በዚህ ማቤት በኖረባቸው ዘመኖች መልካም ፀባይ ይዞ የቆየ መሆኑንና የታዘዘውን
        ሥራ በቅን የሠራ ነው እንዲሁም ፀባዩን ያረመና ወደ ማህበራዊ ኑሮ ተመልሶ ለመቀላቀል የሚበቃ ሆኖ ተገኝቶዋል፡፡
        <p className="mt-3">በዚሁ ረገድ በቆየበት ጊዜ ያሣየውን መልካም ፀባዩን የሚያረጋግጥ</p>
        <div className="flex mt-4">
          1/ታራሚው ማ/ቤት የገባበት
          <Input
            name="date"
            value={formatDate(inmateData.startDate)}
            placeholder="የገባበት ቀን"
            className="mb-2 w-auto ml-3"
            readOnly
          />
        </div>
        <div className="flex">
          2/ ታራሚው አስራቱ ጨርሶ የሚፈታው
          <Input
            type="date"
            name="date"
            value={formatDate(inmateData.releasedDate)}
            placeholder="የሚፈታበት ቀን"
            className="mb-2 w-auto ml-3"
            readOnly
          />
        </div>
        <div className="flex">
          3/ በአመክሮ የሚፈታው
          <Input
            type="date"
            name="date"
            value={formatDate(inmateData.paroleDate)}
            placeholder="በ አመክሮ የሚፈታበት ቀን "
            className="mb-2 w-auto ml-3"
            readOnly
          />
        </div>
        <div className="flex">
          4/ በፀባይ ነጥብ መስጨ የተገኘ
          <Input
            type="number"
            name="point"
            placeholder="ጠቅላላ ነጥብ "
            value={inmateData.totalPoints}
            className="mb-2 w-auto ml-3"
            readOnly
          />
        </div>
        5/ ስለጉዳት ካሣና እርቅ ማዉረድ የተሠጠ መግለጫ 6 ስለ ሙያና ሥራ ችሎታ ስለ መተዳደሪያ ከተቀመጠው ኮሚቴ
        የተሠጠው የምስክርነት በአጠቃላይ ያቀረብን በ997 በወጣው የኢፊድሪ የወ/መ/ህ/ቁጥር 12 በአንቀጽ 13 በወ/መ/ቁ
        206 በአንቀጽ 201207 በአንቀጽ 202 209 እና 204 በወንጀል ህጉ መሠረት በአመክሮ እንዲፈታ
        እንጠይቃለን፡፡
        <p className="float-end mt-4 mr-3">ከሠላምታ ጋር</p>
      </CardContent>

      <div className="flex flex-col items-center">
        {/* Status Message */}
        {(inmateData.status === "accepted" || inmateData.status === "rejected") && (
          <div className="mb-4 p-3 bg-gray-100 rounded-md text-center">
            <p className="text-gray-700">
              This parole request has already been {inmateData.status}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => {
              if (inmateData.status === "accepted" || inmateData.status === "rejected") {
                toast.info(`This parole request has already been ${inmateData.status}`, {
                  position: "top-right",
                  autoClose: 3000,
                });
              } else {
                setOpenAccept(true);
              }
            }}
            className={`font-bold py-2 px-4 rounded mr-4 ${
              inmateData.status === "accepted" || inmateData.status === "rejected"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
            disabled={inmateData.status === "accepted" || inmateData.status === "rejected"}
          >
            Accept
          </button>

          <button
            onClick={() => {
              if (inmateData.status === "accepted" || inmateData.status === "rejected") {
                toast.info(`This parole request has already been ${inmateData.status}`, {
                  position: "top-right",
                  autoClose: 3000,
                });
              } else {
                setIsRejectModalOpen(true);
              }
            }}
            className={`font-bold py-2 px-4 rounded ${
              inmateData.status === "accepted" || inmateData.status === "rejected"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            disabled={inmateData.status === "accepted" || inmateData.status === "rejected"}
          >
            Reject
          </button>
        </div>

        {/* Modals */}
        <ParoleAccept
          isOpen={openAccept}
          onClose={() => setOpenAccept(false)}
          onSubmit={acceptParole}
        />
      </div>

      {/* Parole Rejection Modal */}
      <ParoleRejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={handleRejectParole}
      />
    </div>
  );
};

export default ViewParole;
