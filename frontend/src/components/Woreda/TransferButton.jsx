import React, { useState } from "react";
import { FaExchangeAlt } from "react-icons/fa";
import TransferDialog from "./TransferDialog";

const TransferButton = ({ inmate, onTransferComplete, currentPrison, prisonMap }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-1 sm:p-1.5 rounded-full transition-all duration-150 hover:shadow-md transform hover:-translate-y-1"
        title="Transfer Inmate"
      >
        <FaExchangeAlt className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </button>

      <TransferDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        inmate={inmate}
        onTransferComplete={onTransferComplete}
        currentPrison={currentPrison}
        prisonMap={prisonMap}
      />
    </>
  );
};

export default TransferButton;
