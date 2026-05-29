CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  cover_url TEXT NOT NULL DEFAULT '',
  category VARCHAR(120) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(30) NOT NULL DEFAULT 'cash_on_delivery',
  shipping_name VARCHAR(120) NOT NULL,
  shipping_phone VARCHAR(50) NOT NULL,
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES books(id),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

INSERT INTO books (title, author, description, price, stock, cover_url, category)
SELECT 'The Pragmatic Programmer', 'Andrew Hunt', 'A classic guide to pragmatic software development.', 29.99, 12, '', 'Programming'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'The Pragmatic Programmer');

INSERT INTO books (title, author, description, price, stock, cover_url, category)
SELECT 'Atomic Habits', 'James Clear', 'Small habits that lead to remarkable results.', 18.50, 20, '', 'Self Help'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'Atomic Habits');

INSERT INTO books (title, author, description, price, stock, cover_url, category)
SELECT 'Clean Code', 'Robert C. Martin', 'A handbook of agile software craftsmanship.', 32.00, 14, '', 'Programming'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'Clean Code');

INSERT INTO books (title, author, description, price, stock, cover_url, category)
SELECT 'The Psychology of Money', 'Morgan Housel', 'Timeless lessons on wealth, greed, and happiness.', 21.99, 16, '', 'Finance'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'The Psychology of Money');

INSERT INTO books (title, author, description, price, stock, cover_url, category)
SELECT 'Deep Work', 'Cal Newport', 'Rules for focused success in a distracted world.', 19.75, 10, '', 'Productivity'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'Deep Work');

INSERT INTO books (title, author, description, price, stock, cover_url, category)
SELECT 'Rich Dad Poor Dad', 'Robert T. Kiyosaki', 'What the rich teach their kids about money.', 17.25, 18, '', 'Finance'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'Rich Dad Poor Dad');

INSERT INTO books (title, author, description, price, stock, cover_url, category)
SELECT 'The Alchemist', 'Paulo Coelho', 'A journey of self-discovery and dreams.', 15.49, 22, '', 'Fiction'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'The Alchemist');

INSERT INTO books (title, author, description, price, stock, cover_url, category)
SELECT 'Thinking, Fast and Slow', 'Daniel Kahneman', 'An exploration of the two systems that drive the way we think.', 24.95, 11, '', 'Psychology'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'Thinking, Fast and Slow');
