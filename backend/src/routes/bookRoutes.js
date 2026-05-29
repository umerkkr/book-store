import { Router } from 'express';
import { createBook, deleteBook, getBook, listBooks, updateBook } from '../controllers/booksController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', listBooks);
router.get('/:id', getBook);
router.post('/', requireAuth, requireAdmin, createBook);
router.put('/:id', requireAuth, requireAdmin, updateBook);
router.delete('/:id', requireAuth, requireAdmin, deleteBook);

export default router;
