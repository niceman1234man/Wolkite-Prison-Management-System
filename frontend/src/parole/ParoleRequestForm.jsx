import React, { useState } from "react";
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

const ParoleRequestForm = ({ isOpen, onClose, onSubmit }) => {
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
  });

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto ">
        <DialogHeader>
          <DialogTitle className="text-center"> Parole Request</DialogTitle>
        </DialogHeader>

        <Card className="p-6  mx-auto mt-5 shadow-lg rounded-lg">
          <CardContent>
            <div className="float-end">
            <div className="flex ">ቁጥር
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
      onChange={handleChange}
      className="mb-2 inline-block w-auto"
      required
    />
    የተባለው የህግ ታራሚ በአመክሮ መፈቻ ጥያቄ በተከሰሰበት
    <Input
      name="crimeType"
      placeholder="የወንጀሉ አይነት"
      onChange={handleChange}
      className="mb-2 inline-block w-auto"
      required
    />
    ወንጀል እስራት እንዲቀጣ በወሰነው መሠረት ከዚህ ውስጥ 2/3ኛው
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

              በዚህ መሠረት የህግ ታራሚው ጠቅላይ ፍርድ 2/3ኛውን የታሠረ በመሆኑ በአከሮ ለመፈታት የደረሰ ሆኖ
              ተገኝቶዋል፡፡የኸውም የህግ ታራሚው በዚህ ማቤት በኖረባቸው ዘመኖች መልካም ፀባይ ይዞ የቆየ መሆኑንና
              የታዘዘውን ሥራ በቅን የሠራ ነው እንዲሁም ፀባዩን ያረመና ወደ ማህበራዊ ኑሮ ተመልሶ ለመቀላቀል የሚበቃ
              ሆኖ ተገኝቶዋል፡፡ 
              <p className="mt-3">በዚሁ ረገድ በቆየበት ጊዜ ያሣየውን መልካም ፀባዩን የሚያረጋግጥ</p> 
              <div className="flex mt-4">
                1/ታራሚው ማ/ቤት የገባበት
              <Input
                type="date"
                name="date"
                placeholder="የገባበት ቀን"
                onChange={handleChange}
                className="mb-2 w-auto ml-3"
              />
              </div>
              <div className="flex">
              2/ ታራሚው አስራቱ ጨርሶ የሚፈታው
              <Input
                type="date"
                name="date"
                placeholder="የሚፈታበት ቀን"
                onChange={handleChange}
                className="mb-2 w-auto ml-3"
              />
              </div>
              <div className="flex">
              3/ በአመክሮ የሚፈታው
              <Input
                type="date"
                name="date"
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
