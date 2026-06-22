import express from 'express';
import SystemConfig from '../../models/SystemConfig.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Get config
router.get('/', protect, async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update config
router.put('/', protect, async (req, res) => {
  try {
    const config = await SystemConfig.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
