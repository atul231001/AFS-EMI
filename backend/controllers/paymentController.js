import Payment from '../models/Payment.js';
import Loan from '../models/Loan.js';

export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: 'loanId',
        populate: { path: 'customerId' }
      })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPayment = async (req, res) => {
  const payment = new Payment(req.body);
  try {
    const newPayment = await payment.save();
    
    // Update loan schedule
    const loan = await Loan.findById(req.body.loanId);
    if (loan) {
      const count = req.body.count || 1;
      let settled = 0;
      for (let i = 0; i < loan.schedule.length; i++) {
        if (loan.schedule[i].status === 'Pending' && settled < count) {
          loan.schedule[i].status = 'Paid';
          settled++;
        }
      }
      if (settled > 0) {
        await loan.save();
      }
    }
    
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
