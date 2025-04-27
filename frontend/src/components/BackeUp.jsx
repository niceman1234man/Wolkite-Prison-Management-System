import { 
  FaDatabase, FaCloudUploadAlt, FaDownload, FaHistory, 
  FaCalendarAlt, FaLock, FaCog, FaCheck, FaSpinner, 
  FaClock, FaExclamationTriangle, FaSyncAlt
} from 'react-icons/fa';
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify';
import LanguageSelector from '../components/common/LanguageSelector';
import { T } from '../components/common/TranslatedText';

const BackeUp = () => {
    const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  // ... existing code ...

  return (
    <div className={`p-4 md:p-6 transition-all duration-300 mt-10 bg-gray-50 min-h-screen ${
        isCollapsed ? "ml-16" : "ml-64"
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FaDatabase className="mr-3 text-teal-600" />
                <T>System Backup & Recovery</T>
              </h1>
              <p className="text-gray-500 mt-1">
                <T>Manage database backups with incremental support for efficient recovery</T>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <LanguageSelector darkMode={false} showLabel={true} />
              <button
                onClick={() => {
                  fetchScheduleConfig();
                  setScheduleModalOpen(true);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <FaCalendarAlt className="mr-2" />
                <T>Schedule</T>
              </button>
              <button
                onClick={handleBackup}
                disabled={backupInProgress}
                className={`px-4 py-2 rounded-md text-white flex items-center justify-center ${
                  backupInProgress
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                {backupInProgress ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    <T>Backing Up...</T>
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt className="mr-2" />
                    <T>Create Backup</T>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
// ... rest of the existing code ...
      </div>
    </div>
  );
};

export default BackeUp; 