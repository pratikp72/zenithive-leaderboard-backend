/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// import express from 'express';
// import {
//   createUser,
//   getUsers,
//   getUserById,
//   updateUser,
//   deleteUser,
//   updateUserResources,
//   getUsersWithCostSummary,
//   authenticateUser,
//   changePassword,
// } from '../controllers/user/index.js';
// import { verifyAdmin, verifyToken } from '../middlewares/authMiddleware.js';

// const router = express.Router();

// // Authentication routes
// router.post('/auth', authenticateUser); // Authentication route
// router.put('/change-password', verifyToken, changePassword); // Change password route

// // User CRUD routes
// router.post('/create', verifyAdmin, createUser); // Only admin can create users
// router.get('/', verifyToken, getUsers); // All authenticated users can view users
// router.get('/cost-summary', verifyAdmin, getUsersWithCostSummary); // Only admin can see cost summary
// router.get('/:id', verifyToken, getUserById); // Get single user by ID
// router.put('/:id', verifyAdmin, updateUser); // Only admin can update user details
// router.delete('/:id', verifyAdmin, deleteUser); // Only admin can delete users

// // Resource management specific routes
// router.put('/:id/resources', verifyAdmin, updateUserResources); // Only admin can update resource info

// export default router;



// routes/userRoutes.js
import express from 'express';
import {
  createUser,
  createUserFromJira,
  searchJiraUsers,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  bulkImportJiraUsers,
  syncUserWithJira,
} from '../controllers/user/userCrud.js';
import { authenticateUser, changePassword } from '../controllers/user/userAuth.js';
import { verifyAdmin,verifyToken } from '../middlewares/authMiddleware.js';
import { getUsersWithCostSummary } from '../controllers/user/userResources.js';

const router = express.Router();

// Authentication routes
router.post('/auth', authenticateUser);
router.put('/change-password', verifyToken, changePassword);

router.get('/jira/search', verifyAdmin, searchJiraUsers);
router.post('/jira/create', verifyAdmin, createUserFromJira);
router.post('/jira/bulk-import', verifyAdmin, bulkImportJiraUsers);

router.get('/', verifyToken, getUsers); // All authenticated users can view users
router.get('/cost-summary', verifyAdmin, getUsersWithCostSummary); // Only admin can see cost summary
router.post('/create', verifyAdmin, createUser); // Only admin can create users

// Routes with dynamic parameters - MOVED AFTER specific routes
router.get('/:id', verifyToken, getUserById); // All authenticated users can view single user
router.put('/:id', verifyAdmin, updateUser); // Only admin can update user details
router.delete('/:id', verifyAdmin, deleteUser); // Only admin can delete users
router.post('/:id/sync-jira', verifyAdmin, syncUserWithJira); // Admin only for JIRA sync

export default router;