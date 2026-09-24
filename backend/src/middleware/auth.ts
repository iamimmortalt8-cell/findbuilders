import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../lib/supabase.js';
import type { JWTPayload, UserRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  userProfile?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    role: UserRole;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url, bio, role')
      .eq('id', decoded.sub)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PGRST116 is "Results contain 0 rows"
        res.status(401).json({ error: 'User profile not found' });
      } else {
        res.status(500).json({ error: 'Database error verifying user' });
      }
      return;
    }

    if (!profile) {
      res.status(401).json({ error: 'Invalid token or user not found' });
      return;
    }

    req.user = decoded;
    req.userProfile = profile;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.userProfile || req.userProfile.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url, bio, role')
      .eq('id', decoded.sub)
      .single();

    if (profile) {
      req.user = decoded;
      req.userProfile = profile;
    }
    next();
  } catch {
    next();
  }
};

export const generateTokens = (payload: Omit<JWTPayload, 'iat' | 'exp'>): { access_token: string; refresh_token: string } => {
  const access_token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refresh_token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  return { access_token, refresh_token };
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};