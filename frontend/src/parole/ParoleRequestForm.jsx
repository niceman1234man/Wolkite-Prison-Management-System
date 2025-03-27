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
import { toast } from "react-toastify";

const ParoleRequestForm = ({ isOpen, onClose, onSubmit, parole }) => {
  const [formData, setFormData] = useState({
    receiverName: "",
    senderName: "",
    date: "",
    referenceNumber: "",
    prisonerName: "",
    prisonerType: "",
    crimeType: "",
    courtDecision: "",
    additionalNotes: "",
    witnesses: ["", "", "", "", ""],
    documentVerification: "",
    officerName: "",
    officerSignature: "",
    legalArticles: "",
    startDate: "", // For the start date
    endDate: "",   // For the end date
    paroleDate: "", // For the parole date
  });

  // Function to convert date to YYYY-MM-DD format
  const formatDate = (date) => {
    if (!date) return '';
    
    try {
      // If date is already in YYYY-MM-DD format, return as is
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
      
      // If date is in MM/DD/YYYY format
      if (date.includes('/')) {
        const [month, day, year] = date.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // If date is a Date object or ISO string
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }
      
      return '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Handle form input changes
  const handleChange = (e, index = null) => {
    if (index !== null) {
      const updatedWitnesses = [...formData.witnesses];
      updatedWitnesses[index] = e.target.value;
      setFormData({ ...formData, witnesses: updatedWitnesses });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.receiverName ||
      !formData.senderName ||
      !formData.prisonerName ||
      !formData.crimeType
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    // Call the parent submit function
    try {
      onSubmit(formData);
      toast.success("Parole request submitted successfully!");
      onClose(); // Close the modal
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit parole request.");
    }
  };

  useEffect(() => {
    // Set the dates if available and convert to YYYY-MM-DD format
    if (parole) {
      console.log("parole object:", parole); // Add a console log to debug
      setFormData((prevData) => ({
        ...prevData,
        startDate: parole.start ? formatDate(parole.start) : "",
        endDate: parole.end ? formatDate(parole.end) : "",
        paroleDate: parole.paroleDate ? formatDate(parole.paroleDate) : "",
      }));
    }
  }, [parole]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto ">
        <DialogHeader>
          <DialogTitle className="text-center"> Parole Request</DialogTitle>
        </DialogHeader>

        <Card className="p-6  mx-auto mt-5 shadow-lg rounded-lg">
          <CardContent>
            <div className="float-end">
              <div className="flex">ቁጥር
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
            <br />
            <br />
            <br />
            <br /><br />
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
              <p>
                የህግ ታራሚ ስም:
                <Input
                  name="prisonerName"
                  placeholder="የእስረኛው ስም"
                  value={parole.name}
                  onChange={handleChange}
                  className="mb-2 inline-block w-auto"
                  required
                />
                የተባለው የህግ ታራሚ በአመክሮ መፈቻ ጥያቄ በተከሰሰበት
                <Input
                  name="crimeType"
                  placeholder="የወንጀሉ አይነት"
                  value={parole.case}
                  onChange={handleChange}
                  className="mb-2 inline-block w-auto"
                  required
                />
                ወንጀል 
                <Input
                  name="year"
                  placeholder="የወንጀሉ አይነት"
                  value={parole.year}
                  onChange={handleChange}
                  className="mb-2 inline-block w-auto"
                  required
                />
                እስራት እንዲቀጣ በወሰነው መሠረት ከዚህ ውስጥ 2/3ኛው
                <Input
                  name="sentenceReduction"
                  placeholder="ቅናሽ"
                  onChange={handleChange}
                  className="mb-2 inline-block w-auto"
                  required
                />
                በእስራት የፈጸመ ሲሆን 1/3ኛውን
                <Input
                  name="additionalReduction"
                  placeholder="ቅናሽ"
                  onChange={handleChange}
                  className="mb-2 inline-block w-auto"
                  required
                />
                ቅናሽ አግጋቶዋል፡፡ አሁንም በጠቅላላው ከተፈረደበት የእስራት ጊዜ ውስጥ ወደፊት የሚቀረው
                <Input
                  name="remainingSentence"
                  placeholder="ቀሪ"
                  onChange={handleChange}
                  className="mb-2 inline-block w-auto"
                  required
                />
              </p>
            </div>

            <div className="flex mt-4">
              1/ታራሚው ማ/ቤት የገባበት
              <Input
                type="date"
                name="startDate"
                value={formData.startDate} // Set date from form state
                placeholder="የገባበት ቀን"
                onChange={handleChange}
                className="mb-2 w-auto ml-3"
              />
            </div>
            <div className="flex">
              2/ ታራሚው አስራቱ ጨርሶ የሚፈታው
              <Input
                type="date"
                name="endDate"
                value={formData.endDate} // Set date from form state
                placeholder="የሚፈታበት ቀን"
                onChange={handleChange}
                className="mb-2 w-auto ml-3"
              />
            </div>
            <div className="flex">
              3/ በአመክሮ የሚፈታው
              <Input
                type="date"
                name="paroleDate"
                value={formData.paroleDate} // Set date from form state
                placeholder="በ አመክሮ የሚፈታበት ቀን "
                onChange={handleChange}
                className="mb-2 w-auto ml-3"
              />
            </div>

            <div className="flex">
              

              4/ በፀባይ ነጥብ መስጨ የተገኘ
              <Input
                type="number"
                name="point"
                value={parole.point}
                placeholder="ጠቅላላ ነጥብ "
                onChange={handleChange}
                className="mb-2 w-auto ml-3"
              />
              </div>
              5/ ስለጉዳት ካሣና እርቅ ማዉረድ የተሠጠ መግለጫ 6 ስለ ሙያና ሥራ ችሎታ ስለ መተዳደሪያ ከተቀመጠው
              ኮሚቴ የተሠጠው የምስክርነት በአጠቃላይ ያቀረብን በ997 በወጣው የኢፊድሪ የወ/መ/ህ/ቁጥር 12 በአንቀጽ
              13 በወ/መ/ቁ 206 በአንቀጽ 201207 በአንቀጽ 202 209 እና 204 በወንጀል ህጉ መሠረት
              በአመክሮ እንዲፈታ እንጠይቃለን፡፡ 
              <p className="float-end mt-4 mr-3">ከሠላምታ ጋር</p>
            
          </CardContent>
        </Card>

        <DialogFooter >
          <Button variant="outline" onClick={onClose}>
            Cancel
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
