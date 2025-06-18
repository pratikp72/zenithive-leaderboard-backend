// controllers/user/userCrud.js - Basic CRUD operations
import User from '../../models/User.js';

// Create user with resource management fields
export const createUser = async (req, res) => {
  try {
    const userData = { ...req.body };

    // Calculate effective hourly cost if salary data is provided
    if (userData.salary && userData.monthlyHours) {
      const { calculateEffectiveHourlyCost } = await import('./utils/costCalculator.js');
      userData.effectiveHourlyCost = calculateEffectiveHourlyCost(
        userData.salary,
        userData.overhead || 0,
        userData.monthlyHours
      );
    }

    const user = await User.create(userData);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user with resource management fields
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = { ...req.body };

    // Don't allow password updates through this endpoint
    delete updateData.password;

    // Get current user data to calculate effective hourly cost
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate effective hourly cost with updated values
    const salary = updateData.salary !== undefined ? updateData.salary : currentUser.salary;
    const overhead = updateData.overhead !== undefined ? updateData.overhead : currentUser.overhead;
    const monthlyHours =
      updateData.monthlyHours !== undefined ? updateData.monthlyHours : currentUser.monthlyHours;

    if (salary && monthlyHours) {
      const { calculateEffectiveHourlyCost } = await import('./utils/costCalculator.js');
      updateData.effectiveHourlyCost = calculateEffectiveHourlyCost(salary, overhead, monthlyHours);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
};
