import { Router } from 'express';
import { AccountService } from '../services/accountService.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { deleteAccountSchema } from '../lib/validators.js';
import { AuthenticatedRequest, verifyToken } from '../middleware/auth.js';

const router = Router();
const accountService = new AccountService();

router.delete('/', verifyToken, validate(deleteAccountSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.user?.sub) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  await accountService.deleteOwnAccount(req.user.sub, req.user.email);
  res.json({ data: { deleted: true }, message: 'Account deleted successfully' });
}));

export default router;
