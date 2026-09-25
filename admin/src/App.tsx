import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/auth/AdminLogin";
import AdminForgotPassword from "./pages/auth/AdminForgotPassword";
import AdminResetPassword from "./pages/auth/AdminResetPassword";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminSubmissionDetail from "./pages/admin/AdminSubmissionDetail";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";

export default function App() {
  return (
    <Routes>
      {/* Root domain aliases for standalone Vercel deployment */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/admin/forgot-password" replace />} />
      <Route path="/reset-password" element={<Navigate to="/admin/reset-password" replace />} />
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="/submissions" element={<Navigate to="/admin/submissions" replace />} />
      <Route path="/submissions/:id" element={<AdminLayout><AdminSubmissionDetail /></AdminLayout>} />
      <Route path="/products" element={<Navigate to="/admin/products" replace />} />
      <Route path="/users" element={<Navigate to="/admin/users" replace />} />

      {/* Primary Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />
      <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/submissions" element={<AdminLayout><AdminSubmissions /></AdminLayout>} />
      <Route path="/admin/submissions/:id" element={<AdminLayout><AdminSubmissionDetail /></AdminLayout>} />
      <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
      <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
