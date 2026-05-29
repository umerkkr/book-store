import { Router } from 'express';
import { addToCart, getCart, removeCartItem, updateCartItem } from '../controllers/cartController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeCartItem);

export default router;
