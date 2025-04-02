import { useState } from "react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";

import { toast } from "react-toastify";  // Import toast

const ParoleRejectModal = ({ isOpen, onClose, onSubmit }) => {
  const [reason, setRejectReason] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = () => {
    if (!reason || !date) {
      toast.error("Please provide both reason and date.");
      return;
    }

    onSubmit({ reason, date });
    setRejectReason("");
    setDate("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Parole</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea 
            placeholder="Enter reason for rejection..." 
            value={reason} 
            onChange={(e) => setRejectReason(e.target.value)} 
          />
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ParoleRejectModal;
