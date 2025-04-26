import { ParoleCommittee } from "../model/paroleCommittee.model.js";
import { User } from "../model/user.model.js";

// Get current active parole committee
export const getParoleCommitteeMembers = async (req, res) => {
  try {
    // Find the most recent active committee
    const committee = await ParoleCommittee.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .populate({
        path: "members",
        select: "firstName lastName email phone prison role",
        populate: {
          path: "prison",
          select: "prison_name"
        }
      });

    if (!committee) {
      return res.status(404).json({
        message: "No active parole committee found",
        members: []
      });
    }

    return res.status(200).json({
      message: "Parole committee members retrieved successfully",
      members: committee.members,
      committee
    });
  } catch (error) {
    console.error("Error fetching parole committee:", error);
    return res.status(500).json({
      message: "Error retrieving parole committee members",
      error: error.message
    });
  }
};

// Save new parole committee
export const saveParoleCommittee = async (req, res) => {
  try {
    const { members } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!members || !Array.isArray(members) || members.length !== 5) {
      return res.status(400).json({
        message: "Please select exactly 5 committee members"
      });
    }

    // Verify all members are valid police officers
    const officers = await User.find({
      _id: { $in: members },
      role: "police-officer"
    });

    if (officers.length !== 5) {
      return res.status(400).json({
        message: "One or more selected members are not valid police officers"
      });
    }

    // Deactivate previous committees
    await ParoleCommittee.updateMany(
      { isActive: true },
      { isActive: false, lastUpdated: new Date() }
    );

    // Create new committee
    const newCommittee = new ParoleCommittee({
      members,
      createdBy: userId,
      lastUpdated: new Date(),
      isActive: true
    });

    await newCommittee.save();

    return res.status(201).json({
      message: "Parole committee saved successfully",
      committee: newCommittee
    });
  } catch (error) {
    console.error("Error saving parole committee:", error);
    return res.status(500).json({
      message: "Error saving parole committee",
      error: error.message
    });
  }
};

// Get all police officers (for committee selection)
export const getPoliceOfficers = async (req, res) => {
  try {
    const officers = await User.find({ 
      role: "police-officer",
      isActive: true
    })
    .select("firstName lastName email phone prison role")
    .populate("prison", "prison_name");

    return res.status(200).json({
      message: "Police officers retrieved successfully",
      officers
    });
  } catch (error) {
    console.error("Error fetching police officers:", error);
    return res.status(500).json({
      message: "Error retrieving police officers",
      error: error.message
    });
  }
}; 