// routes/projectCostRoutes.js
import express from 'express';
import { 
  addProjectCost, 
  getProjectCost, 
  getAllProjectCosts, 
  updateProjectCost,
  addRecurringCost,
  updateRecurringCost,
  deleteRecurringCost,
  deleteFixedCost
} from '../controllers/projectCostController.js';

const router = express.Router();

// Add debugging
console.log('Project cost routes loaded');
console.log('Imported functions:', {
  addProjectCost: typeof addProjectCost,
  getProjectCost: typeof getProjectCost,
  getAllProjectCosts: typeof getAllProjectCosts,
  updateProjectCost: typeof updateProjectCost,
  addRecurringCost: typeof addRecurringCost,
  updateRecurringCost: typeof updateRecurringCost,
  deleteRecurringCost: typeof deleteRecurringCost
});

// GET - Get all project costs (MOVED BEFORE the dynamic route)
router.get('/costs', getAllProjectCosts);

// POST - Add new project cost
router.post('/cost', addProjectCost);

// GET - Get cost for specific project (MOVED AFTER the static route)
router.get('/cost/:projectKey', getProjectCost);

// PUT - Update project cost
router.put('/cost/:projectKey', updateProjectCost);

// DELETE - Delete fixed cost
router.delete('/cost/:projectKey', deleteFixedCost);

// Recurring cost routes
router.post('/recurring-cost/:projectKey', (req, res, next) => {
  console.log('POST /recurring-cost/:projectKey hit with projectKey:', req.params.projectKey);
  console.log('Request body:', req.body);
  addRecurringCost(req, res, next);
});

router.put('/recurring-cost/:projectKey/:recurringCostId', (req, res, next) => {
  console.log('PUT /recurring-cost/:projectKey/:recurringCostId hit');
  updateRecurringCost(req, res, next);
});

router.delete('/recurring-cost/:projectKey/:recurringCostId', (req, res, next) => {
  console.log('DELETE /recurring-cost/:projectKey/:recurringCostId hit');
  deleteRecurringCost(req, res, next);
});

// Debug: Log all routes
console.log('Recurring cost routes registered:', {
  post: '/recurring-cost/:projectKey',
  put: '/recurring-cost/:projectKey/:recurringCostId', 
  delete: '/recurring-cost/:projectKey/:recurringCostId'
});

export default router;