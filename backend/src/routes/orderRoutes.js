import { Router } from 'express';
import { createOrder, listAllOrders, listOrders, updateOrderStatus } from '../controllers/orderController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.post('/', createOrder);
router.get('/', listOrders);
router.get('/admin/all', requireAdmin, listAllOrders);
router.patch('/:id/status', requireAdmin, updateOrderStatus);

export default router;
