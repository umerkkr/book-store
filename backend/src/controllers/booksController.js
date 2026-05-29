import { query } from '../db.js';
import { serializeBook } from '../utils.js';

export async function listBooks(req, res) {
  const { q = '', category = '' } = req.query;
  const result = await query(
    `SELECT * FROM books
     WHERE ($1 = '' OR title ILIKE $2 OR author ILIKE $2)
       AND ($3 = '' OR category ILIKE $4)
     ORDER BY created_at DESC`,
    [q, `%${q}%`, category, `%${category}%`]
  );
  res.json({ books: result.rows.map(serializeBook) });
}

export async function getBook(req, res) {
  const result = await query('SELECT * FROM books WHERE id = $1', [req.params.id]);
  const book = result.rows[0];
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }
  res.json({ book: serializeBook(book) });
}

export async function createBook(req, res) {
  const { title, author, description = '', price, stock = 0, coverUrl = '', category = '' } = req.body;
  const result = await query(
    `INSERT INTO books (title, author, description, price, stock, cover_url, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [title, author, description, price, stock, coverUrl, category]
  );
  res.status(201).json({ book: serializeBook(result.rows[0]) });
}

export async function updateBook(req, res) {
  const { title, author, description = '', price, stock = 0, coverUrl = '', category = '' } = req.body;
  const result = await query(
    `UPDATE books
     SET title = $1, author = $2, description = $3, price = $4, stock = $5, cover_url = $6, category = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [title, author, description, price, stock, coverUrl, category, req.params.id]
  );
  if (!result.rowCount) {
    return res.status(404).json({ message: 'Book not found' });
  }
  res.json({ book: serializeBook(result.rows[0]) });
}

export async function deleteBook(req, res) {
  const result = await query('DELETE FROM books WHERE id = $1', [req.params.id]);
  if (!result.rowCount) {
    return res.status(404).json({ message: 'Book not found' });
  }
  res.status(204).end();
}
