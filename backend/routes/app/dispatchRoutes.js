import express from 'express';
import Dispatch from '../../models/Dispatch.js';

const router = express.Router();

// Store dispatch info
router.post('/', async (req, res) => {
  try {
    const { serialNumber, dispatchData } = req.body;
    if (!serialNumber) return res.status(400).json({ message: 'Serial number is required' });

    // Update or insert
    const dispatch = await Dispatch.findOneAndUpdate(
      { serialNumber },
      { ...dispatchData, serialNumber },
      { new: true, upsert: true }
    );
    res.json(dispatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dispatch info
router.get('/:serialNumber', async (req, res) => {
  try {
    const dispatch = await Dispatch.findOne({ serialNumber: req.params.serialNumber });
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });
    res.json(dispatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
