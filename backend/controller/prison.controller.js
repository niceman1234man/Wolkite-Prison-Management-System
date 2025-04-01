import Prison from "../model/prison.model.js";

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

    // Check if prison has inmates
    if (prison.current_population > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete prison with existing inmates",
      });
    }

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
