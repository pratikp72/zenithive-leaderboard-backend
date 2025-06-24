// controllers/projectCostController.js
import ProjectCost from '../models/ProjectCost.js';

// Add project cost (existing)
export const addProjectCost = async (req, res) => {
  try {
    const { projectKey, cost } = req.body;

    if (!projectKey || typeof cost !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: 'Project key and cost are required' 
      });
    }

    const costEntry = new ProjectCost({ projectKey, cost });
    await costEntry.save();

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

// Get project cost by project key (calculate total from all entries)
export const getProjectCost = async (req, res) => {
  try {
    const { projectKey } = req.params;

    if (!projectKey) {
      return res.status(400).json({ 
        success: false,
        message: 'Project key is required' 
      });
    }

    // Get all cost entries for this project and calculate total
    const costEntries = await ProjectCost.find({ projectKey });

    if (!costEntries || costEntries.length === 0) {
      return res.status(200).json({ 
        success: true,
        data: {
          projectKey,
          totalCost: 0,
          entries: []
        }
      });
    }

    // Calculate total cost from all entries
    const totalCost = costEntries.reduce((sum, entry) => sum + entry.cost, 0);

    res.status(200).json({ 
      success: true,
      data: {
        projectKey,
        totalCost,
        entries: costEntries,
        lastUpdated: costEntries[costEntries.length - 1].createdAt
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

// Get all project costs (calculate total for each project)
export const getAllProjectCosts = async (req, res) => {
  try {
    // Aggregate to calculate total cost for each project
    const costs = await ProjectCost.aggregate([
      {
        $group: {
          _id: '$projectKey',
          projectKey: { $first: '$projectKey' },
          totalCost: { $sum: '$cost' },
          entryCount: { $sum: 1 },
          lastUpdated: { $max: '$createdAt' }
        }
      }
    ]);

    // Convert to object for easier lookup
    const costsMap = costs.reduce((acc, item) => {
      acc[item.projectKey] = {
        totalCost: item.totalCost,
        entryCount: item.entryCount,
        lastUpdated: item.lastUpdated
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

// Update project cost (add new entry)
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

    // Create new entry (to maintain history)
    const costEntry = new ProjectCost({ projectKey, cost });
    await costEntry.save();

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