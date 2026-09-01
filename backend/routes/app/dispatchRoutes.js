import express from 'express';
import prisma from '../../config/prisma.js';

const router = express.Router();

// Store dispatch info
router.post('/', async (req, res) => {
  try {
    const { serialNumber, dispatchData } = req.body;
    if (!serialNumber) return res.status(400).json({ message: 'Serial number is required' });

    // Update or insert
    const existing = await prisma.dispatches.findUnique({ where: { serialNumber } });
    let dispatch;
    if (existing) {
      dispatch = await prisma.dispatches.update({
        where: { serialNumber },
        data: { ...dispatchData, updatedAt: new Date() }
      });
    } else {
      const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      dispatch = await prisma.dispatches.create({
        data: { ...dispatchData, serialNumber, id: newId, createdAt: new Date(), updatedAt: new Date() }
      });
    }
    res.json({ ...dispatch, _id: dispatch.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dispatch info
router.get('/:serialNumber', async (req, res) => {
  try {
    const dispatch = await prisma.dispatches.findUnique({ where: { serialNumber: req.params.serialNumber } });
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });
    res.json({ ...dispatch, _id: dispatch.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
