import React, { useState, useEffect } from "react";

const CountTimer = ({ deadline }) => {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(deadline);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval); // Stop the timer when the deadline is reached
      }
    }, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [deadline]);

  const calculateTimeRemaining = (deadline) => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const remaining = deadlineTime - now;
    return remaining > 0 ? remaining : 0; // Ensure no negative time
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / (60 * 60 * 1000));
    const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((time % (60 * 1000)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold">Time Remaining</h3>
      <p className="text-2xl font-bold text-red-600">
        {timeRemaining > 0 ? formatTime(timeRemaining) : "Deadline Passed"}
      </p>
    </div>
  );
};

export default CountTimer;