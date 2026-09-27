"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { AuthComponent } from "@/components/ui/sign-up";

const FindBuildersLogo = () => (
  <img src="/findbuilderslogo.png" alt="FindBuilders Logo" className="h-7 w-7 object-contain" />
);

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const isGoogleSubmittingRef = React.useRef(false);

  const handleSignUp = async (email: string, password: string) => {
    const { error } = await signUp(email, password, "");
    if (error) {
      return { error: { message: error.message } };
    }
    return { error: null };
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleSubmittingRef.current) return;
    isGoogleSubmittingRef.current = true;
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        isGoogleSubmittingRef.current = false;
      }
    } catch {
      isGoogleSubmittingRef.current = false;
    }
  };

  return (
    <AuthComponent
      logo={<FindBuildersLogo />}
      brandName="FindBuilders"
      onSignUp={handleSignUp}
      onGoogleSignIn={handleGoogleSignIn}
      onNavigateToLogin={() => navigate("/login")}
      onSignUpSuccess={() => navigate("/login")}
    />
  );
}
