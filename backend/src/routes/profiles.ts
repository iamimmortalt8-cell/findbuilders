import { Router } from 'express';
import { ProfileService } from '../services/profileService.js';
import { AuthService } from '../services/authService.js';
import { verifyToken, optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { updateProfileSchema } from '../lib/validators.js';
import multer from 'multer';

const router = Router();
const profileService = new ProfileService();
const authService = new AuthService();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

router.get('/me', verifyToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const profile = await profileService.getProfile(req.user!.sub);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json({ data: profile });
}));

router.get('/check-username/:username', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const isUsed = await profileService.checkUsername(req.params.username, req.user?.sub);
  res.json({ data: { isUsed } });
}));

router.get('/search', asyncHandler(async (req, res) => {
  const q = (req.query.q as string) || '';
  const limit = parseInt(req.query.limit as string) || 10;
  const profiles = await profileService.searchProfiles(q, limit);
  res.json({ data: profiles });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const profile = await profileService.getPublicProfile(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json({ data: profile });
}));

router.patch('/me', verifyToken, validate(updateProfileSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const profile = await profileService.updateProfile(req.user!.sub, req.body);
  res.json({ data: profile, message: 'Profile updated' });
}));

router.post('/me/avatar', verifyToken, upload.single('avatar'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = await authService.uploadAvatar(req.user!.sub, req.file.buffer, req.file.originalname, req.file.mimetype);
  res.json({ data: { avatarUrl: url }, message: 'Avatar uploaded' });
}));

router.delete('/me/avatar', verifyToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await authService.deleteAvatar(req.user!.sub);
  res.json({ message: 'Avatar deleted' });
}));

export default router;