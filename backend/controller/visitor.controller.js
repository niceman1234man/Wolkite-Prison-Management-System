import { Visitor } from "../model/visitor.model.js";


export const visitorInformation = async (req, res) => {
  try {

    const user= req.user
   const userId=user.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User ID not found" });
    }

    const { inmate, firstName, middleName, lastName, relation, purpose, phone, date } = req.body;

    if (!inmate || !firstName || !relation || !phone || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let visitor = await Visitor.findOne({ visitorId: userId });

    if (visitor) {
      visitor.inmate = inmate;
      visitor.firstName = firstName;
      visitor.middleName = middleName;
      visitor.lastName = lastName;
      visitor.relation = relation;
      visitor.purpose = purpose;
      visitor.phone = phone;
      visitor.date = new Date(date);
    } else {
      visitor = new Visitor({
        visitorId: userId, // Corrected
        inmate,
        firstName,
        middleName,
        lastName,
        relation,
        purpose,
        phone,
        date: new Date(date),
      });
    }

    await visitor.save();
    res.status(200).json({ visitor, message: "Visitor information saved successfully" });
  } catch (error) {
    console.error("Error in visitorInformation:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { inmate, visitorsName, relation, phone, date } = req.body;

    if (!inmate || !visitorsName || !relation || !phone || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      id,
      { inmate, visitorsName, relation, phone, date },
      { new: true} 
    );

    if (!updatedVisitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    res.status(200).json({ data: updatedVisitor, message: "Visitor information updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get All Visitors
export const allVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find();
    res.status(200).json({ visitors, message: "All Visitors" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete Visitor
export const deleteVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVisitor = await Visitor.findByIdAndDelete(id);

    if (!deletedVisitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    res.status(200).json({ message: "Visitor deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getVisitor = async (req, res) => {
  try {
    const {id}=req.params;
    const viistorInfo = await Visitor.findOne({ _id: id });
    if (!viistorInfo) {
      return res.status(400).json({ message: "Visitor does not exist" });
    }

    res.status(200).json({ visitor: viistorInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkFaceDuplicate = async (req, res) => {
  try {
    // The face descriptor will be sent as a Float32Array converted to a regular array
    const { faceDescriptor } = req.body;
    
    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid face descriptor data" 
      });
    }
    
    // Convert back to Float32Array for proper comparison
    const currentDescriptor = new Float32Array(faceDescriptor);
    
    // Get all visitors with face descriptors
    const visitors = await Visitor.find({ faceDescriptor: { $exists: true, $ne: null } });
    
    // No visitors with face data found
    if (!visitors || visitors.length === 0) {
      return res.status(200).json({ 
        success: true, 
        isDuplicate: false,
        message: "No existing visitors with face data found" 
      });
    }
    
    // Threshold for face similarity (adjust as needed)
    const SIMILARITY_THRESHOLD = 0.6; // 0.6 similarity or higher is considered a match
    
    // Check similarity with all visitors
    let duplicateFound = false;
    let duplicateVisitor = null;
    
    for (const visitor of visitors) {
      // Skip if no descriptor
      if (!visitor.faceDescriptor) continue;
      
      // Convert stored descriptor string to Float32Array
      const storedDescriptor = new Float32Array(JSON.parse(visitor.faceDescriptor));
      
      // Calculate euclidean distance (lower is more similar)
      const distance = calculateEuclideanDistance(currentDescriptor, storedDescriptor);
      
      // Convert distance to similarity score (0-1, higher is more similar)
      const similarity = Math.max(0, 1 - distance);
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        duplicateFound = true;
        duplicateVisitor = {
          id: visitor._id,
          name: `${visitor.firstName} ${visitor.middleName || ''} ${visitor.lastName}`.trim(),
          similarity: similarity.toFixed(2)
        };
        break;
      }
    }
    
    if (duplicateFound) {
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: "A visitor with a similar face already exists",
        duplicateVisitor
      });
    }
    
    return res.status(200).json({
      success: true,
      isDuplicate: false,
      message: "No duplicate face found"
    });
    
  } catch (error) {
    console.error("Error checking for duplicate face:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error while checking for duplicate faces" 
    });
  }
};

// Helper function to calculate euclidean distance between two descriptors
const calculateEuclideanDistance = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
    return 1; // Maximum distance if invalid input
  }
  
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
  }
  
  return Math.sqrt(sum);
};