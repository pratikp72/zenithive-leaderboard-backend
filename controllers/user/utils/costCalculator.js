// export const calculateEffectiveHourlyCost = (salary, overhead, monthlyHours) => {
//   if (!salary || !monthlyHours) return 0;

//   const salaryNum = parseFloat(salary); // already monthly
//   const overheadNum = parseFloat(overhead) || 0;
//   const monthlyHoursNum = parseFloat(monthlyHours);

//   // Don't divide by 12
//   const monthlyCost = salaryNum * (1 + overheadNum / 100);
//   const effectiveHourlyCost = monthlyCost / monthlyHoursNum;

//   const rounded = Math.round((effectiveHourlyCost + Number.EPSILON) * 100) / 100;

//   return rounded;
// };

export const calculateCostSummary = (users) => {
  if (!Array.isArray(users)) {
    throw new Error("Expected 'users' to be an array");
  }

  const totalUsers = users.length;

  // Calculate total monthly cost based on effective hourly cost and monthly hours
  const totalMonthlyCost = users.reduce((sum, user) => {
    if (user.effectiveHourlyCost && user.monthlyHours) {
      const monthlyCost = user.effectiveHourlyCost * user.monthlyHours;
      return sum + monthlyCost;
    }
    return sum;
  }, 0);

  const avgHourlyCost =
    users.length > 0
      ? users.reduce((sum, user) => sum + (user.effectiveHourlyCost || 0), 0) / users.length
      : 0;

  return {
    totalUsers,
    totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
    avgHourlyCost: Math.round(avgHourlyCost * 100) / 100,
    totalAnnualCost: Math.round(totalMonthlyCost * 12 * 100) / 100,
  };
};

export const calculateCostSummaryAlternative = (users) => {
  if (!Array.isArray(users)) {
    throw new Error("Expected 'users' to be an array");
  }

  const totalUsers = users.length;

  // Calculate based on salary + overhead
  const totalMonthlyCost = users.reduce((sum, user) => {
    const salary = user.salary || 0;
    const overhead = (user.overhead || 0) / 100; // Convert percentage to decimal
    const monthlyCost = salary + (salary * overhead);
    return sum + monthlyCost;
  }, 0);

  // Calculate average hourly cost
  const totalMonthlyHours = users.reduce((sum, user) => sum + (user.monthlyHours || 0), 0);
  const avgHourlyCost = totalMonthlyHours > 0 
    ? totalMonthlyCost / totalMonthlyHours 
    : 0;

  // Calculate annual cost
  const totalAnnualCost = totalMonthlyCost * 12;

  return {
    totalUsers,
    totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
    avgHourlyCost: Math.round(avgHourlyCost * 100) / 100,
    totalAnnualCost: Math.round(totalAnnualCost * 100) / 100,
  };
};

// Debug function to check individual calculations
export const debugCostCalculation = (users) => {
  console.log("=== Cost Calculation Debug ===");
  
  users.forEach((user, index) => {
    const salary = user.salary || 0;
    const overhead = (user.overhead || 0) / 100;
    const monthlyCostFromSalary = salary + (salary * overhead);
    const effectiveHourlyCost = user.effectiveHourlyCost || 0;
    
    console.log(`User ${index + 1} (${user.name}):`);
    console.log(`  Salary: ₹${salary}`);
    console.log(`  Overhead: ${user.overhead}%`);
    console.log(`  Monthly Cost (from salary): ₹${monthlyCostFromSalary}`);
    console.log(`  Effective Hourly Cost: ₹${effectiveHourlyCost}`);
    console.log(`  Monthly Hours: ${user.monthlyHours}`);
    console.log("---");
  });

  const totalFromEffectiveHourly = users.reduce((sum, user) => sum + (user.effectiveHourlyCost || 0), 0);
  const totalFromSalary = users.reduce((sum, user) => {
    const salary = user.salary || 0;
    const overhead = (user.overhead || 0) / 100;
    return sum + salary + (salary * overhead);
  }, 0);

  console.log(`Total from Effective Hourly: ₹${totalFromEffectiveHourly}`);
  console.log(`Total from Salary + Overhead: ₹${totalFromSalary}`);
  console.log("=== End Debug ===");
};

export const calculateEffectiveHourlyCost = (salary, overhead, monthlyHours) => {
  if (!salary || !monthlyHours) return 0;

  const salaryNum = parseFloat(salary);
  const overheadNum = parseFloat(overhead) || 0;
  const monthlyHoursNum = parseFloat(monthlyHours);

  // Calculate monthly salary with overhead
  const monthlySalaryWithOverhead = (salaryNum * (1 + overheadNum / 100)) / 12;
  
  // Calculate hourly cost
  const hourlyCost = monthlySalaryWithOverhead / monthlyHoursNum;

  return Math.round((hourlyCost + Number.EPSILON) * 100) / 100;
};