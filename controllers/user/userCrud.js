/* eslint-disable no-undef */
// controllers/user/userCrud.js - Basic CRUD operations with JIRA integration
import User from '../../models/User.js';

// Create user with resource management fields and JIRA integration
export const createUser = async (req, res) => {
  try {
    const userData = { ...req.body };

    // Validate email uniqueness before creation
    if (userData.email) {
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

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
    
    // Handle specific MongoDB duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ error: 'Email already exists' });
      } else if (error.keyPattern && error.keyPattern.accountId) {
        return res.status(400).json({ error: 'JIRA Account ID already exists' });
      }
    }
    
    res.status(400).json({ error: error.message });
  }
};

// Create user from JIRA data
export const createUserFromJira = async (req, res) => {
  try {
    const { email, salary, overhead, monthlyHours, department, role } = req.body; // Added role here

    if (!email) {
      return res.status(400).json({ error: 'Email is required to fetch user from JIRA' });
    }

    // Check if user already exists in our system by email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists in the system' });
    }

    // Fetch user from JIRA by email
    const jiraResponse = await fetch(
      `${process.env.JIRA_BASE_URL}/rest/api/3/user/search?query=${encodeURIComponent(email)}&maxResults=10`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
          Accept: 'application/json',
        },
      }
    );

    if (!jiraResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch user from JIRA' });
    }

    const jiraUsers = await jiraResponse.json();

    if (!jiraUsers || jiraUsers.length === 0) {
      return res.status(404).json({ error: `User with email ${email} not found in JIRA` });
    }

    // Use first matching result (emailAddress may be missing due to privacy settings)
    const matchingUser = jiraUsers[0];
    console.log('Fetched JIRA User:', matchingUser);

    // Check if accountId already exists in our system
    if (matchingUser.accountId) {
      const existingAccountId = await User.findOne({ accountId: matchingUser.accountId });
      if (existingAccountId) {
        return res.status(400).json({ error: 'User with this JIRA Account ID already exists in the system' });
      }
    }

    // Fallback: use original email from input if Jira doesn't return emailAddress
    const finalEmail = matchingUser.emailAddress || email;

    const userData = {
      name: matchingUser.displayName || 'Unknown',
      email: finalEmail,
      accountId: matchingUser.accountId,
      department: department || '',
      role: role || 'employee', // Fixed: Now properly using the role from request
      salary: salary || 0,
      overhead: overhead || 0,
      monthlyHours: monthlyHours || 160,
    };

    // Calculate effective hourly cost if salary and hours are provided
    if (userData.salary && userData.monthlyHours) {
      const { calculateEffectiveHourlyCost } = await import('./utils/costCalculator.js');
      userData.effectiveHourlyCost = calculateEffectiveHourlyCost(
        userData.salary,
        userData.overhead,
        userData.monthlyHours
      );
    }

    const user = await User.create(userData);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully from JIRA data',
      user: userResponse,
      jiraData: {
        accountId: matchingUser.accountId,
        displayName: matchingUser.displayName,
        emailAddress: matchingUser.emailAddress || 'Hidden by Atlassian privacy',
      }
    });
  } catch (error) {
    console.error('Create user from JIRA error:', error);

    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return res.status(400).json({ error: 'Email already exists in the system' });
      } else if (error.keyPattern?.accountId) {
        return res.status(400).json({ error: 'JIRA Account ID already exists in the system' });
      }
    }

    res.status(400).json({ error: error.message });
  }
};

// Search JIRA users for admin selection
export const searchJiraUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const jiraResponse = await fetch(
      `${process.env.JIRA_BASE_URL}/rest/api/3/user/search?query=${encodeURIComponent(query)}&maxResults=50`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
          Accept: 'application/json',
        },
      }
    );

    if (!jiraResponse.ok) {
      return res.status(400).json({ error: 'Failed to search JIRA users' });
    }

    const jiraUsers = await jiraResponse.json();

    // Get existing users in our system to mark which ones are already imported
    const existingEmails = await User.find({}, 'email accountId').lean();
    const existingEmailSet = new Set(existingEmails.map(u => u.email?.toLowerCase()));
    const existingAccountIds = new Set(existingEmails.map(u => u.accountId).filter(Boolean));

    const usersWithStatus = jiraUsers.map(user => ({
      accountId: user.accountId,
      displayName: user.displayName,
      emailAddress: user.emailAddress,
      active: user.active,
      alreadyImported: existingEmailSet.has(user.emailAddress?.toLowerCase()) || existingAccountIds.has(user.accountId),
    }));

    res.status(200).json({
      success: true,
      count: usersWithStatus.length,
      users: usersWithStatus,
    });
  } catch (error) {
    console.error('Search JIRA users error:', error);
    res.status(500).json({ error: error.message });
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

    // Check for email uniqueness if email is being updated
    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email.toLowerCase(),
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Get current user data to calculate effective hourly cost
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const salary = updateData.salary !== undefined ? updateData.salary : currentUser.salary;
    const overhead = updateData.overhead !== undefined ? updateData.overhead : currentUser.overhead;
    const monthlyHours = updateData.monthlyHours !== undefined ? updateData.monthlyHours : currentUser.monthlyHours;

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

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return res.status(400).json({ error: 'Email already exists' });
      } else if (error.keyPattern?.accountId) {
        return res.status(400).json({ error: 'JIRA Account ID already exists' });
      }
    }

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

// Bulk import users from JIRA
export const bulkImportJiraUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ error: 'Users array is required' });
    }

    const createdUsers = [];
    const errors = [];

    for (const userData of users) {
      try {
        // Check if user already exists by email or accountId
        const existingUser = await User.findOne({ 
          $or: [
            { email: userData.email?.toLowerCase() },
            { accountId: userData.accountId }
          ]
        });

        if (existingUser) {
          errors.push(`User ${userData.email} already exists`);
          continue;
        }

        // Calculate effective hourly cost
        if (userData.salary && userData.monthlyHours) {
          const { calculateEffectiveHourlyCost } = await import('./utils/costCalculator.js');
          userData.effectiveHourlyCost = calculateEffectiveHourlyCost(
            userData.salary,
            userData.overhead || 0,
            userData.monthlyHours
          );
        }

        const user = await User.create(userData);
        const userResponse = user.toObject();
        delete userResponse.password;
        createdUsers.push(userResponse);
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        if (error.code === 11000) {
          errors.push(`User ${userData.email} already exists (duplicate key)`);
        } else {
          errors.push(`Failed to create user ${userData.email}: ${error.message}`);
        }
      }
    }

    res.status(201).json({
      message: `Successfully imported ${createdUsers.length} users`,
      users: createdUsers,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk import JIRA users error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Sync user with JIRA data
export const syncUserWithJira = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user doesn't have accountId, try to find them by email
    let accountId = user.accountId;
    if (!accountId && user.email) {
      const jiraResponse = await fetch(
        `${process.env.JIRA_BASE_URL}/rest/api/3/user/search?query=${encodeURIComponent(user.email)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
            Accept: 'application/json',
          },
        }
      );

      if (jiraResponse.ok) {
        const jiraUsers = await jiraResponse.json();
        const matchingUser = jiraUsers.find(u => 
          u.emailAddress?.toLowerCase() === user.email.toLowerCase()
        );
        if (matchingUser) {
          accountId = matchingUser.accountId;
        }
      }
    }

    if (!accountId) {
      return res.status(400).json({ error: 'User not found in JIRA or no account ID available' });
    }

    // Fetch updated user data from JIRA
    const jiraUserResponse = await fetch(
      `${process.env.JIRA_BASE_URL}/rest/api/3/user?accountId=${accountId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
          Accept: 'application/json',
        },
      }
    );

    if (!jiraUserResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch user data from JIRA' });
    }

    const jiraUser = await jiraUserResponse.json();

    // Check if updating email would create a duplicate
    if (jiraUser.emailAddress && jiraUser.emailAddress.toLowerCase() !== user.email?.toLowerCase()) {
      const existingUser = await User.findOne({ 
        email: jiraUser.emailAddress.toLowerCase(),
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Cannot sync: JIRA email already exists in system' });
      }
    }

    // Update user with JIRA data
    const updateData = {
      name: jiraUser.displayName,
      email: jiraUser.emailAddress,
      accountId: jiraUser.accountId,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({
      message: 'User synced with JIRA successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Sync user with JIRA error:', error);
    
    // Handle specific MongoDB duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ error: 'Cannot sync: Email already exists in system' });
      } else if (error.keyPattern && error.keyPattern.accountId) {
        return res.status(400).json({ error: 'Cannot sync: JIRA Account ID already exists in system' });
      }
    }
    
    res.status(500).json({ error: error.message });
  }
};

// export const getCostSummary = async (req, res) => {
//   try {
//     const users = await User.find().select('-password');
    
//     // Calculate cost summary
//     const totalUsers = users.length;
//     let totalMonthlyCost = 0;
//     let totalHourlyCosts = 0;
//     let usersWithCost = 0;

//     users.forEach(user => {
//       if (user.effectiveHourlyCost && user.monthlyHours) {
//         const monthlyCost = user.effectiveHourlyCost * user.monthlyHours;
//         totalMonthlyCost += monthlyCost;
//         totalHourlyCosts += user.effectiveHourlyCost;
//         usersWithCost++;
//       }
//     });

//     const summary = {
//       totalUsers,
//       totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
//       totalAnnualCost: Math.round(totalMonthlyCost * 12 * 100) / 100,
//       avgHourlyCost: usersWithCost > 0 ? Math.round((totalHourlyCosts / usersWithCost) * 100) / 100 : 0,
//       averageMonthlyCostPerEmployee: usersWithCost > 0 ? Math.round((totalMonthlyCost / usersWithCost) * 100) / 100 : 0,
//     };

//     res.json({
//       users,
//       summary
//     });
//   } catch (error) {
//     console.error('Get cost summary error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };