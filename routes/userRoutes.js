import express from 'express';
import { 
  createUser, 
  getUsers, 
  getUserById,
  updateUser,
  deleteUser,
  updateUserResources,
  getUsersWithCostSummary,
  authenticateUser, 
  changePassword 
} from '../controllers/userController.js';
import { verifyAdmin, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Authentication routes
router.post('/auth', authenticateUser); // Authentication route
router.put('/change-password', verifyToken, changePassword); // Change password route

// User CRUD routes
router.post('/create', verifyAdmin, createUser); // Only admin can create users
router.get('/', verifyToken, getUsers); // All authenticated users can view users
router.get('/cost-summary', verifyAdmin, getUsersWithCostSummary); // Only admin can see cost summary
router.get('/:id', verifyToken, getUserById); // Get single user by ID
router.put('/:id', verifyAdmin, updateUser); // Only admin can update user details
router.delete('/:id', verifyAdmin, deleteUser); // Only admin can delete users

// Resource management specific routes
router.put('/:id/resources', verifyAdmin, updateUserResources); // Only admin can update resource info

export default router;