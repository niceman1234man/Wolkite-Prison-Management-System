import { Inmate } from "../model/inmate.model.js";
import { archiveItem } from '../controllers/archive.controller.js';

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
      
      // Log request body for debugging
      console.log("Update inmate request body:", req.body);
      
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
  
      // Check required fields with more detailed feedback
      const requiredFields = [
        { field: 'firstName', value: firstName },
        { field: 'lastName', value: lastName },
        { field: 'gender', value: gender },
        { field: 'birthDate', value: birthDate },
        { field: 'caseType', value: caseType },
        { field: 'startDate', value: startDate },
        { field: 'sentenceYear', value: sentenceYear }
      ];
      
      const missingFields = requiredFields
        .filter(item => !item.value)
        .map(item => item.field);
      
      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        return res.status(400).json({ 
          message: "All fields are required", 
          missingFields: missingFields 
        });
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
      console.error("Error in updateInmate:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
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
      
      // Find the inmate to check if it exists
      const inmate = await Inmate.findById(id);
  
      if (!inmate) {
        return res.status(404).json({ message: "Inmate not found" });
      }
      
      // Archive the inmate before deletion, if it hasn't been archived by middleware
      // The archiveMiddleware in the route should set req.archived to true
      if (!req.archived) {
        try {
          await archiveItem('inmate', inmate._id, req.user.id, 'Inmate deleted from system');
          console.log(`Inmate ${inmate.firstName} ${inmate.lastName} archived successfully`);
        } catch (archiveError) {
          console.error("Error archiving inmate:", archiveError);
          // Continue with deletion even if archiving fails
        }
      }
      
      // Now delete the inmate
      await inmate.deleteOne();
  
      res.status(200).json({ message: "Inmate deleted successfully" });
    } catch (error) {
      console.error("Error in deleteInmate:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  };
