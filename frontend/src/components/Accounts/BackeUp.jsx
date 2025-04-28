import React, { useState, useEffect } from 'react';
import { useSelector } from "react-redux";
import { 
  FaDatabase, FaCloudUploadAlt, FaDownload, FaHistory, 
  FaCalendarAlt, FaLock, FaCog, FaCheck, FaSpinner, 
  FaClock, FaExclamationTriangle, FaSyncAlt
} from 'react-icons/fa';
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify';

const BackeUp = () => {
    const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [loading, setLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  const [backupMode, setBackupMode] = useState('incremental');
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    enabled: false,
    frequency: 'daily',
    time: '02:00',
    keepBackups: 7
  });
  useEffect(() => {
    fetchBackupHistory();
  }, []);

  const fetchBackupHistory = async () => {
    setLoading(true);
    try {
      console.log("Fetching backup history...");
      const response = await axiosInstance.get('/backup/history');
      console.log("Backup history response:", response.data);
      if(response.data){
        setBackupHistory(response.data);
      }
     
      setLoading(false);
    } catch (error) {
      console.error("Error fetching backup history:", error);
      toast.error("Failed to load backup history");
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    if (backupInProgress) return;
    
    setBackupInProgress(true);
    
    try {
      console.log("Creating backup with mode:", backupMode);
      const response = await axiosInstance.post('/backup/create', { 
        type: backupMode 
      });
      console.log("Backup creation response:", response.data);
      
      if (response.data.success) {
        toast.success(`${backupMode === 'full' ? 'Full' : 'Incremental'} backup completed successfully!`);
        fetchBackupHistory();
      } else {
        throw new Error(response.data.message || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error(`Failed to create ${backupMode} backup: ${error.message || "Unknown error"}`);
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleRestore = async (backupId) => {
    if (!window.confirm("WARNING: Restoring a backup will replace current data. This action cannot be undone. Are you sure you want to proceed?")) {
      return;
    }
    
    if (restoreInProgress) return;
    
    setRestoreInProgress(true);
    
    try {
      const response = await axiosInstance.post(`/backup/restore/${backupId}`);
      
      if (response.data.success) {
        toast.success("System restored successfully from backup!");
      } else {
        throw new Error(response.data.message || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error(`Failed to restore from backup: ${error.message || "Unknown error"}`);
    } finally {
      setRestoreInProgress(false);
    }
  };

  const handleDownload = async (backupId) => {
    try {
      const response = await axiosInstance.get(`/backup/download/${backupId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const backup = backupHistory.find(b => b._id === backupId);
      const fileName = backup ? 
        `prison_backup_${backup.type}_${new Date(backup.createdAt).toISOString().split('T')[0]}.zip` : 
        `prison_backup_${backupId}.zip`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.info("Backup download started");
    } catch (error) {
      console.error("Error downloading backup:", error);
      toast.error(`Failed to download backup: ${error.message || "Unknown error"}`);
    }
  };

  const saveScheduleConfig = async () => {
    try {
      const response = await axiosInstance.post('/backup/schedule', scheduleConfig);
      
      if (response.data.success) {
        toast.success("Backup schedule updated successfully!");
        setScheduleModalOpen(false);
      } else {
        throw new Error(response.data.message || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error(`Failed to update backup schedule: ${error.message || "Unknown error"}`);
    }
  };

  const fetchScheduleConfig = async () => {
    try {
      const response = await axiosInstance.get('/backup/schedule');
      setScheduleConfig(response.data);
    } catch (error) {
      console.error("Error fetching schedule config:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format size for display
  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

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
                System Backup & Recovery
              </h1>
              <p className="text-gray-500 mt-1">
                Manage database backups with incremental support for efficient recovery
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  fetchScheduleConfig();
                  setScheduleModalOpen(true);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <FaCalendarAlt className="mr-2" />
                Schedule
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
                    Backing Up...
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt className="mr-2" />
                    Create Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Backup Config */}
          <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-1">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaCog className="mr-2 text-teal-600" />
              Backup Configuration
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Backup Mode
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="incremental"
                    name="backupMode"
                    value="incremental"
                    checked={backupMode === "incremental"}
                    onChange={() => setBackupMode("incremental")}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="incremental" className="ml-2 block text-sm text-gray-700">
                    Incremental Backup
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Backs up only the changes since the last backup. Faster and more space-efficient.
                </p>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="full"
                    name="backupMode"
                    value="full"
                    checked={backupMode === "full"}
                    onChange={() => setBackupMode("full")}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="full" className="ml-2 block text-sm text-gray-700">
                    Full Backup
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Creates a complete backup of all system data. Recommended periodically.
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-4">
              <h3 className="text-sm font-medium text-blue-800 flex items-center mb-2">
                <FaLock className="mr-2" />
                Security & Encryption
              </h3>
              <p className="text-xs text-blue-700">
                All backups are automatically encrypted with AES-256 encryption to ensure data security.
              </p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800 flex items-center mb-2">
                <FaExclamationTriangle className="mr-2" />
                Backup Retention Policy
              </h3>
              <p className="text-xs text-yellow-700">
                The system keeps the last 7 daily backups, 4 weekly backups, and 3 monthly backups by default.
              </p>
            </div>
          </div>

          {/* Backup History */}
          <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaHistory className="mr-2 text-teal-600" />
                Backup History
              </h2>
              <button 
                onClick={fetchBackupHistory}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Refresh backup history"
              >
                <FaSyncAlt />
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-teal-600 text-2xl" />
              </div>
            ) : backupHistory.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FaDatabase className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No backups found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first system backup.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backupHistory.map((backup) => (
                      <tr key={backup._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">{formatDate(backup.createdAt)}</div>
                          <div className="text-gray-500 text-xs flex items-center mt-1">
                            <FaClock className="mr-1" /> {new Date(backup.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            backup.type === 'full' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {backup.type === 'full' ? 'Full' : 'Incremental'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatSize(backup.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            backup.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : backup.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {backup.status === 'completed' ? (
                              <><FaCheck className="mr-1" /> Complete</>
                            ) : backup.status === 'in_progress' ? (
                              <><FaSpinner className="mr-1 animate-spin" /> In Progress</>
                            ) : (
                              <><FaExclamationTriangle className="mr-1" /> Failed</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            {backup.status === 'completed' ? (
                              <>
                                <button
                                  onClick={() => handleDownload(backup._id)}
                                  className="text-blue-600 hover:text-blue-900 p-1 bg-blue-50 rounded"
                                  title="Download Backup"
                                >
                                  <FaDownload />
                                </button>
                                <button
                                  onClick={() => handleRestore(backup._id)}
                                  disabled={restoreInProgress}
                                  className={`p-1 rounded ${
                                    restoreInProgress 
                                      ? "text-gray-400 bg-gray-100 cursor-not-allowed" 
                                      : "text-teal-600 bg-teal-50 hover:text-teal-900 hover:bg-teal-100"
                                  }`}
                                  title="Restore from Backup"
                                >
                                  {restoreInProgress ? 
                                    <FaSpinner className="animate-spin" /> : 
                                    <FaSyncAlt />
                                  }
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500 italic">
                                {backup.status === 'in_progress' ? 'Processing...' : 'Failed'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recovery Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Understanding Incremental Backup & Recovery
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2">What is Incremental Backup?</h3>
              <p className="text-sm text-gray-600">
                Incremental backups save only the data that has changed since the previous backup.
                This makes the backup process faster and requires less storage space.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2">Recovery Process</h3>
              <p className="text-sm text-gray-600">
                To recover from incremental backups, the system restores the most recent full backup 
                first, then applies each incremental backup in sequence to restore the latest state.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2">Best Practices</h3>
              <p className="text-sm text-gray-600">
                Create a full backup weekly and incremental backups daily. Test your recovery
                process periodically to ensure your backup strategy is effective.
              </p>
            </div>
          </div>
        </div>

        {/* Disaster Recovery Guide */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaExclamationTriangle className="mr-2 text-amber-500" />
            System Crash & Disaster Recovery Guide
          </h2>
          
          <div className="border-l-4 border-amber-500 bg-amber-50 p-4 mb-6">
            <p className="text-sm text-amber-800">
              This guide helps you recover the system in case of a complete crash, data loss, or hardware failure. 
              Follow these steps carefully to restore your prison management system to a working state.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">1</span>
                System Reinstallation
              </h3>
              <p className="text-sm text-gray-600 ml-8">
                If necessary, reinstall the operating system and required software dependencies 
                (Node.js, MongoDB, etc.) on your server. Ensure that all system requirements are met.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">2</span>
                Application Redeployment
              </h3>
              <p className="text-sm text-gray-600 ml-8">
                Clone the application repository from your version control system (GitHub, GitLab, etc.) 
                or redeploy using your deployment pipeline. Install all dependencies using npm or yarn.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">3</span>
                Backup File Access
              </h3>
              <p className="text-sm text-gray-600 ml-8">
                Retrieve your most recent backup file from:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 ml-8 mt-2">
                <li>Local backup storage (if available)</li>
                <li>Cloud storage (if configured)</li>
                <li>External backup media (USB drive, external hard disk)</li>
                <li>Download from backup platform (if using external backup service)</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">4</span>
                Manual Restoration Process
              </h3>
              <p className="text-sm text-gray-600 ml-8">
                For a complete system crash, perform these steps:
              </p>
              <ol className="list-decimal list-inside text-sm text-gray-600 ml-8 mt-2">
                <li>Place your backup file in the server's restoration directory (default: <code>/backup/restore</code>)</li>
                <li>Run the restoration script: <code>npm run restore path/to/backup-file.zip</code></li>
                <li>The system will extract the backup and restore the database</li>
                <li>Restart the application server: <code>npm run restart</code></li>
                <li>Verify the restoration by logging in and checking critical data</li>
              </ol>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">5</span>
                Post-Recovery Verification
              </h3>
              <p className="text-sm text-gray-600 ml-8">
                After restoration, perform these essential checks:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 ml-8 mt-2">
                <li>Verify user accounts and permissions</li>
                <li>Check inmate records and critical data integrity</li>
                <li>Test key system functionalities (reporting, scheduling, etc.)</li>
                <li>Create a new full backup immediately after successful recovery</li>
                <li>Document the recovery process and any issues encountered</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 bg-teal-50 border border-teal-200 rounded-md p-4">
            <h3 className="font-medium text-teal-700 mb-2 flex items-center">
              <FaLock className="mr-2" />
              Need Technical Assistance?
            </h3>
            <p className="text-sm text-teal-600">
              For emergency recovery support, contact the system administrator or technical support team at:
              <br />
              <span className="font-medium">Email: </span>support@wolkiteprison.gov.et
              <br />
              <span className="font-medium">Emergency Phone: </span>+251 912 345 678
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaCalendarAlt className="mr-2 text-teal-600" />
              Schedule Automatic Backups
            </h2>
            
            <div className="mb-4">
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  name="enabled"
                  checked={scheduleConfig.enabled}
                  onChange={(e) => setScheduleConfig({
                    ...scheduleConfig,
                    enabled: e.target.checked
                  })}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Enable scheduled backups</span>
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                name="frequency"
                value={scheduleConfig.frequency}
                onChange={(e) => setScheduleConfig({
                  ...scheduleConfig,
                  frequency: e.target.value
                })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                disabled={!scheduleConfig.enabled}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                name="time"
                value={scheduleConfig.time}
                onChange={(e) => setScheduleConfig({
                  ...scheduleConfig,
                  time: e.target.value
                })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                disabled={!scheduleConfig.enabled}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keep Backups (days)
              </label>
              <input
                type="number"
                name="keepBackups"
                value={scheduleConfig.keepBackups}
                onChange={(e) => setScheduleConfig({
                  ...scheduleConfig,
                  keepBackups: parseInt(e.target.value)
                })}
                min="1"
                max="90"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                disabled={!scheduleConfig.enabled}
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveScheduleConfig}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackeUp;