import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { initializeAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('OAuth error:', error, errorDescription);
        navigate('/login?error=oauth_failed');
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          navigate('/login?error=oauth_failed');
          return;
        }

        if (session?.access_token) {
          const tokens = await api.exchangeSupabaseToken(session.access_token);
          localStorage.setItem('access_token', tokens.access_token);
          localStorage.setItem('refresh_token', tokens.refresh_token);
          await initializeAuth();
          navigate('/', { replace: true });
        } else {
          console.error('No session found after OAuth');
          navigate('/login?error=oauth_no_session');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        navigate('/login?error=oauth_failed');
      }
    };

    handleCallback();
  }, [navigate, searchParams, initializeAuth]);

  return (
    <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-[#202A25] border-t-[#D8C7A5] animate-spin" />
      </div>
    </div>
  );
}
