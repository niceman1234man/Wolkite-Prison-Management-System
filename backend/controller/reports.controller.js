import WoredaInmate from "../model/woredaInmate.model.js";
import Transfer from "../model/transfer.model.js";

// Get daily intake data
export const getDailyIntake = async (req, res) => {
  try {
    const { range = "week" } = req.query;
    const now = new Date();
    let startDate = new Date();

    // Calculate start date based on range
    switch (range) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get daily intake data
    const dailyIntake = await WoredaInmate.aggregate([
      {
        $match: {
          intakeDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$intakeDate" } },
          intakeCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get daily transfer data
    const dailyTransfers = await Transfer.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          transferCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Combine intake and transfer data
    const combinedData = dailyIntake.map(intake => {
      const transfer = dailyTransfers.find(t => t._id === intake._id);
      return {
        date: intake._id,
        intakeCount: intake.intakeCount,
        transferCount: transfer ? transfer.transferCount : 0
      };
    });

    res.status(200).json({
      success: true,
      dailyIntake: combinedData
    });
  } catch (error) {
    console.error("Error fetching daily intake data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch daily intake data"
    });
  }
};

// Get transfer statistics
export const getTransferStats = async (req, res) => {
  try {
    const { range = "week" } = req.query;
    const now = new Date();
    let startDate = new Date();

    // Calculate start date based on range
    switch (range) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get total prisoners
    const totalPrisoners = await WoredaInmate.countDocuments();

    // Get transfer statistics
    const transfers = await Transfer.find({
      createdAt: { $gte: startDate }
    });

    // Calculate transfer statistics
    const completedTransfers = transfers.filter(t => t.status === "Completed").length;
    const pendingTransfers = transfers.filter(t => t.status === "Pending").length;
    const inProgressTransfers = transfers.filter(t => t.status === "In Progress").length;
    const failedTransfers = transfers.filter(t => t.status === "Failed").length;

    // Calculate success rate
    const successRate = transfers.length > 0 
      ? (completedTransfers / transfers.length) * 100 
      : 0;

    // Calculate average processing time
    const completedTransfersWithTime = transfers.filter(t => 
      t.status === "Completed" && t.completedAt
    );

    const averageDelay = completedTransfersWithTime.length > 0
      ? completedTransfersWithTime.reduce((acc, curr) => {
          const processingTime = new Date(curr.completedAt) - new Date(curr.createdAt);
          return acc + processingTime;
        }, 0) / (completedTransfersWithTime.length * 1000 * 60 * 60) // Convert to hours
      : 0;

    // Calculate compliance rate (transfers completed within 48 hours)
    const compliantTransfers = completedTransfersWithTime.filter(t => {
      const processingTime = new Date(t.completedAt) - new Date(t.createdAt);
      return processingTime <= 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    });

    const complianceRate = completedTransfersWithTime.length > 0
      ? (compliantTransfers.length / completedTransfersWithTime.length) * 100
      : 0;

    // Determine overall compliance status
    const complianceStatus = complianceRate >= 90 ? "Compliant" : "Non-compliant";

    res.status(200).json({
      success: true,
      transferStats: {
        totalPrisoners,
        successRate: Math.round(successRate),
        averageDelay: Math.round(averageDelay),
        complianceRate: Math.round(complianceRate),
        completedTransfers,
        pendingTransfers,
        inProgressTransfers,
        failedTransfers,
        complianceStatus
      }
    });
  } catch (error) {
    console.error("Error fetching transfer statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transfer statistics"
    });
  }
}; 