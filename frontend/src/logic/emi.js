// src/logic/emi.js

/**
 * Calculate EMI for Flat Interest Rate
 * Formula: EMI = (Principal + (Principal * Rate * Tenure)) / (Tenure * 12)
 */
export const calculateFlatEMI = (principal, annualRate, years) => {
  const totalInterest = principal * (annualRate / 100) * years;
  const totalAmount = principal + totalInterest;
  const months = years * 12;
  return Math.round(totalAmount / months);
};

/**
 * Calculate EMI for Reducing Balance Interest Rate
 * Formula: EMI = [P * R * (1+R)^N] / [(1+R)^N - 1]
 * P = Principal, R = Monthly Rate, N = Months
 */
export const calculateReducingEMI = (principal, annualRate, years) => {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
};

/**
 * Generate Repayment Schedule
 */
export const generateSchedule = (principal, annualRate, years, type = 'reducing', startDate = new Date()) => {
  const schedule = [];
  const months = years * 12;
  let remainingBalance = principal;
  const emi = type === 'reducing' 
    ? calculateReducingEMI(principal, annualRate, years)
    : calculateFlatEMI(principal, annualRate, years);

  const monthlyRate = annualRate / 12 / 100;

  for (let i = 1; i <= months; i++) {
    let interestPayment, principalPayment;

    if (type === 'reducing') {
      interestPayment = Math.round(remainingBalance * monthlyRate);
      principalPayment = emi - interestPayment;
    } else {
      interestPayment = Math.round((principal * (annualRate / 100) * years) / months);
      principalPayment = emi - interestPayment;
    }

    remainingBalance -= principalPayment;
    
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNo: i,
      dueDate: dueDate.toISOString().split('T')[0],
      emi,
      interest: interestPayment,
      principal: principalPayment,
      balance: Math.max(0, Math.round(remainingBalance)),
      status: 'Pending'
    });
  }

  return schedule;
};

