// controllers/projectCostController.js
import ProjectCost from '../models/ProjectCost.js';

// Add project cost (replace existing cost for the project)
export const addProjectCost = async (req, res) => {
  try {
    const { projectKey, cost } = req.body;

    if (!projectKey || typeof cost !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: 'Project key and cost are required' 
      });
    }

    // Check if cost entry already exists for this project
    const existingCost = await ProjectCost.findOne({ projectKey });

    // Check if recurring costs exist - if yes, don't allow fixed cost
    if (existingCost && existingCost.recurringCosts.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot add fixed cost when recurring costs exist. Please remove all recurring costs first.' 
      });
    }

    let costEntry;
    if (existingCost) {
      // Update existing entry
      existingCost.cost = cost;
      existingCost.createdAt = new Date(); // Update timestamp
      costEntry = await existingCost.save();
    } else {
      // Create new entry
      costEntry = new ProjectCost({ projectKey, cost });
      await costEntry.save();
    }

    res.status(201).json({ 
      success: true,
      message: 'Cost added successfully', 
      data: costEntry 
    });
  } catch (error) {
    console.error('Error adding cost:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
};

// Add recurring cost to project
export const addRecurringCost = async (req, res) => {
  try {
    const { projectKey } = req.params;
    const { title, amount } = req.body;

    if (!projectKey || !title || typeof amount !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: 'Project key, title, and amount are required' 
      });
    }

    // Find or create project cost entry
    let costEntry = await ProjectCost.findOne({ projectKey });
    
    if (!costEntry) {
      costEntry = new ProjectCost({ 
        projectKey, 
        cost: 0,
        recurringCosts: []
      });
    }

    // Check if fixed cost exists - if yes, don't allow recurring costs
    if (costEntry.cost > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot add recurring costs when fixed cost exists. Please remove fixed cost first.' 
      });
    }

    // Add new recurring cost
    costEntry.recurringCosts.push({
      title,
      amount,
      createdAt: new Date()
    });

    await costEntry.save();

    res.status(201).json({ 
      success: true,
      message: 'Recurring cost added successfully', 
      data: costEntry 
    });
  } catch (error) {
    console.error('Error adding recurring cost:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
};

// Update recurring cost
export const updateRecurringCost = async (req, res) => {
  try {
    const { projectKey, recurringCostId } = req.params;
    const { title, amount } = req.body;

    if (!projectKey || !recurringCostId || !title || typeof amount !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: 'Project key, recurring cost ID, title, and amount are required' 
      });
    }

    const costEntry = await ProjectCost.findOne({ projectKey });
    
    if (!costEntry) {
      return res.status(404).json({ 
        success: false,
        message: 'Project cost entry not found' 
      });
    }

    // Find and update the recurring cost
    const recurringCost = costEntry.recurringCosts.id(recurringCostId);
    if (!recurringCost) {
      return res.status(404).json({ 
        success: false,
        message: 'Recurring cost not found' 
      });
    }

    recurringCost.title = title;
    recurringCost.amount = amount;
    recurringCost.createdAt = new Date();

    await costEntry.save();

    res.status(200).json({ 
      success: true,
      message: 'Recurring cost updated successfully', 
      data: costEntry 
    });
  } catch (error) {
    console.error('Error updating recurring cost:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
};

// Delete recurring cost
export const deleteRecurringCost = async (req, res) => {
  try {
    const { projectKey, recurringCostId } = req.params;

    if (!projectKey || !recurringCostId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project key and recurring cost ID are required' 
      });
    }

    const costEntry = await ProjectCost.findOne({ projectKey });
    
    if (!costEntry) {
      return res.status(404).json({ 
        success: false,
        message: 'Project cost entry not found' 
      });
    }

    // Remove the recurring cost using pull method
    costEntry.recurringCosts.pull(recurringCostId);
    await costEntry.save();

    res.status(200).json({ 
      success: true,
      message: 'Recurring cost deleted successfully', 
      data: costEntry 
    });
  } catch (error) {
    console.error('Error deleting recurring cost:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
};

// Get project cost by project key (get single cost entry with recurring costs)
export const getProjectCost = async (req, res) => {
  try {
    const { projectKey } = req.params;

    if (!projectKey) {
      return res.status(400).json({ 
        success: false,
        message: 'Project key is required' 
      });
    }

    // Get the cost entry for this project
    const costEntry = await ProjectCost.findOne({ projectKey });

    if (!costEntry) {
      return res.status(200).json({ 
        success: true,
        data: {
          projectKey,
          totalCost: 0,
          recurringCosts: [],
          totalRecurringCost: 0
        }
      });
    }

    // Calculate total recurring cost
    const totalRecurringCost = costEntry.recurringCosts.reduce((sum, item) => sum + item.amount, 0);

    res.status(200).json({ 
      success: true,
      data: {
        projectKey: costEntry.projectKey,
        totalCost: costEntry.cost + totalRecurringCost, // Combined total
        baseCost: costEntry.cost,
        recurringCosts: costEntry.recurringCosts,
        totalRecurringCost,
        createdAt: costEntry.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching project cost:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
};

// Get all project costs (get latest cost for each project)
export const getAllProjectCosts = async (req, res) => {
  try {
    // Get all cost entries
    const costs = await ProjectCost.find({});

    // Convert to object for easier lookup
    const costsMap = costs.reduce((acc, item) => {
      const totalRecurringCost = item.recurringCosts.reduce((sum, recurring) => sum + recurring.amount, 0);
      acc[item.projectKey] = {
        totalCost: item.cost + totalRecurringCost,
        baseCost: item.cost,
        recurringCosts: item.recurringCosts,
        totalRecurringCost,
        createdAt: item.createdAt
      };
      return acc;
    }, {});

    res.status(200).json({ 
      success: true,
      data: costsMap 
    });
  } catch (error) {
    console.error('Error fetching all project costs:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
};

// Delete fixed cost
export const deleteFixedCost = async (req, res) => {
  try {
    const { projectKey } = req.params;

    if (!projectKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project key is required' 
      });
    }

    const costEntry = await ProjectCost.findOne({ projectKey });
    
    if (!costEntry) {
      return res.status(404).json({ 
        success: false,
        message: 'Project cost entry not found' 
      });
    }

    // Reset fixed cost to 0
    costEntry.cost = 0;
    costEntry.createdAt = new Date();
    await costEntry.save();

    res.status(200).json({ 
      success: true,
      message: 'Fixed cost deleted successfully', 
      data: costEntry 
    });
  } catch (error) {
    console.error('Error deleting fixed cost:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
};

// Update project cost (same as add - replace existing)
export const updateProjectCost = async (req, res) => {
  try {
    const { projectKey } = req.params;
    const { cost } = req.body;

    if (!projectKey || typeof cost !== 'number') {
      return res.status(400).json({ 
        success: false,
        message: 'Project key and cost are required' 
      });
    }

    // Check if recurring costs exist
    const existingCost = await ProjectCost.findOne({ projectKey });
    if (existingCost && existingCost.recurringCosts.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot update fixed cost when recurring costs exist. Please remove all recurring costs first.' 
      });
    }

    // Use findOneAndUpdate with upsert to create or update
    const costEntry = await ProjectCost.findOneAndUpdate(
      { projectKey },
      { 
        projectKey, 
        cost,
        createdAt: new Date()
      },
      { 
        new: true, 
        upsert: true // Create if doesn't exist
      }
    );

    res.status(200).json({ 
      success: true,
      message: 'Cost updated successfully', 
      data: costEntry 
    });
  } catch (error) {
    console.error('Error updating project cost:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
};