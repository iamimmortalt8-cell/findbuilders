import { Router } from 'express';
import { ProductService } from '../services/productService.js';
import { VoteService } from '../services/voteService.js';
import { CommentService } from '../services/commentService.js';
import { verifyToken, optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  productSubmissionSchema,
  productUpdateSchema,
  productIdSchema,
  productFiltersSchema,
  voteSchema,
  commentSchema,
  commentUpdateSchema,
  userIdSchema,
} from '../lib/validators.js';
import multer from 'multer';

const router = Router();
const productService = new ProductService();
const voteService = new VoteService();
const commentService = new CommentService();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

router.get('/', validate(productFiltersSchema), asyncHandler(async (req, res) => {
  const { products, count } = await productService.getProducts(req.query as any);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  res.json({
    data: products,
    count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  });
}));

router.get('/my-products', verifyToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const products = await productService.getUserProducts(req.user!.sub);
  res.json({ data: products });
}));

router.get('/user/:id', validate(userIdSchema), asyncHandler(async (req, res) => {
  const products = await productService.getPublicUserProducts(req.params.id);
  res.json({ data: products });
}));

router.get('/:id', optionalAuth, validate(productIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const product = await productService.getProductById(req.params.id, req.user?.sub);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ data: product });
}));

router.post('/', verifyToken, validate(productSubmissionSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const product = await productService.createProduct(req.body, req.user!.sub);
  res.status(201).json({ data: product, message: 'Product submitted for review' });
}));

router.patch('/:id', verifyToken, validate(productUpdateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.user!.sub, req.userProfile?.role === 'admin');
  res.json({ data: product, message: 'Product updated' });
}));

router.delete('/:id', verifyToken, validate(productIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  await productService.deleteProduct(req.params.id, req.user!.sub, req.userProfile?.role === 'admin');
  res.json({ message: 'Product deleted' });
}));

router.post('/:id/image', verifyToken, upload.single('image'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = await productService.uploadProductImage(req.params.id, req.user!.sub, req.file.buffer, req.file.originalname, req.file.mimetype);
  res.json({ data: { imageUrl: url }, message: 'Image uploaded' });
}));

router.post('/:id/screenshots', verifyToken, upload.array('screenshots', 10), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  const urls = await productService.uploadProductScreenshots(req.params.id, req.user!.sub, files.map(f => ({
    buffer: f.buffer,
    fileName: f.originalname,
    contentType: f.mimetype,
  })));
  res.json({ data: { screenshots: urls }, message: 'Screenshots uploaded' });
}));

router.get('/:id/images', validate(productIdSchema), asyncHandler(async (req, res) => {
  const images = await productService.getProductImages(req.params.id);
  res.json({ data: images });
}));

router.delete('/images/:id', verifyToken, validate(productIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  await productService.deleteProductImage(req.params.id, req.user!.sub, req.userProfile?.role === 'admin');
  res.json({ message: 'Product image deleted' });
}));

router.post('/:id/vote', verifyToken, validate(voteSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await voteService.toggleVote(req.params.id, req.user!.sub);
  res.json({ data: result });
}));

router.get('/:id/vote', verifyToken, validate(productIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const voted = await voteService.checkUserVote(req.params.id, req.user!.sub);
  const count = await voteService.getVoteCount(req.params.id);
  res.json({ data: { voted, count } });
}));

router.get('/:id/comments', validate(productIdSchema), asyncHandler(async (req, res) => {
  const comments = await commentService.getComments(req.params.id);
  res.json({ data: comments });
}));

router.post('/:id/comments', verifyToken, validate(commentSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const comment = await commentService.addComment(req.params.id, req.user!.sub, req.body.content);
  res.status(201).json({ data: comment, message: 'Comment added' });
}));

router.patch('/comments/:id', verifyToken, validate(commentUpdateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const comment = await commentService.updateComment(req.params.id, req.user!.sub, req.body.content);
  res.json({ data: comment, message: 'Comment updated' });
}));

router.delete('/comments/:id', verifyToken, validate(commentUpdateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  await commentService.deleteComment(req.params.id, req.user!.sub, req.userProfile?.role === 'admin');
  res.json({ message: 'Comment deleted' });
}));

export default router;