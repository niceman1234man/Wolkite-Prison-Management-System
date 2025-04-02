import { useState } from 'react';
import ParoleAcceptModal from './modals/ParoleAcceptModal';
import ParoleRejectModal from './modals/ParoleRejectModal';

export default function ViewParole({ parole }) {
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  return (
    <div>
      {/* ... existing parole details ... */}
      
      <div className="flex gap-4 mt-4">
        <Button onClick={() => setShowAcceptModal(true)}>Accept Parole</Button>
        <Button variant="destructive" onClick={() => setShowRejectModal(true)}>
          Reject Parole
        </Button>
      </div>

      <ParoleAcceptModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        paroleId={parole._id}
      />

      <ParoleRejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        paroleId={parole._id}
      />
    </div>
  );
} 