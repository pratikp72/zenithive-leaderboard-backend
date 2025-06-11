// controllers/user/utils/costCalculator.js - Utility functions for cost calculations
// Helper function to calculate effective hourly cost
export const calculateEffectiveHourlyCost = (salary, overhead, monthlyHours) => {
  console.log("salary", salary);
  console.log("overhead", overhead);
  console.log("monthlyHours", monthlyHours);
  
  if (!salary || !monthlyHours) return 0;
  
  // Convert to numbers and handle precision
  const salaryNum = parseFloat(salary);
  const overheadNum = parseFloat(overhead) || 0;
  const monthlyHoursNum = parseFloat(monthlyHours);
  
  const monthlyCost = (salaryNum / 12) * (1 + overheadNum / 100);
  const effectiveHourlyCost = monthlyCost / monthlyHoursNum;
  
  // Better rounding method
  const rounded = Math.round((effectiveHourlyCost + Number.EPSILON) * 100) / 100;
  
  console.log("monthlyCost:", monthlyCost);
  console.log("effectiveHourlyCost (raw):", effectiveHourlyCost);
  console.log("effectiveHourlyCost (rounded):", rounded);
  
  return rounded;
};

// Calculate summary statistics for all users
export const calculateCostSummary = (users) => {
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
  
  return {
    totalUsers,
    totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
    avgHourlyCost: Math.round(avgHourlyCost * 100) / 100,
    totalAnnualCost: Math.round(totalMonthlyCost * 12 * 100) / 100
  };
};