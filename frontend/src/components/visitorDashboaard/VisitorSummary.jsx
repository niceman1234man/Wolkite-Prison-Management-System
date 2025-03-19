import React from "react";
import { FaUser } from "react-icons/fa";
import { Slide } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";
import centralEthiopiaFlag from "../../assets/centralEthiopiaFlag.png";
import flagEthiopia from "../../assets/Flag-Ethiopia.png";
import guragePrison from "../../assets/guragePrison.jpg";
import gurageZone from "../../assets/gurageZone.png";
import Images from "../../assets/images.jpg";
import prisonLogin from "../../assets/prisonLogin.webp";
import { useSelector } from "react-redux";

const VisitorSummaryCard = () => {
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed); // Get sidebar state from Redux

  const images = [
    centralEthiopiaFlag,
    flagEthiopia,
    guragePrison,
    gurageZone,
    Images,
    prisonLogin,
  ];

  return (
    <div
      className={`p-6 mt-10 transition-all duration-300 ease-in-out ${
        isCollapsed ? "ml-16" : "ml-64"
      }`}
      style={{
        width: isCollapsed ? "calc(100% - 4rem)" : "calc(100% - 16rem)",
        marginLeft: isCollapsed ? "4rem" : "16rem",
      }}
    >
      {/* Welcome Card */}
      <div className="rounded-lg bg-white shadow-md flex items-center p-4">
        <div className="bg-teal-600 text-white p-3 rounded-lg">
          <FaUser className="text-3xl" />
        </div>
        <div className="pl-4">
          <p className="text-lg font-semibold">Welcome Back, Visitor</p>
        </div>
      </div>

      {/* Slideshow */}
      <div className="mt-6 w-full max-w-4xl mx-auto">
        <Slide autoplay={true} duration={3000} indicators={true} arrows={true}>
          {images.map((image, index) => (
            <div key={index} className="each-slide-effect h-96">
              <div
                style={{ backgroundImage: `url(${image})` }}
                className="h-full flex items-center justify-center bg-cover bg-center"
              >
                <div className="bg-black bg-opacity-50 p-6 rounded-lg text-center">
                  <span className="text-white text-xl md:text-2xl font-bold">
                    {index === 0 && (
                      <>
                        Contact the prison or check their website for visitation
                        rules, schedules, and regulations. Some prisons require
                        visitors to be on an approved visitor list, so confirm
                        if you need prior approval.
                      </>
                    )}
                    {index === 1 && (
                      <>
                        Bring a valid government-issued ID (e.g., driver’s
                        license, passport). If required, complete any necessary
                        forms before the visit.
                      </>
                    )}
                    {index === 2 && (
                      <>
                        Maintain appropriate conduct—no loud talking, disruptive
                        behavior, or excessive physical contact. Some prisons
                        allow brief hugs and handshakes; others may have
                        no-contact visits (through glass).
                      </>
                    )}
                    {index === 3 && (
                      <>
                        Respect time limits. Visits are often timed, so be
                        mindful of the duration.
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </Slide>
      </div>
    </div>
  );
};

export default VisitorSummaryCard;