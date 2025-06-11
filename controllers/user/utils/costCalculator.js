export const calculateEffectiveHourlyCost = (
  salary,
  overhead,
  monthlyHours
) => {

  if (!salary || !monthlyHours) return 0;

  const salaryNum = parseFloat(salary); // already monthly
  const overheadNum = parseFloat(overhead) || 0;
  const monthlyHoursNum = parseFloat(monthlyHours);

  // Don't divide by 12
  const monthlyCost = salaryNum * (1 + overheadNum / 100);
  const effectiveHourlyCost = monthlyCost / monthlyHoursNum;

  const rounded =
    Math.round((effectiveHourlyCost + Number.EPSILON) * 100) / 100;


  return rounded;
};

export const calculateCostSummary = (users) => {
  const totalUsers = users.length;

  const totalMonthlyCost = users.reduce((sum, user) => {
    if (user.salary && user.monthlyHours) {
      const monthlyCost = user.salary * (1 + (user.overhead || 0) / 100); // no /12
      return sum + monthlyCost;
    }
    return sum;
  }, 0);

  const avgHourlyCost =
    users.length > 0
      ? users.reduce((sum, user) => sum + (user.effectiveHourlyCost || 0), 0) /
        users.length
      : 0;

  return {
    totalUsers,
    totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
    avgHourlyCost: Math.round(avgHourlyCost * 100) / 100,
    totalAnnualCost: Math.round(totalMonthlyCost * 12 * 100) / 100,
  };
};
