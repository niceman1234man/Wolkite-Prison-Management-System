import Prisoner from "../model/Prisoner.js"; // Import the Prisoner model
import Transfer from "../model/Transfer.js"; // Import the Transfer model
import { validationResult } from "express-validator"; // For request validation

/**
 * @desc    Get daily intake report
 * @route   GET /api/reports/daily-intake
 * @access  Private (Admin, Inspector)
 */
export const getDailyIntakeReport = async (req, res) => {
  try {
    const { range } = req.query;
    let startDate, endDate;

    // Calculate date range based on the range parameter
    const now = new Date();
    switch (range) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        endDate = new Date();
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        endDate = new Date();
        break;
      default:
        // Default to last 7 days if no range specified
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
    }

    // Fetch prisoners within the date range
    const prisoners = await Prisoner.find({
      intakeDate: { $gte: startDate, $lte: endDate },
    });

    // Fetch transfers within the date range
    const transfers = await Transfer.find({
      transferDate: { $gte: startDate, $lte: endDate },
    });

    // Generate daily intake report
    const dailyIntakeReport = prisoners.map((prisoner) => ({
      date: prisoner.intakeDate.toISOString().split("T")[0],
      intakeCount: prisoners.filter(
        (p) =>
          p.intakeDate.toISOString().split("T")[0] ===
          prisoner.intakeDate.toISOString().split("T")[0]
      ).length,
      transferCount: transfers.filter(
        (t) =>
          t.transferDate.toISOString().split("T")[0] ===
          prisoner.intakeDate.toISOString().split("T")[0]
      ).length,
    }));

    // Remove duplicate dates
    const uniqueReport = dailyIntakeReport.filter(
      (report, index, self) =>
        index === self.findIndex((r) => r.date === report.date)
    );

    res.status(200).json({ success: true, dailyIntake: uniqueReport });
  } catch (error) {
    console.error("Error generating daily intake report:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to generate daily intake report",
      });
  }
};

/**
 * @desc    Get transfer statistics
 * @route   GET /api/reports/transfer-stats
 * @access  Private (Admin, Inspector)
 */
export const getTransferStatistics = async (req, res) => {
  try {
    const { range } = req.query;
    let startDate, endDate;

    // Calculate date range based on the range parameter
    const now = new Date();
    switch (range) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        endDate = new Date();
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        endDate = new Date();
        break;
      default:
        // Default to last 7 days if no range specified
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
    }

    // Fetch transfers within the date range
    const transfers = await Transfer.find({
      transferDate: { $gte: startDate, $lte: endDate },
    });

    // Calculate statistics
    const totalTransfers = transfers.length;
    const completedTransfers = transfers.filter(
      (t) => t.status === "Completed"
    ).length;
    const pendingTransfers = transfers.filter(
      (t) => t.status === "Pending"
    ).length;
    const inProgressTransfers = transfers.filter(
      (t) => t.status === "In Progress"
    ).length;
    const failedTransfers = transfers.filter(
      (t) => t.status === "Failed"
    ).length;

    const successRate = (completedTransfers / totalTransfers) * 100 || 0;
    const averageDelay =
      transfers.reduce((acc, t) => {
        const delay = t.actualTransferDate
          ? t.actualTransferDate - t.transferDate
          : 0;
        return acc + delay;
      }, 0) / totalTransfers || 0;

    // Check legal compliance (48-hour rule)
    const complianceStatus = transfers.every(
      (t) => t.actualTransferDate - t.transferDate <= 48 * 60 * 60 * 1000
    )
      ? "Compliant"
      : "Non-compliant";

    // Calculate trends (comparing with previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(
      previousStartDate.getDate() -
        (range === "week" ? 7 : range === "month" ? 30 : 365)
    );
    const previousEndDate = new Date(startDate);

    const previousTransfers = await Transfer.find({
      transferDate: { $gte: previousStartDate, $lte: previousEndDate },
    });

    const previousCompletedTransfers = previousTransfers.filter(
      (t) => t.status === "Completed"
    ).length;

    const prisonerTrend =
      ((completedTransfers - previousCompletedTransfers) /
        previousCompletedTransfers) *
        100 || 0;
    const transferRateTrend =
      ((totalTransfers - previousTransfers.length) / previousTransfers.length) *
        100 || 0;
    const processingTimeTrend = -10; // This would need more complex calculation
    const complianceTrend = 5; // This would need more complex calculation

    res.status(200).json({
      success: true,
      transferStats: {
        totalPrisoners: totalTransfers,
        successRate,
        averageDelay,
        complianceRate: (completedTransfers / totalTransfers) * 100 || 0,
        completedTransfers,
        pendingTransfers,
        inProgressTransfers,
        failedTransfers,
        complianceStatus,
        prisonerTrend,
        transferRateTrend,
        processingTimeTrend,
        complianceTrend,
      },
    });
  } catch (error) {
    console.error("Error generating transfer statistics:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to generate transfer statistics",
      });
  }
};

/**
 * @desc    Get legal compliance report
 * @route   GET /api/reports/legal-compliance
 * @access  Private (Admin, Inspector)
 */
export const getLegalComplianceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Start date and end date are required",
      });
    }

    // Fetch transfers within the date range
    const transfers = await Transfer.find({
      transferDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    // Check compliance with the 48-hour rule
    const compliantTransfers = transfers.filter(
      (t) => t.actualTransferDate - t.transferDate <= 48 * 60 * 60 * 1000
    );
    const nonCompliantTransfers = transfers.filter(
      (t) => t.actualTransferDate - t.transferDate > 48 * 60 * 60 * 1000
    );

    res.status(200).json({
      success: true,
      complianceReport: {
        compliantTransfers: compliantTransfers.length,
        nonCompliantTransfers: nonCompliantTransfers.length,
      },
    });
  } catch (error) {
    console.error("Error generating legal compliance report:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to generate legal compliance report",
      });
  }
};
