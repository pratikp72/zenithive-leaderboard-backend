// controllers/user/userResources.js - Resource management operations
import User from "../../models/User.js";

// Update user resource information (salary, overhead, hours)
export const updateUserResources = async (req, res) => {
  try {
    const userId = req.params.id;
    const { salary, overhead, monthlyHours } = req.body;
    
    // Import validation utility
    const { validateResourceInputs } = await import('./utils/validation.js');
    const validationError = validateResourceInputs({ salary, overhead, monthlyHours });
    
    if (validationError) {
      return res.status(400).json({ error: validationError });
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
    
    const { calculateEffectiveHourlyCost } = await import('./utils/costCalculator.js');
    updateData.effectiveHourlyCost = calculateEffectiveHourlyCost(finalSalary, finalOverhead, finalMonthlyHours);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    console.log("updatedUser", updatedUser);
    
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
    
    const { calculateCostSummary } = await import('./utils/costCalculator.js');
    const summary = calculateCostSummary(users);
    
    res.json({
      users,
      summary
    });
  } catch (error) {
    console.error('Get users with cost summary error:', error);
    res.status(500).json({ error: error.message });
  }
};