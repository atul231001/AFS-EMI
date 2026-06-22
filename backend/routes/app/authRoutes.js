import express from 'express';
const router = express.Router();
import { login, register, forgotPassword, resetPassword, forceResetPassword } from '../../controllers/app/authController.js';
import { protect } from '../../middleware/authMiddleware.js';

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/force-reset-password', protect, forceResetPassword);

export default router;
