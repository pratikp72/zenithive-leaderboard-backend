import express from 'express';
import { createUser, getUsers, authenticateUser, changePassword } from '../controllers/userController.js';
import { verifyAdmin, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', verifyAdmin, createUser); // Protect this
router.get('/', verifyToken, getUsers);
router.post('/auth', authenticateUser); // Authentication route
router.put('/change-password', verifyToken, changePassword); // NEW: Change password route

export default router;