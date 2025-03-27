import { WoredaInmate } from "../model/woredaInmate.model.js";

/**
 * @desc    Get woreda statistics
 * @route   GET /api/woreda/stats
 * @access  Private (Woreda Admin)
 */
export const getWoredaStats = async (req, res) => {
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

    // Fetch inmates within the date range
    const inmates = await WoredaInmate.find({
      intakeDate: { $gte: startDate, $lte: endDate },
    });

    // Calculate statistics
    const totalInmates = inmates.length;
    const activeInmates = inmates.filter((i) => i.status === "Active").length;
    const transferRequested = inmates.filter(
      (i) => i.status === "TransferRequested"
    ).length;
    const transferred = inmates.filter((i) => i.status === "Transferred").length;
    const maleInmates = inmates.filter((i) => i.gender === "male").length;
    const femaleInmates = inmates.filter((i) => i.gender === "female").length;
    const highRiskInmates = inmates.filter((i) => i.riskLevel === "High").length;
    const mediumRiskInmates = inmates.filter(
      (i) => i.riskLevel === "Medium"
    ).length;
    const lowRiskInmates = inmates.filter((i) => i.riskLevel === "Low").length;
    const inmatesWithMedicalConditions = inmates.filter(
      (i) => i.medicalConditions && i.medicalConditions.length > 0
    ).length;
    const paroleEligible = inmates.filter((i) => i.paroleEligibility).length;

    // Calculate average sentence length
    const averageSentenceLength = inmates.reduce((acc, inmate) => {
      const start = new Date(inmate.sentenceStart);
      const end = new Date(inmate.sentenceEnd);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return acc + diffDays;
    }, 0) / totalInmates || 0;

    // Get top crimes
    const crimeCounts = inmates.reduce((acc, inmate) => {
      acc[inmate.crime] = (acc[inmate.crime] || 0) + 1;
      return acc;
    }, {});

    const topCrimes = Object.entries(crimeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate trends (comparing with previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(
      previousStartDate.getDate() -
        (range === "week" ? 7 : range === "month" ? 30 : 365)
    );
    const previousEndDate = new Date(startDate);

    const previousInmates = await WoredaInmate.find({
      intakeDate: { $gte: previousStartDate, $lte: previousEndDate },
    });

    const inmateTrend =
      ((totalInmates - previousInmates.length) / previousInmates.length) * 100 || 0;
    const riskTrend =
      ((highRiskInmates - previousInmates.filter((i) => i.riskLevel === "High").length) /
        previousInmates.filter((i) => i.riskLevel === "High").length) *
        100 || 0;
    const genderTrend =
      ((maleInmates - previousInmates.filter((i) => i.gender === "male").length) /
        previousInmates.filter((i) => i.gender === "male").length) *
        100 || 0;
    const medicalTrend =
      ((inmatesWithMedicalConditions -
        previousInmates.filter((i) => i.medicalConditions && i.medicalConditions.length > 0)
          .length) /
        previousInmates.filter((i) => i.medicalConditions && i.medicalConditions.length > 0)
          .length) *
        100 || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalInmates,
        activeInmates,
        transferRequested,
        transferred,
        maleInmates,
        femaleInmates,
        highRiskInmates,
        mediumRiskInmates,
        lowRiskInmates,
        inmatesWithMedicalConditions,
        paroleEligible,
        averageSentenceLength,
        totalCrimes: Object.keys(crimeCounts).length,
        topCrimes,
        inmateTrend,
        riskTrend,
        genderTrend,
        medicalTrend,
      },
    });
  } catch (error) {
    console.error("Error generating woreda statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate woreda statistics",
    });
  }
}; 