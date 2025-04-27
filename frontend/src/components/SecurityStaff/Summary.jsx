import React from "react";
// import { useAuth } from "../../context/authContext";

export const SummaryCard = ({icon, text, number, color}) => {
  return ( 
    <div className='rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 duration-300'>
      <div className={`${color} text-white p-6`}>
        <div className='flex items-center justify-between'>
          <div className='text-3xl'>{icon}</div>
          <div className='text-4xl font-bold'>{number}</div>
        </div>
        <div className='mt-4'>
          <p className='text-lg font-semibold text-white'>{text}</p>
        </div>
      </div>
    </div>
  )
}
export default SummaryCard;   
