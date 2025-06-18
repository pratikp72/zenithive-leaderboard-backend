// controllers/user/utils/validation.js - Validation utilities
export const validateResourceInputs = ({ salary, overhead, monthlyHours }) => {
  if (salary !== undefined && (typeof salary !== 'number' || salary < 0)) {
    return 'Salary must be a non-negative number';
  }

  if (overhead !== undefined && (typeof overhead !== 'number' || overhead < 0 || overhead > 100)) {
    return 'Overhead must be a number between 0 and 100';
  }

  if (monthlyHours !== undefined && (typeof monthlyHours !== 'number' || monthlyHours <= 0)) {
    return 'Monthly hours must be a positive number';
  }

  return null; // No validation errors
};
