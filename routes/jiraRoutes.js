import express from 'express';
import { 
  getJiraProjects, 
  getProjectIssues,
  getJiraProjectByKey, 
  getJiraProjectsWithDetails 
} from '../controllers/jira/jiraController.js'; // Adjust path as needed

const router = express.Router();

// Routes
router.get('/', getJiraProjects);
router.get('/detailed', getJiraProjectsWithDetails);
router.get('/:projectKey', getJiraProjectByKey);
router.get('/:projectKey/issues', getProjectIssues);

export default router;