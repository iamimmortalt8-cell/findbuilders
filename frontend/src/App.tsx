import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";

// Public Pages
import Home from "@/pages/public/Home";
import Products from "@/pages/public/Products";
import ProductDetail from "@/pages/public/ProductDetail";
import PublicProfile from "@/pages/public/PublicProfile";
import Features from "@/pages/public/Features";
import About from "@/pages/public/About";
import Terms from "@/pages/public/Terms";
import PrivacyPolicy from "@/pages/public/PrivacyPolicy";
import Support from "@/pages/public/Support";

// Auth Pages
import Login from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import AuthCallback from "@/pages/auth/AuthCallback";

// Builder Pages
import BuilderDashboard from "@/pages/builder/BuilderDashboard";
import EditProduct from "@/pages/builder/EditProduct";
import ProfileSettings from "@/pages/builder/ProfileSettings";
import AccountSettings from "@/pages/builder/AccountSettings";

function App() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-2 border-[#202A25] border-t-[#D8C7A5] animate-spin" />
                    </div>
                </div>
            }
        >
            <Routes>
                {/* Public Routes (with ClientLayout - Navbar + Footer) */}
                <Route path="/" element={<ClientLayout><Home /></ClientLayout>} />
                <Route path="/products" element={<ClientLayout><Products /></ClientLayout>} />
                <Route path="/product/:id" element={<ClientLayout><ProductDetail /></ClientLayout>} />
                <Route path="/profile/:id" element={<ClientLayout><PublicProfile /></ClientLayout>} />
                <Route path="/features" element={<ClientLayout><Features /></ClientLayout>} />
                <Route path="/about" element={<ClientLayout><About /></ClientLayout>} />
                <Route path="/terms" element={<ClientLayout><Terms /></ClientLayout>} />
                <Route path="/privacy-policy" element={<ClientLayout><PrivacyPolicy /></ClientLayout>} />
                <Route path="/support" element={<ClientLayout><Support /></ClientLayout>} />

                {/* Auth Routes (no layout) */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Builder Routes (no layout) */}
                <Route path="/builder" element={<BuilderDashboard />} />
                <Route path="/submit" element={<EditProduct />} />
                <Route path="/builder/product/:id/edit" element={<EditProduct />} />
                <Route path="/settings/profile" element={<ClientLayout><ProfileSettings /></ClientLayout>} />
                <Route path="/settings/account" element={<ClientLayout><AccountSettings /></ClientLayout>} />
            </Routes>
        </Suspense>
    );
}

export default App;
