import { query, pool } from '../db.js';

export async function createOrder(req, res) {
  const { shippingName, shippingPhone, shippingAddress } = req.body;
  if (!shippingName || !shippingPhone || !shippingAddress) {
    return res.status(400).json({ message: 'Shipping details are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cartResult = await client.query(
      `SELECT ci.id as cart_id, ci.quantity, b.id as book_id, b.title, b.author, b.price, b.stock
       FROM cart_items ci
       JOIN books b ON b.id = ci.book_id
       WHERE ci.user_id = $1
       FOR UPDATE`,
      [req.user.id]
    );

    if (cartResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const totalAmount = cartResult.rows.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_name, shipping_phone, shipping_address)
       VALUES ($1, $2, 'pending', 'cash_on_delivery', $3, $4, $5)
       RETURNING *`,
      [req.user.id, totalAmount, shippingName, shippingPhone, shippingAddress]
    );

    const order = orderResult.rows[0];
    const invoiceNumber = `INV-${String(order.id).padStart(6, '0')}`;
    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, book_id, title, author, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.book_id, item.title, item.author, item.price, item.quantity]
      );
      await client.query('UPDATE books SET stock = stock - $1 WHERE id = $2', [item.quantity, item.book_id]);
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    await client.query('COMMIT');
    res.status(201).json({
      order: {
        ...order,
        invoiceNumber,
        totalAmount: Number(order.total_amount),
        paymentMethod: order.payment_method,
        shippingName,
        shippingPhone,
        shippingAddress,
        items: cartResult.rows.map((item) => ({
          id: item.book_id,
          title: item.title,
          author: item.author,
          unitPrice: Number(item.price),
          quantity: item.quantity,
          lineTotal: Number(item.price) * item.quantity
        }))
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listOrders(req, res) {
  const orders = await query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  const orderItems = await query(
    `SELECT * FROM order_items WHERE order_id = ANY($1::int[])`,
    [orders.rows.map((o) => o.id)]
  );
  const itemsByOrder = new Map();
  for (const item of orderItems.rows) {
    if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
    itemsByOrder.get(item.order_id).push(item);
  }
  res.json({
    orders: orders.rows.map((order) => ({
      ...order,
      totalAmount: Number(order.total_amount),
      items: (itemsByOrder.get(order.id) || []).map((item) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity
      }))
    }))
  });
}

export async function listAllOrders(req, res) {
  const result = await query(
    `SELECT o.*, u.name as customer_name, u.email as customer_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );
  res.json({ orders: result.rows });
}

export async function updateOrderStatus(req, res) {
  const { status } = req.body;
  const result = await query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
  if (!result.rowCount) return res.status(404).json({ message: 'Order not found' });
  res.json({ order: result.rows[0] });
}
