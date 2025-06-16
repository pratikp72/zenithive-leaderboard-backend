import express from 'express';
import { 
  addProjectCost, 
  getProjectCost, 
  getAllProjectCosts, 
  updateProjectCost 
} from '../controllers/projectCostController.js';

const router = express.Router();

// POST - Add new project cost
router.post('/project-cost', addProjectCost);

// GET - Get cost for specific project
router.get('/project-cost/:projectKey', getProjectCost);

// GET - Get all project costs
router.get('/project-costs', getAllProjectCosts);

// PUT - Update project cost
router.put('/project-cost/:projectKey', updateProjectCost);

export default router;