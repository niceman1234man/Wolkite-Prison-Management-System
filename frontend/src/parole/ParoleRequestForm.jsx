import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import axiosInstance from '../utils/axiosInstance'
import { toast } from "react-toastify"; // Import toast
import "react-toastify/dist/ReactToastify.css"; // Import toast CSS

const ParoleRequestForm = ({ isOpen, onClose, parole }) => {
  const [data,setData]=useState({
    number:"",
    date:"",
    referenceNumber: "",
    receiverName:""

  })
  const [formData, setFormData] = useState({
    number: "",
    date: new Date().toISOString().split('T')[0],
    receiverName: "",
    referenceNumber: "",
    prisonerName: "",
    crimeType: "",
    year: "",
    sentenceReduction: "",
    additionalReduction: "",
    remainingSentence: "",
    startDate: "",
    endDate: "",
    paroleDate: "",
    point: ""
  });

  useEffect(() => {
    if (parole) {
      const totalSentence = parole.year || 0;
      const twoThirds = (totalSentence * 2) / 3;
      const oneThird = totalSentence / 3;

      setFormData(prev => ({
        ...prev,
        prisonerName: parole.name || "",
        crimeType: parole.case || "",
        year: parole.year || "",
        point: parole.point || "",
        startDate: formatDate(parole.start),
        endDate: formatDate(parole.end),
        paroleDate: formatDate(parole.paroleDate),
        sentenceReduction: `${twoThirds.toFixed(1)} ዓመት`,
        additionalReduction: `${oneThird.toFixed(1)} ዓመት`,
        remainingSentence: parole.durationFromParoleToEnd || ""
      }));
    }
  }, [parole]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
   
    
      console.log(data)
      const token = localStorage.getItem('token');
      const response = await axiosInstance.put(`/parole-tracking/request/${parole.inmateId}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('የአመክሮ ጥያቄው በተሳካ ሁኔታ ተልኳል');
      onClose();
    } catch (error) {
      console.error('Error submitting parole request:', error);
      toast.error(error.response?.data?.message || 'የአመክሮ ጥያቄውን መላክ አልተሳካም');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">የአመክሮ ጥያቄ ቅጽ</DialogTitle>
        </DialogHeader>

        <Card className="p-6 mx-auto mt-5 shadow-lg rounded-lg">
          <CardContent>
            <div className="float-end">
              <div className="flex">
                ቁጥር
                <Input
                  type="number"
                  name="number"
                  onChange={handleChange}
                  className="mb-2 ml-3 w-auto"
                />
              </div>
              <div className="flex">
                ቀን{" "}
                <Input
                  type="date"
                  name="date"
                  onChange={handleChange}
                  className="mb-2 ml-3 w-auto"
                />
              </div>
            </div>

            <div className="mt-20">
              <div className="flex">
                ለ{" "}
                <Input
                  name="receiverName"
                  placeholder="ለ"
                  onChange={handleChange}
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
                  onChange={handleChange}
                  className="mb-2 ml-3 w-auto"
                />
              </div>

              <div className="space-y-4">
                <p className="flex flex-wrap items-center gap-2">
                  የህግ ታራሚ ስም:
                  <Input
                    name="prisonerName"
                    value={formData.prisonerName}
                    readOnly
                    className="w-auto"
                  />
                  የተባለው የህግ ታራሚ በአመክሮ መፈቻ ጥያቄ በተከሰሰበት
                  <Input
                    name="crimeType"
                    value={formData.crimeType}
                    readOnly
                    className="w-auto"
                  />
                  ወንጀል 
                  <Input
                    name="year"
                    value={formData.year}
                    readOnly
                    className="w-auto"
                  />
                  እስራት እንዲቀጣ በወሰነው መሠረት
                </p>
              </div>

              <div className="space-y-4 mt-4">
                <div className="flex items-center">
                  <span>1/ ታራሚው ማ/ቤት የገባበት:</span>
                  <Input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    readOnly
                    className="ml-3 w-auto"
                  />
                </div>

                <div className="flex items-center">
                  <span>2/ ታራሚው አስራቱ ጨርሶ የሚፈታው:</span>
                  <Input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    readOnly
                    className="ml-3 w-auto"
                  />
                </div>

                <div className="flex items-center">
                  <span>3/ በአመክሮ የሚፈታው:</span>
                  <Input
                    type="date"
                    name="paroleDate"
                    value={formData.paroleDate}
                    readOnly
                    className="ml-3 w-auto"
                  />
                </div>

                <div className="flex items-center">
                  <span>4/ በፀባይ ነጥብ መስጨ የተገኘ:</span>
                  <Input
                    type="number"
                    name="point"
                    value={formData.point}
                    readOnly
                    className="ml-3 w-auto"
                  />
                </div>
              </div>

              <div className="mt-4">
                <p>
                  5/ ስለጉዳት ካሣና እርቅ ማዉረድ የተሠጠ መግለጫ 6 ስለ ሙያና ሥራ ችሎታ ስለ መተዳደሪያ ከተቀመጠው
                  ኮሚቴ የተሠጠው የምስክርነት በአጠቃላይ ያቀረብን በ997 በወጣው የኢፊድሪ የወ/መ/ህ/ቁጥር 12 በአንቀጽ
                  13 በወ/መ/ቁ 206 በአንቀጽ 201207 በአንቀጽ 202 209 እና 204 በወንጀል ህጉ መሠረት
                  በአመክሮ እንዲፈታ እንጠይቃለን፡፡
                </p>
                <p className="text-right mt-4">ከሠላምታ ጋር</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ሰርዝ
          </Button>
          <Button variant="destructive" onClick={handleSubmit}>
            ማስገባት
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ParoleRequestForm;
