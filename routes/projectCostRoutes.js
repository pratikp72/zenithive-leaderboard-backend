import express from 'express';
import { addProjectCost } from '../controllers/projectCostController.js';

const router = express.Router();

router.post('/project-cost', addProjectCost);

export default router;
