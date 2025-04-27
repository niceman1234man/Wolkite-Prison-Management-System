import Prison from "../model/prison.model.js";
import { archiveItem } from '../controllers/archive.controller.js';

// Function to create test prison if none exist
const createTestPrison = async () => {
  try {
    const prisonCount = await Prison.countDocuments();
    if (prisonCount === 0) {
      const testPrison = new Prison({
        prison_name: "Central Prison",
        location: "Addis Ababa",
        description: "Main prison facility in Addis Ababa",
      });
      await testPrison.save();
      console.log("Test prison created successfully");
    }
  } catch (error) {
    console.error("Error creating test prison:", error);
  }
};

// Helper function to update prison population
export const updatePrisonPopulation = async (prisonId, change) => {
  try {
    if (!prisonId) {
      console.error("No prison ID provided for population update");
      return { success: false, error: "No prison ID provided" };
    }

    console.log(`Attempting to update prison ${prisonId} population by ${change}`);

    const prison = await Prison.findById(prisonId);
    if (!prison) {
      console.error(`Prison with ID ${prisonId} not found for population update`);
      return { success: false, error: "Prison not found" };
    }

    // Get current population and ensure it's a number
    let currentPopulation = prison.current_population || 0;
    if (typeof currentPopulation !== 'number') {
      console.log(`Converting current_population from ${typeof currentPopulation} to number`);
      currentPopulation = Number(currentPopulation) || 0;
    }

    console.log(`Current population for prison ${prison.prison_name}: ${currentPopulation}`);
    
    // Calculate new population
    const newPopulation = Math.max(0, currentPopulation + change);
    console.log(`Calculated new population: ${newPopulation}`);
    
    // Ensure new population doesn't exceed capacity
    if (newPopulation > prison.capacity) {
      console.warn(`Prison ${prison.prison_name} population (${newPopulation}) would exceed capacity (${prison.capacity})`);
      return { 
        success: false, 
        error: "Prison population would exceed capacity", 
        currentPopulation, 
        capacity: prison.capacity 
      };
    }

    // Update prison population
    prison.current_population = newPopulation;
    console.log(`Saving updated population for prison ${prison.prison_name}`);
    
    try {
      await prison.save();
      console.log(`Successfully updated prison ${prison.prison_name} population: ${currentPopulation} → ${newPopulation}`);
    } catch (saveError) {
      console.error(`Error saving prison ${prison.prison_name} after population update:`, saveError);
      return { success: false, error: `Error saving prison: ${saveError.message}` };
    }
    
    return { 
      success: true, 
      prison, 
      previousPopulation: currentPopulation, 
      newPopulation 
    };
  } catch (error) {
    console.error("Error updating prison population:", error);
    return { success: false, error: error.message };
  }
};

// Increment prison population by 1 or custom value
export const incrementPrisonPopulation = async (req, res) => {
  try {
    const { prisonId, increment = 1 } = req.body;
    
    if (!prisonId) {
      return res.status(400).json({
        success: false,
        error: "Prison ID is required"
      });
    }

    const result = await updatePrisonPopulation(prisonId, increment);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: "Prison population updated successfully",
      prison: result.prison
    });
  } catch (error) {
    console.error("Error incrementing prison population:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update prison population"
    });
  }
};

// Decrement prison population by 1 or custom value
export const decrementPrisonPopulation = async (req, res) => {
  try {
    const { prisonId, decrement = 1 } = req.body;
    
    if (!prisonId) {
      return res.status(400).json({
        success: false,
        error: "Prison ID is required"
      });
    }

    const result = await updatePrisonPopulation(prisonId, -decrement);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: "Prison population updated successfully",
      prison: result.prison
    });
  } catch (error) {
    console.error("Error decrementing prison population:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update prison population"
    });
  }
};

// Create new prison
export const createPrison = async (req, res) => {
  try {
    console.log("Received prison data:", req.body);

    const { prison_name, location, description, capacity } = req.body;

    // Validate required fields
    if (!prison_name || !location || !description || !capacity) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    // Check if prison with same name already exists
    const existingPrison = await Prison.findOne({ prison_name });
    if (existingPrison) {
      return res.status(400).json({
        success: false,
        error: "A prison with this name already exists",
      });
    }

    // Create new prison
    const prison = new Prison({
      prison_name,
      location,
      description,
      capacity: Number(capacity),
    });

    console.log("Saving prison:", prison);
    await prison.save();

    res.status(201).json({
      success: true,
      message: "Prison created successfully",
      prison,
    });
  } catch (error) {
    console.error("Error creating prison:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create prison",
    });
  }
};

// Get all prisons
export const getAllPrisons = async (req, res) => {
  try {
    console.log("Fetching all prisons...");
    console.log("Checking for existing prisons...");
    const prisonCount = await Prison.countDocuments();
    console.log("Prison count:", prisonCount);

    // Check and create test prison if none exist
    if (prisonCount === 0) {
      console.log("No prisons found, creating test prison...");
      await createTestPrison();
    }

    console.log("Querying all prisons...");
    const prisons = await Prison.find();
    console.log("Found prisons:", prisons);

    if (!prisons || prisons.length === 0) {
      console.log("No prisons found after query");
      return res.status(200).json({
        success: true,
        prisons: [],
        message: "No prisons found",
      });
    }

    console.log("Sending response with", prisons.length, "prisons");
    res.status(200).json({
      success: true,
      prisons,
      message: "Prisons fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching prisons:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Failed to fetch prisons",
      details: error.message,
    });
  }
};

// Get single prison by ID
export const getPrisonById = async (req, res) => {
  try {
    const prison = await Prison.findById(req.params.id);

    if (!prison) {
      return res.status(404).json({
        success: false,
        error: "Prison not found",
      });
    }

    res.status(200).json({
      success: true,
      prison,
    });
  } catch (error) {
    console.error("Error fetching prison:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch prison",
    });
  }
};

// Update prison
export const updatePrison = async (req, res) => {
  try {
    const { prison_name, location, description, capacity, status } = req.body;
    const prison = await Prison.findById(req.params.id);

    if (!prison) {
      return res.status(404).json({
        success: false,
        error: "Prison not found",
      });
    }

    // Check if new name conflicts with existing prison
    if (prison_name && prison_name !== prison.prison_name) {
      const existingPrison = await Prison.findOne({ prison_name });
      if (existingPrison) {
        return res.status(400).json({
          success: false,
          error: "A prison with this name already exists",
        });
      }
    }

    // Update fields
    if (prison_name) prison.prison_name = prison_name;
    if (location) prison.location = location;
    if (description) prison.description = description;
    if (capacity) prison.capacity = Number(capacity);
    if (status) prison.status = status;

    await prison.save();

    res.status(200).json({
      success: true,
      message: "Prison updated successfully",
      prison,
    });
  } catch (error) {
    console.error("Error updating prison:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update prison",
    });
  }
};

// Delete prison
export const deletePrison = async (req, res) => {
  try {
    const prison = await Prison.findById(req.params.id);

    if (!prison) {
      return res.status(404).json({
        success: false,
        error: "Prison not found",
      });
    }

    // Check if prison has inmates - strict validation
    let currentPopulation = prison.current_population;
    
    // Ensure it's a number for comparison
    if (typeof currentPopulation !== 'number') {
      currentPopulation = Number(currentPopulation || 0);
    }
    
    console.log(`Attempting to delete prison ${prison.prison_name} with population: ${currentPopulation}`);
    
    if (currentPopulation > 0) {
      console.error(`Cannot delete prison ${prison.prison_name} with existing inmates (${currentPopulation})`);
      return res.status(400).json({
        success: false,
        error: "Cannot delete prison with existing inmates. Transfer all inmates to another prison first.",
        currentPopulation
      });
    }

    // Archive the prison before deletion
    try {
      await archiveItem('prison', prison._id, req.user.id, 'Prison deleted by inspector');
      console.log(`Prison ${prison.prison_name} archived successfully`);
    } catch (archiveError) {
      console.error("Error archiving prison:", archiveError);
      // Continue with deletion even if archiving fails
    }

    console.log(`Deleting prison ${prison.prison_name}`);
    await prison.deleteOne();

    res.status(200).json({
      success: true,
      message: "Prison deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting prison:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete prison",
    });
  }
};
