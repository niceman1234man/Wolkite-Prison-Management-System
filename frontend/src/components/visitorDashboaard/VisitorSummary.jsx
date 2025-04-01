import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
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

function VisitorSummaryCard() {
  const [stats, setStats] = useState({
    totalVisits: 0,
    pendingVisits: 0,
    upcomingVisits: 0,
  });

  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed); // Get sidebar state from Redux

  const images = [
    centralEthiopiaFlag,
    flagEthiopia,
    guragePrison,
    gurageZone,
    Images,
    prisonLogin,
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get("/schedules");
      if (response.data.success) {
        const schedules = response.data.data;
        const now = new Date();
        
        const stats = {
          totalVisits: schedules.length,
          pendingVisits: schedules.filter(s => s.status === "pending").length,
          upcomingVisits: schedules.filter(s => {
            const visitDate = new Date(s.visitDate);
            return visitDate > now && s.status === "approved";
          }).length,
        };
        
        setStats(stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to fetch dashboard statistics");
    }
  };

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
      <h2 className="text-2xl font-bold mb-6">Welcome to Your Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Visits</h3>
          <p className="text-3xl font-bold text-teal-600">{stats.totalVisits}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Pending Visits</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingVisits}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Upcoming Visits</h3>
          <p className="text-3xl font-bold text-green-600">{stats.upcomingVisits}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/visitor-dashboard/schedule"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Schedule a Visit</h3>
          <p className="text-gray-600">
            Schedule a new visit with an inmate
          </p>
        </Link>

        <Link
          to="/visitor-dashboard/visit-history"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Visit History</h3>
          <p className="text-gray-600">
            View your past and upcoming visits
          </p>
        </Link>

        <Link
          to="/visitor-dashboard/setting"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Profile Settings</h3>
          <p className="text-gray-600">
            Manage your account information
          </p>
        </Link>
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
                        Bring a valid government-issued ID (e.g., driver's
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
}

export default VisitorSummaryCard;