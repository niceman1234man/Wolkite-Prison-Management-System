import React, { useState, useEffect, useRef } from "react";
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
import { FiPrinter, FiSend, FiX } from "react-icons/fi";

const ParoleRequestForm = ({ isOpen, onClose, parole }) => {
  const [data, setData] = useState({
    number: "",
    date: "",
    referenceNumber: "",
    receiverName: ""
  });
  
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
    point: "",
    durationToParole: "",
    durationFromParoleToEnd: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const printableContentRef = useRef(null);

  // Generate auto numbers
  useEffect(() => {
    // Generate number in format NUM-XXXXXX
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const generatedNumber = `NUM-${randomNum}`;
    
    // Generate reference number in format REF-NUMXXXXXXXXX
    const refRandomNum = Math.floor(10000000 + Math.random() * 90000000);
    const generatedRefNumber = `REF-NUM${refRandomNum}`;
    
    setData({
      ...data,
      number: generatedNumber,
      referenceNumber: generatedRefNumber,
      date: new Date().toISOString().split('T')[0]
    });
  }, []);

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
        remainingSentence: parole.durationFromParoleToEnd || "",
        durationToParole: `${twoThirds.toFixed(1)} ዓመት`,
        durationFromParoleToEnd: `${oneThird.toFixed(1)} ዓመት`
      }));
    }
  }, [parole]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      console.log(data);
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
    } finally {
      setIsSubmitting(false);
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

  const handlePrint = () => {
    const printContent = printableContentRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>የአመክሮ ጥያቄ ቅጽ - ${formData.prisonerName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Noto Sans Ethiopic', Arial, sans-serif;
              padding: 40px;
              line-height: 1.8;
              color: #333;
              background-color: #fff;
            }
            
            .document-container {
              max-width: 800px;
              margin: 0 auto;
              position: relative;
              padding: 30px;
              background-color: white;
              border: 1px solid #eee;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .header-section {
              position: relative;
              margin-bottom: 60px;
            }
            
            .header-right {
              position: absolute;
              top: 0;
              right: 0;
              text-align: right;
            }
            
            .header-label {
              font-weight: 500;
              margin-right: 10px;
            }
            
            .reference-number {
              display: inline-block;
              margin: 20px 0;
            }
            
            .header-value {
              display: inline-block;
              padding: 3px 8px;
              background-color: #f7f7f7;
              border: 1px solid #eaeaea;
              border-radius: 4px;
              font-weight: 500;
              min-width: 120px;
              text-align: center;
            }
            
            .field-value {
              display: inline-block;
              padding: 3px 8px;
              margin: 0 5px;
              background-color: #f7f7f7;
              border: 1px solid #eaeaea;
              border-radius: 4px;
              font-weight: 500;
            }
            
            .recipient-section {
              margin-bottom: 30px;
            }
            
            .content-section {
              text-align: justify;
              margin-bottom: 20px;
            }
            
            .detail-item {
              margin: 15px 0;
              display: flex;
              align-items: center;
            }
            
            .detail-label {
              margin-right: 10px;
              min-width: 150px;
            }
            
            .detail-data {
              padding: 3px 8px;
              background-color: #f7f7f7;
              border: 1px solid #eaeaea;
              border-radius: 4px;
              min-width: 120px;
              text-align: center;
            }
            
            .signature-section {
              margin-top: 50px;
              text-align: right;
            }
            
            .footer-section {
              margin-top: 100px;
              border-top: 1px solid #eee;
              padding-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #777;
            }

            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              
              .document-container {
                box-shadow: none;
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            <div class="header-section">
              <div class="header-right">
                <div>
                  <span class="header-label">ቁጥር:</span>
                  <span class="header-value">${data.number}</span>
                </div>
                <div style="margin-top: 10px;">
                  <span class="header-label">ቀን:</span>
                  <span class="header-value">${new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                </div>
              </div>
            </div>
            
            <div class="recipient-section">
              <div>
                <span>ለ:</span>
                <span class="field-value">${data.receiverName}</span>
                <span>ፍ/ቤት</span>
              </div>
              
              <div class="reference-number">
                <span>የወ/መ/ቁ:</span>
                <span class="field-value">${data.referenceNumber}</span>
              </div>
            </div>
            
            <div class="content-section">
              <p>
                የህግ ታራሚ ስም: <span class="field-value">${formData.prisonerName}</span> 
                የተባለው የህግ ታራሚ በአመክሮ መፈቻ ጥያቄ በተከሰሰበት <span class="field-value">${formData.crimeType}</span> 
                ወንጀል እስራት እንዲቀጣ በወሰነው መሠረት ከዚህ ውስጥ 2/3ኛው <span class="field-value">${formData.durationToParole}</span> 
                በእስራት የፈጸመ ሲሆን 1/3ኛውን <span class="field-value">${formData.durationFromParoleToEnd}</span> 
                ቅናሽ አግጋቶዋል፡፡ አሁንም በጠቅላላው ከተፈረደበት የእስራት ጊዜ ውስጥ ወደፊት የሚቀረው <span class="field-value">${formData.durationFromParoleToEnd}</span>
              </p>
              
              <p>
                በዚህ መሠረት የህግ ታራሚው ጠቅላይ ፍርድ 2/3ኛውን የታሠረ በመሆኑ በአከሮ ለመፈታት የደረሰ ሆኖ
                ተገኝቶዋል፡፡የኸውም የህግ ታራሚው በዚህ ማቤት በኖረባቸው ዘመኖች መልካም ፀባይ ይዞ የቆየ መሆኑንና የታዘዘውን
                ሥራ በቅን የሠራ ነው እንዲሁም ፀባዩን ያረመና ወደ ማህበራዊ ኑሮ ተመልሶ ለመቀላቀል የሚበቃ ሆኖ ተገኝቶዋል፡፡
              </p>
              
              <p>በዚሁ ረገድ በቆየበት ጊዜ ያሣየውን መልካም ፀባዩን የሚያረጋግጥ:</p>
              
              <div class="detail-item">
                <span class="detail-label">1/ ታራሚው ማ/ቤት የገባበት:</span>
                <span class="detail-data">${formData.startDate}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">2/ ታራሚው አስራቱ ጨርሶ የሚፈታው:</span>
                <span class="detail-data">${formData.endDate}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">3/ በአመክሮ የሚፈታው:</span>
                <span class="detail-data">${formData.paroleDate}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">4/ በፀባይ ነጥብ መስጨ የተገኘ:</span>
                <span class="detail-data">${formData.point}</span>
              </div>
              
              <p>
                5/ ስለጉዳት ካሣና እርቅ ማዉረድ የተሠጠ መግለጫ 6 ስለ ሙያና ሥራ ችሎታ ስለ መተዳደሪያ ከተቀመጠው
                ኮሚቴ የተሠጠው የምስክርነት በአጠቃላይ ያቀረብን በ997 በወጣው የኢፊድሪ የወ/መ/ህ/ቁጥር 12 በአንቀጽ
                13 በወ/መ/ቁ 206 በአንቀጽ 201207 በአንቀጽ 202 209 እና 204 በወንጀል ህጉ መሠረት
                በአመክሮ እንዲፈታ እንጠይቃለን፡፡
              </p>
            </div>
            
            <div class="signature-section">
              <p>ከሠላምታ ጋር</p>
            </div>
            
            <div class="footer-section">
              <p>የወልቂጤ እስር ቤት አስተዳደር</p>
              <p>ቀን: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-800">
            የአመክሮ ጥያቄ ቅጽ
          </DialogTitle>
        </DialogHeader>

        <div className="fixed top-4 right-4 z-20 print:hidden">
          <Button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all rounded-md px-4 py-2"
            size="sm"
          >
            <FiPrinter className="h-4 w-4" />
            <span className="font-medium">አትም</span>
          </Button>
        </div>

        <div className="relative mt-4">
          <Card className="p-6 mx-auto mt-5 shadow-lg rounded-lg border border-gray-200" ref={printableContentRef}>
            <CardContent>
              <div className="absolute top-6 right-6">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-gray-700">ቁጥር:</span>
                  <Input
                    type="text"
                    name="number"
                    value={data.number}
                    onChange={handleChange}
                    className="ml-3 w-36 bg-gray-50 border-gray-200"
                    readOnly
                  />
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700">ቀን:</span>
                  <Input
                    type="date"
                    name="date"
                    value={data.date}
                    onChange={handleChange}
                    className="ml-3 w-36 bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              <div className="mt-24">
                <div className="flex items-center mb-4">
                  <span className="font-medium text-gray-700">ለ:</span>
                  <Input
                    name="receiverName"
                    placeholder="ለ"
                    value={data.receiverName}
                    onChange={handleChange}
                    className="mx-3 w-64 bg-gray-50 border-gray-200"
                    required
                  />
                  <span className="font-medium text-gray-700">ፍ/ቤት</span>
                </div>

                <div className="flex items-center mb-8">
                  <span className="font-medium text-gray-700">የወ/መ/ቁ:</span>
                  <Input
                    name="referenceNumber"
                    placeholder="የማጣቀሻ ቁጥር"
                    value={data.referenceNumber}
                    onChange={handleChange}
                    className="mx-3 w-64 bg-gray-50 border-gray-200"
                    readOnly
                  />
                </div>

                <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-100 mb-6">
                  <p className="text-gray-800 leading-relaxed flex flex-wrap items-center gap-2">
                    <span className="font-medium">የህግ ታራሚ ስም:</span>
                    <Input
                      name="prisonerName"
                      value={formData.prisonerName}
                      readOnly
                      className="w-64 bg-white border-gray-200"
                    />
                    <span>የተባለው የህግ ታራሚ በአመክሮ መፈቻ ጥያቄ በተከሰሰበት</span>
                    <Input
                      name="crimeType"
                      value={formData.crimeType}
                      readOnly
                      className="w-64 bg-white border-gray-200"
                    />
                    <span>ወንጀል እስራት እንዲቀጣ በወሰነው መሠረት ከዚህ ውስጥ 2/3ኛው</span>
                    <Input
                      name="durationToParole"
                      value={formData.durationToParole}
                      readOnly
                      className="w-36 bg-white border-gray-200"
                    />
                    <span>በእስራት የፈጸመ ሲሆን 1/3ኛውን</span>
                    <Input
                      name="durationFromParoleToEnd"
                      value={formData.durationFromParoleToEnd}
                      readOnly
                      className="w-36 bg-white border-gray-200"
                    />
                    <span>ቅናሽ አግጋቶዋል፡፡ አሁንም በጠቅላላው ከተፈረደበት የእስራት ጊዜ ውስጥ ወደፊት የሚቀረው</span>
                    <Input
                      name="remainingSentence"
                      value={formData.durationFromParoleToEnd}
                      readOnly
                      className="w-36 bg-white border-gray-200"
                    />
                  </p>
                </div>

                <div className="my-6 bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <p className="text-gray-800 leading-relaxed">
                    በዚህ መሠረት የህግ ታራሚው ጠቅላይ ፍርድ 2/3ኛውን የታሠረ በመሆኑ በአከሮ ለመፈታት የደረሰ ሆኖ
                    ተገኝቶዋል፡፡የኸውም የህግ ታራሚው በዚህ ማቤት በኖረባቸው ዘመኖች መልካም ፀባይ ይዞ የቆየ መሆኑንና የታዘዘውን
                    ሥራ በቅን የሠራ ነው እንዲሁም ፀባዩን ያረመና ወደ ማህበራዊ ኑሮ ተመልሶ ለመቀላቀል የሚበቃ ሆኖ ተገኝቶዋል፡፡
                  </p>
                </div>

                <p className="mt-6 mb-4 font-medium text-gray-700">በዚሁ ረገድ በቆየበት ጊዜ ያሣየውን መልካም ፀባዩን የሚያረጋግጥ:</p>

                <div className="space-y-4 mt-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-64">1/ ታራሚው ማ/ቤት የገባበት:</span>
                    <Input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      readOnly
                      className="w-48 bg-white border-gray-200"
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-64">2/ ታራሚው አስራቱ ጨርሶ የሚፈታው:</span>
                    <Input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      readOnly
                      className="w-48 bg-white border-gray-200"
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-64">3/ በአመክሮ የሚፈታው:</span>
                    <Input
                      type="date"
                      name="paroleDate"
                      value={formData.paroleDate}
                      readOnly
                      className="w-48 bg-white border-gray-200"
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-64">4/ በፀባይ ነጥብ መስጨ የተገኘ:</span>
                    <Input
                      type="number"
                      name="point"
                      value={formData.point}
                      readOnly
                      className="w-48 bg-white border-gray-200"
                    />
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
                  <p className="text-gray-800 leading-relaxed">
                    5/ ስለጉዳት ካሣና እርቅ ማዉረድ የተሠጠ መግለጫ 6 ስለ ሙያና ሥራ ችሎታ ስለ መተዳደሪያ ከተቀመጠው
                    ኮሚቴ የተሠጠው የምስክርነት በአጠቃላይ ያቀረብን በ997 በወጣው የኢፊድሪ የወ/መ/ህ/ቁጥር 12 በአንቀጽ
                    13 በወ/መ/ቁ 206 በአንቀጽ 201207 በአንቀጽ 202 209 እና 204 በወንጀል ህጉ መሠረት
                    በአመክሮ እንዲፈታ እንጠይቃለን፡፡
                  </p>
                  <p className="text-right mt-6 font-medium text-gray-700">ከሠላምታ ጋር</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
            <FiX className="h-4 w-4" />
            ሰርዝ
          </Button>
          <Button 
            variant="default" 
            onClick={handleSubmit} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                በሂደት ላይ...
              </>
            ) : (
              <>
                <FiSend className="h-4 w-4" />
                ማስገባት
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ParoleRequestForm;