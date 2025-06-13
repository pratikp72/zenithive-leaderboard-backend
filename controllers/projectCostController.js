import ProjectCost from '../models/ProjectCost.js';

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
