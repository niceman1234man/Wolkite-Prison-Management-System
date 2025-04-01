import { WoredaInmate } from "../model/woredaInmate.model.js";
import { Transfer } from "../model/transfer.model.js";
import { Incident } from "../model/Incident.model.js";

/**
 * @desc    Get dashboard data
 * @route   GET /api/dashboard/data
 * @access  Private
 */
export const getDashboardData = async (req, res) => {
  try {
    // Get total prisoners
    const totalPrisoners = await WoredaInmate.countDocuments();

    // Get pending transfers
    const pendingTransfers = await Transfer.countDocuments({ status: "Pending" });

    // Get urgent cases (high risk inmates and incidents)
    const highRiskInmates = await WoredaInmate.countDocuments({ riskLevel: "High" });
    const urgentIncidents = await Incident.countDocuments({ status: "Urgent" });
    const urgentCases = highRiskInmates + urgentIncidents;

    // Get recent transfers
    const recentTransfers = await Transfer.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent incidents
    const recentIncidents = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalPrisoners,
        pendingTransfers,
        urgentCases,
        recentTransfers,
        recentIncidents,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data",
    });
  }
}; 