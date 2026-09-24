"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { AuthComponent } from "@/components/ui/sign-up";

const FindBuildersLogo = () => (
  <div className="bg-[#214C37] text-[#D8C7A5] rounded-md p-1.5 shadow-sm">
    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  </div>
);

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  const handleSignUp = async (email: string, password: string) => {
    const { error } = await signUp(email, password, "");
    if (error) {
      return { error: { message: error.message } };
    }
    return { error: null };
  };

  return (
    <AuthComponent
      logo={<FindBuildersLogo />}
      brandName="FindBuilders"
      onSignUp={handleSignUp}
      onGoogleSignIn={() => signInWithGoogle()}
      onNavigateToLogin={() => navigate("/login")}
      onSignUpSuccess={() => navigate("/login")}
    />
  );
}
