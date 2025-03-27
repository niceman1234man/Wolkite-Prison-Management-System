import React, { useState } from "react";
import { FaExchangeAlt } from "react-icons/fa";
import TransferDialog from "./TransferDialog";

const TransferButton = ({ inmate, onTransferComplete, currentPrison }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
      >
        <FaExchangeAlt className="mr-2 text-sm" />
        Transfer
      </button>

      <TransferDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        inmate={inmate}
        onTransferComplete={onTransferComplete}
        currentPrison={currentPrison}
      />
    </>
  );
};

export default TransferButton;
