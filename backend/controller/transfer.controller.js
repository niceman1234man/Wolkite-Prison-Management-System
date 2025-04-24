import { Transfer } from '../model/transfer.model.js'

// Create Transfer Request
export const addNewTransfer = async (req, res) => {
    try {
        console.log("Received transfer request:", req.body);
        
        // Validate required fields
        if (!req.body.inmateId || !req.body.fromPrison || !req.body.toPrison || !req.body.reason) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const transfer = new Transfer(req.body);
        await transfer.save();

        return res.status(201).json({
            success: true,
            message: "Transfer request created successfully",
            data: transfer
        });
    } catch (error) {
        console.error("Error creating transfer:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating transfer request",
            error: error.message
        });
    }
};

// Get All Transfers
export const AllTransfers = async (req, res) => {
    try {
        const transfers = await Transfer.find()
            .populate('inmateId', 'firstName lastName middleName')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: transfers
        });
    } catch (error) {
        console.error("Error fetching transfers:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching transfers",
            error: error.message
        });
    }
};

// Get Single Transfer
export const getTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const transfer = await Transfer.findById(id)
            .populate('inmateId', 'firstName lastName middleName');

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: transfer
        });
    } catch (error) {
        console.error("Error fetching transfer:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching transfer",
            error: error.message
        });
    }
};

// Update Transfer
export const updateTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const transfer = await Transfer.findByIdAndUpdate(id, req.body, { new: true });

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Transfer updated successfully",
            data: transfer
        });
    } catch (error) {
        console.error("Error updating transfer:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating transfer",
            error: error.message
        });
    }
};

// Delete Transfer
export const deleteTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const transfer = await Transfer.findByIdAndDelete(id);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Transfer deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting transfer:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting transfer",
            error: error.message
        });
    }
};

// Cancel Transfer Request
export const cancelTransfer = async (req, res) => {
    try {
        const transferId = req.params.id;
        console.log("Attempting to cancel transfer with ID:", transferId);
        
        // Find the transfer
        const transfer = await Transfer.findById(transferId);
        console.log("Found transfer:", transfer);
        
        if (!transfer) {
            console.log("Transfer not found with ID:", transferId);
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        // Update transfer status to cancelled
        transfer.status = "Cancelled"; // Changed to match the case used in frontend
        transfer.updatedAt = new Date();
        
        // Save the updated transfer
        const updatedTransfer = await transfer.save();
        console.log("Successfully cancelled transfer:", updatedTransfer);

        return res.status(200).json({
            success: true,
            message: "Transfer cancelled successfully",
            data: updatedTransfer
        });
    } catch (error) {
        console.error("Error in cancelTransfer:", error);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack
        });
        
        return res.status(500).json({
            success: false,
            message: "Internal server error while cancelling transfer",
            error: error.message
        });
    }
};

// Approve a transfer request
export const approveTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Approving transfer with ID: ${id}`);
    
    const transfer = await Transfer.findById(id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: "Transfer request not found"
      });
    }
    
    // Update the transfer status
    transfer.status = "Approved";
    await transfer.save();
    
    // Update prison populations
    try {
      const { fromPrison, toPrison } = transfer;
      
      console.log(`Transfer approved. Updating populations for prisons: 
        From: ${fromPrison} 
        To: ${toPrison}`);
      
      // Import the updatePrisonPopulation function (assuming it's exported from prison.controller.js)
      const { updatePrisonPopulation } = await import("./prison.controller.js");
      
      // Decrement source prison population
      if (fromPrison) {
        const decrementResult = await updatePrisonPopulation(fromPrison, -1);
        if (!decrementResult.success) {
          console.error(`Failed to decrement source prison population: ${decrementResult.error}`);
        } else {
          console.log(`Successfully decremented source prison population`);
        }
      }
      
      // Increment destination prison population
      if (toPrison) {
        const incrementResult = await updatePrisonPopulation(toPrison, 1);
        if (!incrementResult.success) {
          console.error(`Failed to increment destination prison population: ${incrementResult.error}`);
        } else {
          console.log(`Successfully incremented destination prison population`);
        }
      }
    } catch (populationError) {
      console.error("Error updating prison populations:", populationError);
      // Still continue with the transfer approval, just log the error
    }
    
    res.status(200).json({
      success: true,
      message: "Transfer request approved successfully",
      data: transfer
    });
  } catch (error) {
    console.error("Error approving transfer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve transfer request"
    });
  }
};
