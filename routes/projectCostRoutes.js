import express from 'express';
import {
  addProjectCost,
  getProjectCost,
  getAllProjectCosts,
  updateProjectCost,
} from '../controllers/projectCostController.js';

const router = express.Router();

// POST - Add new project cost
router.post('/project-cost', addProjectCost);

// GET - Get all project costs (MOVED BEFORE the dynamic route)
router.get('/project-costs', getAllProjectCosts);

// GET - Get cost for specific project (MOVED AFTER the static route)
router.get('/project-cost/:projectKey', getProjectCost);

// PUT - Update project cost
router.put('/project-cost/:projectKey', updateProjectCost);

export default router;