import express from 'express';
const router = express.Router();
import { updateSettings, getSettings, getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

router.put('/settings', protect, updateSettings);
router.get('/settings/:userId', protect, getSettings);
router.get('/', protect, getUsers);
router.post('/', protect, createUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

export default router;
