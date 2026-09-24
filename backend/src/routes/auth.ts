import { Router } from 'express';
import { AuthService } from '../services/authService.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { signUpSchema, signInSchema, refreshTokenSchema, exchangeTokenSchema } from '../lib/validators.js';
import { AuthenticatedRequest, verifyToken } from '../middleware/auth.js';

const router = Router();
const authService = new AuthService();

router.post('/signup', authLimiter, validate(signUpSchema), asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.body;
  const tokens = await authService.signUp(email, password, displayName);
  res.status(201).json({ data: tokens, message: 'Account created successfully' });
}));

router.post('/signin', authLimiter, validate(signInSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const tokens = await authService.signIn(email, password);
  res.json({ data: tokens, message: 'Signed in successfully' });
}));

router.post('/oauth/google', authLimiter, asyncHandler(async (req, res) => {
  const { url } = await authService.signInWithOAuth('google');
  res.json({ data: { url }, message: 'Redirect to Google OAuth' });
}));

router.post('/exchange', authLimiter, validate(exchangeTokenSchema), asyncHandler(async (req, res) => {
  const { supabaseAccessToken } = req.body;
  const tokens = await authService.exchangeSupabaseToken(supabaseAccessToken);
  res.json({ data: tokens, message: 'Token exchanged successfully' });
}));

router.post('/refresh', validate(refreshTokenSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const { accessToken } = await authService.refreshAccessToken(refreshToken);
  res.json({ data: { accessToken, access_token: accessToken }, message: 'Token refreshed' });
}));

router.get('/me', verifyToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.userProfile || !req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    data: {
      ...req.userProfile,
      email: req.user.email,
    },
  });
}));

router.post('/signout', asyncHandler(async (req, res) => {
  await authService.signOut();
  res.json({ message: 'Signed out successfully' });
}));

export default router;