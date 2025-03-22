import React, { useEffect, useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { useParams, useNavigate } from "react-router-dom";
import { TiArrowBack } from "react-icons/ti";
import { toast } from "react-toastify";
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
        console.log(response);
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
      await axiosInstance.post(`/parole/reject/${id}`, { reason, date });
      toast.success("Parole request rejected successfully.");
    } catch (error) {
      toast.error("Failed to reject parole request.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!inmateData) {
    return <div>No data available</div>;
  }

  const acceptParole = () => {
    return;
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
            <Input type="number" name="number" className="mb-2 ml-3 w-auto" />
          </div>
          <div className="flex">
            ቀን <Input type="date" name="date" className="mb-2 ml-3 w-auto" />
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
            className="mb-2 ml-3 w-auto"
            required
          />
          ፍ/ቤት
        </div>
        <div className="flex">
          የወ/መ/ቁ{" "}
          <Input
            name="referenceNumber"
            placeholder="የማጣቀሻ ቁጥር"
            className="mb-2 ml-3 w-auto"
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
              required
            />
            የተባለው የህግ ታራሚ በአመክሮ መፈቻ ጥያቄ በተከሰሰበት
            <Input
              name="crimeType"
              placeholder="የወንጀሉ አይነት"
              className="mb-2 inline-block w-auto"
              required
            />
            ወንጀል እስራት እንዲቀጣ በወሰነው መሠረት ከዚህ ውስጥ 2/3ኛው
            <Input
              name="sentenceReduction"
              placeholder="ቅናሽ"
              className="mb-2 inline-block w-auto"
              required
            />
            በእስራት የፈጸመ ሲሆን 1/3ኛውን
            <Input
              name="additionalReduction"
              placeholder="ቅናሽ"
              className="mb-2 inline-block w-auto"
              required
            />
            ቅናሽ አግጋቶዋል፡፡ አሁንም በጠቅላላው ከተፈረደበት የእስራት ጊዜ ውስጥ ወደፊት የሚቀረው
            <Input
              name="remainingSentence"
              placeholder="ቀሪ"
              className="mb-2 inline-block w-auto"
              required
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
            type="date"
            name="date"
            placeholder="የገባበት ቀን"
            className="mb-2 w-auto ml-3"
          />
        </div>
        <div className="flex">
          2/ ታራሚው አስራቱ ጨርሶ የሚፈታው
          <Input
            type="date"
            name="date"
            placeholder="የሚፈታበት ቀን"
            className="mb-2 w-auto ml-3"
          />
        </div>
        <div className="flex">
          3/ በአመክሮ የሚፈታው
          <Input
            type="date"
            name="date"
            placeholder="በ አመክሮ የሚፈታበት ቀን "
            className="mb-2 w-auto ml-3"
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
          />
        </div>
        5/ ስለጉዳት ካሣና እርቅ ማዉረድ የተሠጠ መግለጫ 6 ስለ ሙያና ሥራ ችሎታ ስለ መተዳደሪያ ከተቀመጠው ኮሚቴ
        የተሠጠው የምስክርነት በአጠቃላይ ያቀረብን በ997 በወጣው የኢፊድሪ የወ/መ/ህ/ቁጥር 12 በአንቀጽ 13 በወ/መ/ቁ
        206 በአንቀጽ 201207 በአንቀጽ 202 209 እና 204 በወንጀል ህጉ መሠረት በአመክሮ እንዲፈታ
        እንጠይቃለን፡፡
        <p className="float-end mt-4 mr-3">ከሠላምታ ጋር</p>
      </CardContent>

      <div className="mt-6">
        <button
          onClick={() => setOpenAccept(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded mr-4"
        >
          Accept
        </button>
        <ParoleAccept
          isOpen={openAccept}
          onClose={() => setOpenAccept(false)}
          onSubmit={acceptParole}
        />
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setIsRejectModalOpen(true)}
        >
          Reject
        </button>
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
