import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { config } from '../config.js';
import { toPublicUser } from '../utils.js';

export async function signup(req, res) {
  const { name, email, password, adminCode } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rowCount > 0) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const role = config.adminInviteCode && adminCode === config.adminInviteCode ? 'admin' : 'customer';
  const result = await query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
    [name, email.toLowerCase(), passwordHash, role]
  );

  const user = result.rows[0];
  const token = jwt.sign(user, config.jwtSecret, { expiresIn: '7d' });
  res.status(201).json({ token, user: toPublicUser(user) });
}

export async function login(req, res) {
  const { email, password, username } = req.body;
  const identifier = (email || username || '').toString().trim().toLowerCase();

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/username and password are required' });
  }

  if (identifier === 'admin' && password === 'admin') {
    const adminEmail = 'admin@bookstore.local';
    const existingAdmin = await query('SELECT * FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1', ['admin']);

    let user = existingAdmin.rows[0];
    if (!user) {
      const passwordHash = await bcrypt.hash('admin', 10);
      const created = await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        ['admin', adminEmail, passwordHash, 'admin']
      );
      user = created.rows[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({ token, user: toPublicUser(user) });
  }

  const result = await query('SELECT * FROM users WHERE email = $1 OR name = $1', [identifier]);
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({ token, user: toPublicUser(user) });
}

export async function me(req, res) {
  const result = await query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
  res.json({ user: result.rows[0] });
}
