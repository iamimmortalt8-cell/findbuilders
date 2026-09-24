import { Router } from 'express';
import { CategoryService } from '../services/categoryService.js';
import { verifyToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { categorySchema, categoryUpdateSchema } from '../lib/validators.js';

const router = Router();
const categoryService = new CategoryService();

router.get('/', asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  res.json({ data: categories });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json({ data: category });
}));

router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json({ data: category });
}));

router.post('/', verifyToken, requireAdmin, validate(categorySchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({ data: category, message: 'Category created' });
}));

router.patch('/:id', verifyToken, requireAdmin, validate(categoryUpdateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.json({ data: category, message: 'Category updated' });
}));

router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.json({ message: 'Category deleted' });
}));

export default router;