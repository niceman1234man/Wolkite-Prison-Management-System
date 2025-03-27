import { ParoleTracking } from "../model/parole.model.js";

export const addBehaviorLog = async (req, res) => {
  try {
    const { inmateId } = req.params;
    const {
      fullName,
      age,
      gender,
      behaviorLogs,
      committeeNames,
      caseType,
      startDate,
      releasedDate,
      paroleDate,
      sentenceYear,
      durationToParole,
      durationFromParoleToEnd
    } = req.body;

    // Validate input

    // Get file paths for signatures
    const signature1 = req.files?.signature1?.[0]?.filename;
    const signature2 = req.files?.signature2?.[0]?.filename;
    const signature3 = req.files?.signature3?.[0]?.filename;
    const signature4 = req.files?.signature4?.[0]?.filename;
    const signature5 = req.files?.signature5?.[0]?.filename;

    console.log("Signature Paths:", [
      signature1,
      signature2,
      signature3,
      signature4,
      signature5,
    ]);
    let parsedbehaviorLogs = JSON.parse(behaviorLogs);
    
    const logsToSave = parsedbehaviorLogs.map((log) => ({
      rule: log.behaviorType,
      points: log.points,
      date: new Date(), 
    }));

    console.log("Behavior Logs to Save:", logsToSave);

  
    let paroleTracking = await ParoleTracking.findOne({ inmateId });

    if (paroleTracking) {
      // Update existing record
      paroleTracking.fullName = fullName;
      paroleTracking.age = age;
      paroleTracking.gender = gender;
      paroleTracking.caseType = caseType;
      paroleTracking.startDate = startDate;
      paroleTracking.releasedDate = releasedDate;
      paroleTracking.paroleDate = paroleDate;
      paroleTracking.sentenceYear = sentenceYear;
      paroleTracking.durationToParole = durationToParole;
      paroleTracking.durationFromParoleToEnd = durationFromParoleToEnd;
      paroleTracking.behaviorLogs.push(...logsToSave);
      paroleTracking.committeeNames = committeeNames;
      paroleTracking.signatures = [
        signature1,
        signature2,
        signature3,
        signature4,
        signature5,
      ].filter(Boolean);
    } else {
      // Create new record
      paroleTracking = new ParoleTracking({
        inmateId,
        fullName,
        age,
        gender,
        caseType,
        startDate,
        releasedDate,
        paroleDate,
        sentenceYear,
        durationToParole,
        durationFromParoleToEnd,
        behaviorLogs: logsToSave,
        committeeNames,
        signatures: [signature1, signature2, signature3, signature4, signature5].filter(Boolean)
      });
    }

    await paroleTracking.calculatePoints();

    //
    await paroleTracking.save();

    console.log("ParoleTracking record saved successfully:", paroleTracking);

    res.status(201).json({
      success: true,
      message: "Behavior log submitted successfully!",
      data: paroleTracking,
    });
  } catch (error) {
    console.error("Error in addBehaviorLog:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllParoleRecords = async (req, res) => {
  try {
    const records = await ParoleTracking.find();
    if (!records) return res.json("Parole does not found");
    res.status(200).json({ parole: records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export const getParoleRecord = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const inmateInfo = await Inmate.findOne({ _id: id });
//     if (!inmateInfo) {
//       return res.status(400).json({ message: "Inmate does not exist" });
//     }

//     res.status(200).json({ inmate: inmateInfo });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const getParoleRecordById = async (req, res) => {
  const { inmateId } = req.params;
  try {
    const paroleTracking = await ParoleTracking.findOne({ inmateId });

    if (!paroleTracking) {
      return res
        .status(404)
        .json({ message: "Parole tracking record not found" });
    }

    res.status(200).json({ parole: paroleTracking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const deleteParoleRecord = async (req, res) => {
  try {
    const paroleTracking = await ParoleTracking.findById(req.params.inmateId);
    if (!paroleTracking) {
      return res
        .status(404)
        .json({ message: "Parole tracking record not found" });
    }
    await paroleTracking.deleteOne();
    res.status(200).json({ message: "Parole tracking record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
