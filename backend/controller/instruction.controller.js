import { Instruction } from "../model/instruction.model.js";


export const addInstruction = async (req, res) => {
  try {
    const { 
      // Case information
      courtCaseNumber,
      judgeName,
      prisonName,
      verdict,
      instructions,
      hearingDate,
      effectiveDate,
      sendDate,
      caseType,
      sentenceYear,
      
      // Personal information
      firstName,
      middleName,
      lastName,
      age,
      gender,
      birthdate,
      maritalStatus,
      nationality,
      educationLevel,
      occupation,
      
      // Birth address
      birthRegion,
      birthZone,
      birthWoreda,
      birthKebele,
      
      // Current address
      currentRegion,
      currentZone,
      currentWoreda,
      currentKebele
    } = req.body;
    
    // Handle file uploads
    let signatureFilename = null;
    let attachmentFilename = null;
    
    if (req.files) {
      if (req.files.signature && req.files.signature.length > 0) {
        signatureFilename = req.files.signature[0].filename;
      }
      
      if (req.files.attachment && req.files.attachment.length > 0) {
        attachmentFilename = req.files.attachment[0].filename;
      } else {
        return res.status(400).json({ message: "Attachment file is required" });
      }
    } else {
      return res.status(400).json({ message: "Attachment file is required" });
    }
  
    // Validate required fields
    if (!firstName || !lastName || !birthdate || !courtCaseNumber || !prisonName || 
        !instructions || !effectiveDate || !caseType || !sentenceYear) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const newInstruction = new Instruction({
      // Case information
      courtCaseNumber,
      judgeName,
      prisonName,
      verdict,
      instructions,
      hearingDate,
      effectiveDate,
      sendDate,
      caseType,
      sentenceYear: Number(sentenceYear),
      
      // Personal information
      firstName,
      middleName,
      lastName,
      age: Number(age),
      gender,
      birthdate,
      maritalStatus,
      nationality,
      educationLevel,
      occupation,
      
      // Birth address
      birthRegion,
      birthZone,
      birthWoreda,
      birthKebele,
      
      // Current address
      currentRegion,
      currentZone,
      currentWoreda,
      currentKebele,
      
      // Document paths
      signature: signatureFilename,
      attachment: attachmentFilename
    });

    await newInstruction.save();
    res.status(201).json({ success: true, message: "Instruction added successfully" });
  } catch (error) {
    console.error("Error in addInstruction:", error);
    res.status(500).json({ message: "Failed to add the Instruction", error: error.message });
  }
};


export const getAllInstruction = async (req, res) => {
  try {
    const instructions = await Instruction.find();
    if (!instructions) {
      return res.status(400).json({ message: "instruction does not exist" });
    }

    res.status(200).json({ instructions: instructions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateInstruction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { 
      // Case information
      courtCaseNumber,
      judgeName,
      prisonName,
      verdict,
      instructions,
      hearingDate,
      effectiveDate,
      sendDate,
      caseType,
      sentenceYear,
      
      // Personal information
      firstName,
      middleName,
      lastName,
      age,
      gender,
      birthdate,
      maritalStatus,
      nationality,
      educationLevel,
      occupation,
      
      // Birth address
      birthRegion,
      birthZone,
      birthWoreda,
      birthKebele,
      
      // Current address
      currentRegion,
      currentZone,
      currentWoreda,
      currentKebele
    } = req.body;
    
    // Handle file uploads
    let updateData = {
      // Case information
      courtCaseNumber,
      judgeName,
      prisonName,
      verdict,
      instructions,
      hearingDate,
      effectiveDate,
      sendDate,
      caseType,
      sentenceYear: Number(sentenceYear),
      
      // Personal information
      firstName,
      middleName,
      lastName,
      age: Number(age),
      gender,
      birthdate,
      maritalStatus,
      nationality,
      educationLevel,
      occupation,
      
      // Birth address
      birthRegion,
      birthZone,
      birthWoreda,
      birthKebele,
      
      // Current address
      currentRegion,
      currentZone,
      currentWoreda,
      currentKebele
    };

    // Handle file uploads if provided
    if (req.files) {
      if (req.files.signature && req.files.signature.length > 0) {
        updateData.signature = req.files.signature[0].filename;
      }
      
      if (req.files.attachment && req.files.attachment.length > 0) {
        updateData.attachment = req.files.attachment[0].filename;
      }
    }

    // Validate required fields
    if (!firstName || !lastName || !courtCaseNumber || !prisonName || !instructions || !hearingDate) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const updatedInstruction = await Instruction.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedInstruction) {
      return res.status(404).json({ message: "Instruction not found" });
    }

    res.status(200).json({ 
      success: true,
      data: updatedInstruction, 
      message: "Instruction updated successfully" 
    });
  } catch (error) {
    console.error("Error updating instruction:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const deleteInstruction = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInstruct = await Instruction.findByIdAndDelete(id);

    if (!deletedInstruct) {
      return res.status(404).json({ message: "Instruction not found" });
    }

    res.status(200).json({ message: "Instruction deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getInstruction = async (req, res) => {
  try {
    const { id } = req.params;
    const instruct = await Instruction.findOne({ _id: id });
    if (!instruct) {
      return res.status(400).json({ message: "instruction does not exist" });
    }

    res.status(200).json({ instruction: instruct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendInstruction = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the instruction and update its status
    const instruction = await Instruction.findById(id);
    
    if (!instruction) {
      return res.status(404).json({ message: "Instruction not found" });
    }
    
    // Update the status to 'sent'
    instruction.status = 'sent';
    await instruction.save();
    
    res.status(200).json({ 
      success: true, 
      message: "Instruction sent successfully", 
      instruction 
    });
  } catch (error) {
    console.error("Error sending instruction:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send instruction", 
      error: error.message 
    });
  }
};
 