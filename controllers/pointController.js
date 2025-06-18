import User from '../models/User.js';

export const addPoints = async (req, res) => {
  const { userId, points, reason, category } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.leaderboardEntries.push({ points, reason, category });
  user.totalPoints += points;

  await user.save();
  res.json(user);
};

export const getLeaderboard = async (req, res) => {
  const users = await User.find().sort({ totalPoints: -1 });
  res.json(users);
};

// New function to halve all users' points at month end
export const halveMonthlyPoints = async () => {
  try {
    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // Get all users
    const users = await User.find();

    for (let user of users) {
      // Store current month's points before halving
      const currentMonthPoints = user.totalPoints;

      // Add current month's points to monthlyPoints history
      const existingMonthIndex = user.monthlyPoints.findIndex((mp) => mp.month === monthYear);
      if (existingMonthIndex >= 0) {
        user.monthlyPoints[existingMonthIndex].points = currentMonthPoints;
      } else {
        user.monthlyPoints.push({
          month: monthYear,
          points: currentMonthPoints,
        });
      }

      // Halve the total points
      user.totalPoints = Math.floor(user.totalPoints / 2);

      // Add rollover points (the amount that was halved)
      user.rolloverPoints += Math.floor(currentMonthPoints / 2);

      // Add a leaderboard entry to track the monthly reset
      user.leaderboardEntries.push({
        points: -Math.floor(currentMonthPoints / 2),
        reason: `Monthly point reset - ${monthYear}`,
        category: 'System',
        date: new Date(),
      });

      await user.save();
    }

    console.log(
      `✅ Monthly point reset completed for ${users.length} users on ${currentDate.toISOString()}`
    );
    return { success: true, usersUpdated: users.length };
  } catch (error) {
    console.error('❌ Error during monthly point reset:', error);
    return { success: false, error: error.message };
  }
};

// Manual endpoint to trigger point reset (for testing)
export const triggerMonthlyReset = async (req, res) => {
  const result = await halveMonthlyPoints();

  if (result.success) {
    res.json({
      message: 'Monthly point reset completed successfully',
      usersUpdated: result.usersUpdated,
    });
  } else {
    res.status(500).json({
      message: 'Monthly point reset failed',
      error: result.error,
    });
  }
};
