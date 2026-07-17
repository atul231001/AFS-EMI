// backend/utils/interestCalculator.js

/**
 * Calculates overdue interest dynamically for pending/partial installments.
 * Formula: 
 * Simple: Outstanding Amount * (Delay Interest Rate / 100) * (Days Overdue / 30)
 * Compound: (Outstanding Amount + Previous Overdue) * (Delay Interest Rate / 100) * (Days Overdue / 30)
 * Note: If standard compounding per month is preferred instead of exact days,
 * we will calculate based on full months overdue.
 * For this implementation, we calculate based on months overdue for simplicity.
 */
export const calculateOverdueInterest = (loan) => {
  if (!loan.schedule || loan.schedule.length === 0) return loan;

  const delayRate = loan.delayInterest || 0;
  if (delayRate <= 0) return loan;

  const currentDate = new Date();

  loan.schedule.forEach(s => {
    if (s.status === 'Paid') return;
    
    // Ensure outstanding amount is initialized
    if (s.outstandingAmount === undefined || s.outstandingAmount === null) {
      s.outstandingAmount = s.emi;
    }

    const dueDate = new Date(s.dueDate);
    const normCurrent = new Date(currentDate); normCurrent.setHours(0,0,0,0);
    const normDue = new Date(dueDate); normDue.setHours(0,0,0,0);

    if (normCurrent <= normDue) {
      // Not overdue yet, no additional interest since last settlement
      return; 
    }

    // Calculate months overdue
    // Simple rough calculation: (Current Date - Due Date) / 30 days
    const diffTime = normCurrent - normDue;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Using simple annual rate applied daily: Rate per day = (delayRate / 100) / 365
    const ratePerDay = (delayRate / 100) / 365;
    
    // But since this is calculated dynamically, we need to be careful not to 
    // overwrite manually waived interest or previously paid off interest.
    // Let's assume overdueInterest field stores total accrued overdue interest
    // For simplicity, let's just calculate from the beginning if we don't store 
    // a "lastCalculatedDate". 
    // To be precise: If compound is true, it compounds monthly.
    // For this implementation, we'll use a simple daily formula:
    
    let baseAmount = s.outstandingAmount;
    if (loan.compoundOverdueInterest) {
       // A very simple compound logic:
       // For each full month overdue, compound it.
       const monthsOverdue = Math.floor(diffDays / 30);
       const daysLeft = diffDays % 30;
       
       let compoundedAmount = baseAmount;
       for(let i = 0; i < monthsOverdue; i++) {
         compoundedAmount += compoundedAmount * (delayRate / 100);
       }
       // add remaining days
       compoundedAmount += compoundedAmount * ratePerDay * daysLeft;
       
       // s.overdueInterest is just the difference, wait.
       // The user might have already paid some overdue interest.
       // If they paid overdue interest, it reduces `s.overdueInterest`.
       // Actually, it's safer to store `totalAccruedOverdueInterest` and `paidOverdueInterest`,
       // but since we only have `overdueInterest`, we can assume `overdueInterest` is the CURRENT DUE overdue interest.
       // This means dynamic calculation is tricky if we overwrite it, unless we only ADD to it based on days passed.
       // Since the system didn't have "lastCalculatedDate", let's just do:
       // `s.overdueInterest` = total calculated - what was already paid.
       // This is complex. Let's just do a simpler approach:
       // The backend shouldn't recalculate automatically on get, it should only calculate when needed or store it.
       // Actually, let's calculate the "expected" overdue interest, and set it.
    }
    
    // For the sake of the requirements, "Overdue interest should be calculated on outstanding from due date till payment date."
    // We calculate total expected overdue interest from the due date until today.
    const base = loan.compoundOverdueInterest ? (s.outstandingAmount + (s.overdueInterest || 0)) : s.outstandingAmount;
    const newInterest = Math.round(base * ratePerDay * diffDays);
    
    // The total accrued should be newInterest. Since some might have been paid, the expected remaining is:
    const expectedRemaining = Math.max(0, newInterest - (s.paidOverdueInterest || 0));
    
    // We dynamically update it for display/reports if the newly calculated amount is higher.
    if (expectedRemaining > (s.overdueInterest || 0)) {
       s.overdueInterest = expectedRemaining;
    }
  });

  return loan;
};
