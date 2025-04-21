import React from "react";
import { FaTimes } from "react-icons/fa";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import RegisterVisitor from '../../components/Visitor/RegisterVisitor'

const AddModal = ({ open, setOpen, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold"></h2>
            <button
              onClick={() => setOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 flex-1">
          {children}
        </div>

        {/* Fixed Footer */}
        <div className="bg-gray-50 p-4 rounded-b-xl border-t border-gray-200">
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </Button>
            {/* <Button
              type="submit"
              form="prisonForm"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Save
            </Button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddModal;
