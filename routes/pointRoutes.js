import express from 'express';
import { addPoints, getLeaderboard, triggerMonthlyReset } from '../controllers/pointController.js';
import { verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/add', verifyAdmin, addPoints);
router.get('/leaderboard', getLeaderboard);

// Manual endpoint to trigger monthly reset (for testing)
router.post('/reset-monthly', triggerMonthlyReset);

export default router;
