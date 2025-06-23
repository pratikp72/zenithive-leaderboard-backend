/* eslint-disable no-undef */
// controllers/user/userAuth.js - Authentication operations
import User from '../../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Authentication function
export const authenticateUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Check if user is still using default password
    // Since the user just logged in with a valid password, we need to check if that password is the default one
    const isDefaultPassword = password === 'zenithive123';
    
    console.log('Password check:', { 
      loginPassword: password, 
      isDefaultPassword: isDefaultPassword 
    });

    const token = jwt.sign(
      {
        email: user.email,
        role: user.role,
        userId: user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Authentication successful',
      token,
      requiresPasswordChange: isDefaultPassword,
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
        effectiveHourlyCost: user.effectiveHourlyCost,
      },
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// Change password function
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
      });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Current password is incorrect',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters long',
      });
    }

    if (newPassword === 'zenithive123') {
      return res.status(400).json({
        error: 'New password cannot be the default password',
      });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.json({
      message: 'Password changed successfully',
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
        effectiveHourlyCost: user.effectiveHourlyCost,
      },
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};