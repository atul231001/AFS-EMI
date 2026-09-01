import express from 'express';
import prisma from '../../config/prisma.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Get config
router.get('/', protect, async (req, res) => {
  try {
    let config = await prisma.systemconfigs.findFirst();
    if (!config) {
      const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      config = await prisma.systemconfigs.create({ data: { id: newId, createdAt: new Date(), updatedAt: new Date() } });
    }
    res.json({ ...config, _id: config.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update config
router.put('/', protect, async (req, res) => {
  try {
    let config = await prisma.systemconfigs.findFirst();
    let updatedConfig;
    if (config) {
      updatedConfig = await prisma.systemconfigs.update({
        where: { id: config.id },
        data: { ...req.body, updatedAt: new Date() }
      });
    } else {
      const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      updatedConfig = await prisma.systemconfigs.create({
        data: { ...req.body, id: newId, createdAt: new Date(), updatedAt: new Date() }
      });
    }
    res.json({ ...updatedConfig, _id: updatedConfig.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
