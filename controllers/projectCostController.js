import ProjectCost from '../models/ProjectCost.js';

// Add project cost (existing)
export const addProjectCost = async (req, res) => {
  try {
    const { projectKey, cost } = req.body;

    if (!projectKey || typeof cost !== 'number') {
      return res.status(400).json({ message: 'Project key and cost are required' });
    }

    const costEntry = new ProjectCost({ projectKey, cost });
    await costEntry.save();

    res.status(201).json({ message: 'Cost added successfully', data: costEntry });
  } catch (error) {
    console.error('Error adding cost:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get project cost by project key
export const getProjectCost = async (req, res) => {
  try {
    const { projectKey } = req.params;

    if (!projectKey) {
      return res.status(400).json({ message: 'Project key is required' });
    }

    const costEntry = await ProjectCost.findOne({ projectKey }).sort({ createdAt: -1 });

    if (!costEntry) {
      return res.status(404).json({ message: 'Project cost not found' });
    }

    res.status(200).json({ data: costEntry });
  } catch (error) {
    console.error('Error fetching project cost:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get all project costs
export const getAllProjectCosts = async (req, res) => {
  try {
    // Aggregate to get the latest cost for each project
    const costs = await ProjectCost.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$projectKey',
          projectKey: { $first: '$projectKey' },
          cost: { $first: '$cost' },
          createdAt: { $first: '$createdAt' },
        },
      },
    ]);

    // Convert to object for easier lookup
    const costsMap = costs.reduce((acc, item) => {
      acc[item.projectKey] = item.cost;
      return acc;
    }, {});

    res.status(200).json({ data: costsMap });
  } catch (error) {
    console.error('Error fetching all project costs:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update project cost
export const updateProjectCost = async (req, res) => {
  try {
    const { projectKey } = req.params;
    const { cost } = req.body;

    if (!projectKey || typeof cost !== 'number') {
      return res.status(400).json({ message: 'Project key and cost are required' });
    }

    // Create new entry (to maintain history) or update existing
    const costEntry = new ProjectCost({ projectKey, cost });
    await costEntry.save();

    res.status(200).json({ message: 'Cost updated successfully', data: costEntry });
  } catch (error) {
    console.error('Error updating project cost:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
