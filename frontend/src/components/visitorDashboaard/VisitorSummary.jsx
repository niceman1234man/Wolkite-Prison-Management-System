import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { 
  FaUser, 
  FaCalendarAlt, 
  FaClock, 
  FaCheckCircle, 
  FaHistory, 
  FaCog, 
  FaBell, 
  FaInfoCircle, 
  FaQuestion, 
  FaList, 
  FaExclamationTriangle,
  FaChevronRight,
  FaChartBar,
  FaUsers,
  FaTimes
} from "react-icons/fa";
import { Slide } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";
import centralEthiopiaFlag from "../../assets/centralEthiopiaFlag.png";
import flagEthiopia from "../../assets/Flag-Ethiopia.png";
import guragePrison from "../../assets/guragePrison.jpg";
import gurageZone from "../../assets/gurageZone.png";
import Images from "../../assets/images.jpg";
import prisonLogin from "../../assets/prisonLogin.webp";
import { useSelector } from "react-redux";
import { format, parseISO, addDays, isAfter, isToday } from 'date-fns';
import '../../styles/responsive.css';
import NoticeWidget from "../Notices/NoticeWidget";
import { VisitorCapacityContext, VisitorCapacityProvider } from "../../contexts/VisitorCapacityContext";

function VisitorSummaryCard() {
  const [stats, setStats] = useState({
    totalVisits: 0,
    pendingVisits: 0,
    approvedVisits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [nextVisit, setNextVisit] = useState(null);
  const [userName, setUserName] = useState("");
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const { visitorCapacity, updateVisitorCapacity, refreshCapacity } = useContext(VisitorCapacityContext) || {
    visitorCapacity: { maxCapacity: 0, currentCount: 0, pendingCount: 0, approvedCount: 0, isLoading: true },
    updateVisitorCapacity: async () => false,
    refreshCapacity: async () => {}
  };

  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  const images = [
    centralEthiopiaFlag,
    flagEthiopia,
    guragePrison,
    gurageZone,
    Images,
    prisonLogin,
  ];

  // Slide content with titles and descriptions
  const slideContent = [
    {
      title: "Visitation Guidelines",
      description: "Contact the prison or check their website for visitation rules, schedules, and regulations. Some prisons require visitors to be on an approved visitor list, so confirm if you need prior approval.",
      image: centralEthiopiaFlag
    },
    {
      title: "Required Documentation",
      description: "Bring a valid government-issued ID (e.g., driver's license, passport). If required, complete any necessary forms before the visit.",
      image: flagEthiopia
    },
    {
      title: "Visit Conduct",
      description: "Maintain appropriate conduct—no loud talking, disruptive behavior, or excessive physical contact. Some prisons allow brief hugs and handshakes; others may have no-contact visits.",
      image: guragePrison
    },
    {
      title: "Time Management",
      description: "Respect time limits. Visits are often timed, so be mindful of the duration and arrive at least 30 minutes before your scheduled time.",
      image: gurageZone
    },
    {
      title: "Dress Code",
      description: "Wear appropriate clothing - no revealing outfits, gang-related colors, or clothing similar to those worn by inmates or staff. Dress modestly and conservatively.",
      image: Images
    },
    {
      title: "Prohibited Items",
      description: "Do not bring contraband, weapons, drugs, or excessive cash. Check prison guidelines for what items are allowed during visits.",
      image: prisonLogin
    }
  ];

  useEffect(() => {
    fetchUserInfo();
    fetchStats();
  }, []);

  const fetchUserInfo = async () => {
    try {
      // Get user info from localStorage first (faster)
      const userDataStr = localStorage.getItem("user");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserName(userData.firstName || userData.username || "Visitor");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/visitor/schedule/schedules");
      if (response.data.success) {
        const schedules = response.data.data;
        
        const now = new Date();
        
        // Find next upcoming visit
        const upcomingVisits = schedules
          .filter(s => {
            try {
              if (!s.visitDate) return false;
              const visitDate = new Date(s.visitDate);
              return visitDate > now;
            } catch(e) {
              console.error("Error parsing date:", e);
              return false;
            }
          })
          .sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
        
        if (upcomingVisits.length > 0) {
          setNextVisit(upcomingVisits[0]);
        }
        
        // Count pending visits
        const pendingVisits = schedules.filter(s => 
          s.status?.toLowerCase() === "pending"
        );
        
        // Calculate upcoming visits
        const upcomingVisitsCount = schedules.filter(s => {
          try { 
            return s.visitDate && new Date(s.visitDate) > now;
          } catch (e) { 
            console.error("Error calculating upcoming visits:", e);
            return false; 
          }
        }).length;
        
        // Calculate completed visits
        const completedVisits = schedules.filter(s => 
          s.status?.toLowerCase() === "completed"
        );
        
        const stats = {
          totalVisits: schedules.length,
          pendingVisits: pendingVisits.length,
          approvedVisits: completedVisits.length,
        };
        
        setStats(stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to fetch dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "No date available";
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "No time specified";
    return timeString;
  };

  // Modal component for capacity management
  const CapacityManagementModal = () => {
    const [newCapacity, setNewCapacity] = useState(visitorCapacity.maxCapacity);

    const handleSubmit = async () => {
      const success = await updateVisitorCapacity(newCapacity);
      if (success) {
        setShowCapacityModal(false);
        refreshCapacity(); // Refresh capacity data after update
    }
  };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Manage Visitor Capacity
            </h2>
            <button
              onClick={() => setShowCapacityModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaInfoCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Setting the visitor capacity helps manage the number of visitors allowed per day.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Current visitor statistics:
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">Current Capacity</p>
                <p className="text-lg font-semibold">{visitorCapacity.maxCapacity}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">Approved Visitors</p>
                <p className="text-lg font-semibold">{visitorCapacity.approvedCount}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">Pending Requests</p>
                <p className="text-lg font-semibold">{visitorCapacity.pendingCount}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">Available Slots</p>
                <p className="text-lg font-semibold">
                  {Math.max(0, visitorCapacity.maxCapacity - visitorCapacity.approvedCount)}
                </p>
              </div>
            </div>
        </div>
        
          <div className="mb-6">
            <label htmlFor="capacity" className="block text-gray-700 text-sm font-medium mb-2">
              New Maximum Capacity:
            </label>
            <input
              type="number"
              id="capacity"
              value={newCapacity}
              onChange={(e) => setNewCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              min="1"
            />
            {newCapacity < visitorCapacity.approvedCount && (
              <p className="mt-2 text-sm text-red-600">
                Warning: New capacity is less than current approved visitors.
              </p>
            )}
        </div>
        
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={() => setShowCapacityModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleSubmit}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-4 ${isCollapsed ? "ml-16" : "ml-64"} transition-all duration-300`}>
      {/* Show capacity modal when needed */}
      {showCapacityModal && <CapacityManagementModal />}
      
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Welcome back, {userName}!
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Visits */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Total Visits</span>
                  <span className="text-2xl font-bold">{stats.totalVisits}</span>
                </div>
                <FaHistory className="text-blue-500 text-3xl" />
              </div>
            </div>

            {/* Pending Visits */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Pending Visits</span>
                  <span className="text-2xl font-bold">{stats.pendingVisits}</span>
                </div>
                <FaClock className="text-yellow-500 text-3xl" />
              </div>
            </div>

            {/* Approved Visits */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Approved Visits</span>
                  <span className="text-2xl font-bold">{stats.approvedVisits}</span>
                </div>
                <FaChartBar className="text-green-500 text-3xl" />
              </div>
            </div>
          </div>

          {/* Next visit reminder */}
          {nextVisit && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <FaCalendarAlt className="mr-2 text-teal-600" /> Next Scheduled Visit
              </h2>
              <div className="bg-teal-50 border border-teal-200 rounded-md p-4">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <p className="font-medium text-teal-800">
                      {nextVisit.inmateName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {formatDate(nextVisit.visitDate)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Time: {formatTime(nextVisit.visitTime)}
                    </p>
                    <p className="text-sm font-medium mt-2 flex items-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        nextVisit.status === "Approved" ? "bg-green-100 text-green-800" : 
                        nextVisit.status === "Pending" ? "bg-yellow-100 text-yellow-800" : 
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {nextVisit.status}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Link to={`/visitor-dashboard/visits/${nextVisit._id}`} className="text-teal-600 hover:text-teal-800 text-sm flex items-center">
                      View Details <FaChevronRight className="ml-1" />
        </Link>
      </div>
                </div>
              </div>
            </div>
          )}

          {/* Notices section - replaced with NoticeWidget */}
          <NoticeWidget 
            maxNotices={3}
            variant="card"
            dashboardType="visitor"
            showMarkAsRead={true}
            showViewAll={true}
            hideWhenUnauthenticated={true}
          />
        </div>

        {/* Right column */}
        <div className="col-span-1 space-y-6">
          {/* Guidelines slideshow */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
              <FaInfoCircle className="mr-2 text-teal-600" /> Visitation Guidelines
            </h2>
            <div className="overflow-hidden rounded-md">
              <Slide 
                easing="ease" 
                duration={5000} 
                indicators={true} 
                arrows={false}
                pauseOnHover={true}
              >
                {slideContent.map((slide, index) => (
                  <div key={index} className="relative h-64">
                    <div 
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${slide.image})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                        <h3 className="text-white font-semibold">{slide.title}</h3>
                        <p className="text-white/90 text-sm">{slide.description}</p>
                </div>
              </div>
            </div>
          ))}
        </Slide>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
              <FaList className="mr-2 text-teal-600" /> Quick Actions
            </h2>
            <ul className="divide-y divide-gray-200">
              <li>
                <Link 
                  to="/visitor-dashboard/schedule-visit" 
                  className="flex items-center py-2 px-1 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  <div className="bg-teal-100 p-2 rounded-full mr-3">
                    <FaCalendarAlt className="text-teal-600 text-sm" />
                  </div>
                  <span>Schedule a new visit</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/visitor-dashboard/visits" 
                  className="flex items-center py-2 px-1 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <FaHistory className="text-blue-600 text-sm" />
                  </div>
                  <span>View visit history</span>
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => setShowCapacityModal(true)}
                  className="flex items-center py-2 px-1 w-full text-left hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <FaUsers className="text-green-600 text-sm" />
                  </div>
                  <span>Manage Capacity</span>
                </button>
              </li>
              <li>
                <Link 
                  to="/visitor-dashboard/profile" 
                  className="flex items-center py-2 px-1 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  <div className="bg-purple-100 p-2 rounded-full mr-3">
                    <FaUser className="text-purple-600 text-sm" />
                  </div>
                  <span>Update profile</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/visitor-dashboard/help" 
                  className="flex items-center py-2 px-1 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  <div className="bg-amber-100 p-2 rounded-full mr-3">
                    <FaQuestion className="text-amber-600 text-sm" />
                  </div>
                  <span>Get help</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "Good Morning";
  } else if (hour < 18) {
    return "Good Afternoon";
  } else {
    return "Good Evening";
  }
}

// Wrap the component with VisitorCapacityProvider
const VisitorSummaryWithCapacity = () => (
  <VisitorCapacityProvider>
    <VisitorSummaryCard />
  </VisitorCapacityProvider>
);

export default VisitorSummaryWithCapacity;