import { Router } from 'express';
import { AdminService } from '../services/adminService.js';
import { ProductService } from '../services/productService.js';
import { verifyToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { adminApproveSchema, adminRejectSchema, adminUserRoleSchema, productIdSchema, productFiltersSchema, userIdSchema } from '../lib/validators.js';

const router = Router();
const adminService = new AdminService();
const productService = new ProductService();

router.get('/stats', verifyToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const stats = await adminService.getStats();
  res.json({ data: stats });
}));

router.get('/users', verifyToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const users = await adminService.getAllUsers();
  res.json({ data: users });
}));

router.get('/users/:id', verifyToken, requireAdmin, validate(userIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await adminService.getUserById(req.params.id);
  res.json({ data: user });
}));

router.patch('/users/:id/role', verifyToken, requireAdmin, validate(adminUserRoleSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await adminService.updateUserRole(req.params.id, req.body.role);
  res.json({ data: user, message: 'User role updated' });
}));

router.put('/users/:id/profile', verifyToken, requireAdmin, validate(userIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await adminService.updateUserProfile(req.params.id, req.body);
  res.json({ data: user, message: 'Profile updated successfully' });
}));

router.delete('/users/:id', verifyToken, requireAdmin, validate(productIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  await adminService.deleteUser(req.params.id);
  res.json({ message: 'User deleted' });
}));

router.get('/products', verifyToken, requireAdmin, validate(productFiltersSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const products = await adminService.getAllProducts();
  res.json({ data: products });
}));

router.get('/submissions', verifyToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const submissions = await adminService.getPendingSubmissions();
  res.json({ data: submissions });
}));

router.get('/submissions/:id', verifyToken, requireAdmin, validate(productIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const product = await productService.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  res.json({ data: product });
}));

router.post('/submissions/:id/approve', verifyToken, requireAdmin, validate(adminApproveSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const product = await productService.approveProduct(req.params.id);
  res.json({ data: product, message: 'Product approved' });
}));

router.post('/submissions/:id/reject', verifyToken, requireAdmin, validate(adminRejectSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const product = await productService.rejectProduct(req.params.id, req.body.reason);
  res.json({ data: product, message: 'Product rejected' });
}));

router.delete('/products/:id', verifyToken, requireAdmin, validate(productIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  await productService.deleteProduct(req.params.id, req.user!.sub, true);
  res.json({ message: 'Product deleted' });
}));

export default router;