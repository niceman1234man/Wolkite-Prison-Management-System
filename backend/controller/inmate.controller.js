import { Inmate } from "../model/inmate.model.js";
export const addnewInmate = async (req, res) => {
    try {
      // Handle FormData
      let inmateData = req.body;
      let photoUrl = null;
      
      // Check if the data comes from form-data with JSON string
      if (req.body.inmateData) {
        // Parse the JSON string into an object
        inmateData = JSON.parse(req.body.inmateData);
      }
      
      // Check if a file was uploaded
      if (req.file) {
        // The file path where multer stored the file
        photoUrl = `/uploads/inmates/${req.file.filename}`;
      }
      
      const {
          firstName,
          middleName,
          lastName,
            birthDate,
            age,
            motherName,
            gender,
            birthRegion,
            birthZone,
            birthWereda,
            birthKebele,
            currentRegion,
            currentZone,
            currentWereda,
            currentKebele,
            degreeLevel,
            work,
            nationality,
            religion,
            maritalStatus,
            height,
            hairType,
            face,
            foreHead,
            nose,
            eyeColor,
            teeth,
            lip,
            ear,
            specialSymbol,
            contactName,
            contactRegion,
            contactZone,
            contactWereda,
            contactKebele,
            phoneNumber,
            caseType,
            startDate,
            sentenceReason,
            sentenceYear,
            releasedDate,
            paroleDate,
            durationToParole,
            durationFromParoleToEnd
          } = inmateData;
          if (!firstName || !age || !gender) {
            return res.status(400).json("all fields required");
          }
          
          const newInmate= new Inmate({
            firstName,
            middleName,
            lastName,
            birthDate,
            age,
            motherName,
            gender,
            birthRegion,
            birthZone,
            birthWereda,
            birthKebele,
            currentRegion,
            currentZone,
            currentWereda,
            currentKebele,
            degreeLevel,
            work,
            nationality,
            religion,
            maritalStatus,
            height,
            hairType,
            face,
            foreHead,
            nose,
            eyeColor,
            teeth,
            lip,
            ear,
            specialSymbol,
            contactName,
            contactRegion,
            contactZone,
            contactWereda,
            contactKebele,
            phoneNumber,
            caseType,
            startDate,
            sentenceYear,
            sentenceReason,
            releasedDate,
            paroleDate,
            durationToParole,
            durationFromParoleToEnd,
            photo: photoUrl
          });
          await newInmate.save();
        
          return res.status(201).json({
            error: false,
            message: "New Inmate registered successfully",
          });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
          error: true,
          message: "Error adding inmate: " + error.message
        });
    }
 
};

export const getAllInmates = async (req, res) => {
  try {
    const inmates = await Inmate.find()

    if(!inmates){
      return res.json("inmate not found");
    }
    return res.status(200).json({ 
      success: true,
      message: "Inmates retrieved successfully", 
      inmates: inmates 
    });
  } catch (error) {
    console.error("Error fetching inmates:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to retrieve inmates",
      error: error.message
    });
  }
};


  export const updateInmate = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        firstName,
        middleName,
        lastName,
        birthDate,
        age,
        motherName,
        gender,
        birthRegion,
        birthZone,
        birthWereda,
        birthKebele,
        currentRegion,
        currentZone,
        currentWereda,
        currentKebele,
        degreeLevel,
        work,
        nationality,
        religion,
        maritalStatus,
        height,
        hairType,
        face,
        foreHead,
        nose,
        eyeColor,
        teeth,
        lip,
        ear,
        specialSymbol,
        contactName,
        contactRegion,
        contactZone,
        contactWereda,
        contactKebele,
        phoneNumber,
        caseType,
        startDate,
        sentenceReason,
        sentenceYear,
        releasedDate,
        paroleDate,
        durationToParole,
        durationFromParoleToEnd
      } = req.body;
  
      if (!firstName || !phoneNumber || !motherName || !age || !gender) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const updateInmate = await Inmate.findByIdAndUpdate(
        id,
        {
          firstName,
          middleName,
          lastName,
            birthDate,
            age,
            motherName,
            sentenceYear,
            gender,
            birthRegion,
            birthZone,
            birthWereda,
            birthKebele,
            currentRegion,
            currentZone,
            currentWereda,
            currentKebele,
            degreeLevel,
            work,
            nationality,
            religion,
            maritalStatus,
            height,
            hairType,
            face,
            foreHead,
            nose,
            eyeColor,
            teeth,
            lip,
            ear,
            specialSymbol,
            contactName,
            contactRegion,
            contactZone,
            contactWereda,
            contactKebele,
            phoneNumber,
            caseType,
            startDate,
            sentenceReason,
            releasedDate,
            paroleDate,
            durationToParole,
            durationFromParoleToEnd
        },
        { new: true }
      );
  
      if (!updateInmate) {
        return res.status(404).json({ message: "Inmate not found" });
      }
  
      res
        .status(200)
        .json({
          data: updateInmate,
          message: "Inmate information updated successfully",
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
  export const getInmate = async (req, res) => {
    try {
      const { id } = req.params;
      const inmateInfo = await Inmate.findOne({ _id: id });
      if (!inmateInfo) {
        return res.status(400).json({ message: "Inmate does not exist" });
      }
  
      res.status(200).json({ inmate: inmateInfo });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };

  export const deleteInmate = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedInmate = await Inmate.findByIdAndDelete(id);
  
      if (!deletedInmate) {
        return res.status(404).json({ message: "Inmate not found" });
      }
  
      res.status(200).json({ message: "Inmate deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
