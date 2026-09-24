import { supabaseAdmin } from '../lib/supabase.js';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { emailService } from '../email/index.js';
import type { AuthTokens, Profile, JWTPayload } from '../types/index.js';

export class AuthService {
  async signUp(email: string, password: string, displayName: string): Promise<AuthTokens> {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    if (error) {
      throw new AppError(400, error.message);
    }

    if (!data.user) {
      throw new AppError(500, 'Failed to create user');
    }

    const tokens = generateTokens({
      sub: data.user.id,
      email: data.user.email!,
      role: 'user',
    });

    // Send idempotent welcome email (failure must never block signup)
    emailService.sendWelcomeEmail(data.user.id, data.user.email!, displayName).catch(err => {
      console.error('[AuthService] Non-blocking error sending welcome email:', err);
    });

    return tokens;
  }

  async signIn(email: string, password: string): Promise<AuthTokens> {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!data.session || !data.user) {
      throw new AppError(401, 'Authentication failed');
    }

    const tokens = generateTokens({
      sub: data.user.id,
      email: data.user.email!,
      role: 'user',
    });

    return tokens;
  }

  async signInWithOAuth(provider: 'google'): Promise<{ url: string }> {
    const frontendUrls = process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'];
    const redirectUrl = `${frontendUrls[0]}/auth/callback`;

    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      throw new AppError(400, error.message);
    }

    return { url: data.url };
  }

  async exchangeSupabaseToken(supabaseAccessToken: string): Promise<AuthTokens> {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(supabaseAccessToken);

    if (error || !user) {
      throw new AppError(401, 'Invalid Supabase token');
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const tokens = generateTokens({
      sub: user.id,
      email: user.email!,
      role: profile?.role || 'user',
    });

    // Send idempotent welcome email for OAuth account creations (checks user_metadata.welcome_email_sent)
    emailService.sendWelcomeEmail(user.id, user.email!).catch(err => {
      console.error('[AuthService] Non-blocking error sending OAuth welcome email:', err);
    });

    return tokens;
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', decoded.sub)
        .single();

      const tokens = generateTokens({
        sub: decoded.sub,
        email: decoded.email,
        role: profile?.role || 'user',
      });

      return { accessToken: tokens.access_token };
    } catch {
      throw new AppError(401, 'Invalid refresh token');
    }
  }

  async getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    return data as Profile;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.display_name !== undefined) dbUpdates.display_name = updates.display_name;
    if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.role !== undefined) dbUpdates.role = updates.role;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    return data as Profile;
  }

  async uploadAvatar(userId: string, file: Buffer, fileName: string, contentType: string): Promise<string> {
    const path = `${userId}/${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(path, file, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new AppError(400, uploadError.message);
    }

    const { data: urlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(path);

    await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return urlData.publicUrl;
  }

  async deleteAvatar(userId: string): Promise<void> {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (profile?.avatar_url) {
      const urlParts = profile.avatar_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const path = `${userId}/${fileName}`;

      await supabaseAdmin.storage.from('avatars').remove([path]);
    }

    await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', userId);
  }

  async signOut(): Promise<void> {
    // JWT tokens are stateless, client just discards them
  }
}