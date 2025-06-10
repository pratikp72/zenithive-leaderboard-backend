import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Helper function to calculate effective hourly cost
const calculateEffectiveHourlyCost = (salary, overhead, monthlyHours) => {
  if (!salary || !monthlyHours) return 0;
  
  const monthlyCost = (salary / 12) * (1 + (overhead || 0) / 100);
  const effectiveHourlyCost = monthlyCost / monthlyHours;
  
  return Math.round(effectiveHourlyCost * 100) / 100;
};

// Create user with resource management fields
export const createUser = async (req, res) => {
  try {
    const userData = { ...req.body };
    
    // Calculate effective hourly cost if salary data is provided
    if (userData.salary && userData.monthlyHours) {
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
    const users = await User.find().select('-password'); // exclude password
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
    const monthlyHours = updateData.monthlyHours !== undefined ? updateData.monthlyHours : currentUser.monthlyHours;
    
    if (salary && monthlyHours) {
      updateData.effectiveHourlyCost = calculateEffectiveHourlyCost(salary, overhead, monthlyHours);
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
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

// Update user resource information (salary, overhead, hours)
export const updateUserResources = async (req, res) => {
  try {
    const userId = req.params.id;
    const { salary, overhead, monthlyHours } = req.body;
    
    // Validate input
    if (salary !== undefined && (typeof salary !== 'number' || salary < 0)) {
      return res.status(400).json({ error: 'Salary must be a non-negative number' });
    }
    
    if (overhead !== undefined && (typeof overhead !== 'number' || overhead < 0 || overhead > 100)) {
      return res.status(400).json({ error: 'Overhead must be a number between 0 and 100' });
    }
    
    if (monthlyHours !== undefined && (typeof monthlyHours !== 'number' || monthlyHours <= 0)) {
      return res.status(400).json({ error: 'Monthly hours must be a positive number' });
    }
    
    const updateData = {};
    if (salary !== undefined) updateData.salary = salary;
    if (overhead !== undefined) updateData.overhead = overhead;
    if (monthlyHours !== undefined) updateData.monthlyHours = monthlyHours;
    
    // Get current user to calculate effective hourly cost
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate effective hourly cost
    const finalSalary = salary !== undefined ? salary : currentUser.salary;
    const finalOverhead = overhead !== undefined ? overhead : currentUser.overhead;
    const finalMonthlyHours = monthlyHours !== undefined ? monthlyHours : currentUser.monthlyHours;
    
    updateData.effectiveHourlyCost = calculateEffectiveHourlyCost(finalSalary, finalOverhead, finalMonthlyHours);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user resources error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get users with resource cost summary
export const getUsersWithCostSummary = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    // Calculate summary statistics
    const totalUsers = users.length;
    const totalMonthlyCost = users.reduce((sum, user) => {
      if (user.salary && user.monthlyHours) {
        const monthlyCost = (user.salary / 12) * (1 + (user.overhead || 0) / 100);
        return sum + monthlyCost;
      }
      return sum;
    }, 0);
    
    const avgHourlyCost = users.length > 0 
      ? users.reduce((sum, user) => sum + (user.effectiveHourlyCost || 0), 0) / users.length 
      : 0;
    
    const summary = {
      totalUsers,
      totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
      avgHourlyCost: Math.round(avgHourlyCost * 100) / 100,
      totalAnnualCost: Math.round(totalMonthlyCost * 12 * 100) / 100
    };
    
    res.json({
      users,
      summary
    });
  } catch (error) {
    console.error('Get users with cost summary error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Authentication function (unchanged)
export const authenticateUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        email: user.email,
        role: user.role,
        userId: user._id,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Authentication successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        totalPoints: user.totalPoints,
        salary: user.salary,
        overhead: user.overhead,
        monthlyHours: user.monthlyHours,
        effectiveHourlyCost: user.effectiveHourlyCost
      },
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Change password function (unchanged)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: "Current password is incorrect",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters long",
      });
    }

    if (newPassword === "zenithive123") {
      return res.status(400).json({
        error: "New password cannot be the default password",
      });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.json({
      message: "Password changed successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        totalPoints: user.totalPoints,
        salary: user.salary,
        overhead: user.overhead,
        monthlyHours: user.monthlyHours,
        effectiveHourlyCost: user.effectiveHourlyCost
      },
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};