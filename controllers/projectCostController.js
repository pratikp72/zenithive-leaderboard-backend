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

// Get project cost by project key (get single cost entry)
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
          totalCost: 0
        }
      });
    }

    res.status(200).json({ 
      success: true,
      data: {
        projectKey: costEntry.projectKey,
        totalCost: costEntry.cost,
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
      acc[item.projectKey] = {
        totalCost: item.cost,
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