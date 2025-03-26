import React from "react";
import { FaPrint } from "react-icons/fa";

const PrintButton = ({ inmate, title, additionalData = {} }) => {
  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${inmate?.firstName} ${inmate?.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #374151; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; color: #4B5563; }
            .photo { width: 200px; height: 200px; object-fit: cover; margin: 0 auto 20px; display: block; border: 4px solid #16a34a; border-radius: 8px; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            ${inmate?.documents?.length > 0 
              ? `<img src="${inmate.documents[0]}" alt="Inmate Photo" class="photo" />`
              : `<div class="photo" style="background: #eee; display: flex; align-items: center; justify-content: center;">
                   <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                     <circle cx="12" cy="7" r="4"></circle>
                   </svg>
                 </div>`
            }
            <h2>${inmate?.firstName} ${inmate?.lastName}</h2>
          </div>

          ${Object.entries(additionalData).map(([sectionTitle, fields]) => `
            <div class="section">
              <div class="section-title">${sectionTitle}</div>
              <div class="grid">
                ${Object.entries(fields).map(([label, value]) => `
                  <div class="field">
                    <div class="label">${label}:</div>
                    <div>${value}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}

          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
            Generated on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = function () {
      printWindow.print();
    };
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      <FaPrint className="mr-2 text-sm" />
      Print Details
    </button>
  );
};

export default PrintButton; 