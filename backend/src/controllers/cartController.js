import { query } from '../db.js';
import { serializeBook } from '../utils.js';

export async function getCart(req, res) {
  const result = await query(
    `SELECT ci.id as cart_item_id, ci.quantity, b.* FROM cart_items ci
     JOIN books b ON b.id = ci.book_id
     WHERE ci.user_id = $1
     ORDER BY ci.created_at DESC`,
    [req.user.id]
  );
  const items = result.rows.map((row) => ({
    id: row.cart_item_id,
    quantity: row.quantity,
    book: serializeBook(row)
  }));
  res.json({ items });
}

export async function addToCart(req, res) {
  const { bookId, quantity = 1 } = req.body;
  await query(
    `INSERT INTO cart_items (user_id, book_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, book_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = NOW()`,
    [req.user.id, bookId, quantity]
  );
  return getCart(req, res);
}

export async function updateCartItem(req, res) {
  const { quantity } = req.body;
  if (quantity <= 0) {
    await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  } else {
    await query('UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3', [
      quantity,
      req.params.id,
      req.user.id
    ]);
  }
  return getCart(req, res);
}

export async function removeCartItem(req, res) {
  await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  return getCart(req, res);
}

export async function clearCart(userId) {
  await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
}
