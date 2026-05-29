import React from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';
import { api } from './api';

function Layout({ children }) {
  const auth = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          BookNest
        </Link>
        <nav className="nav">
          <Link to="/">Books</Link>
          {auth.user && <Link to="/cart">Cart</Link>}
          {auth.user && <Link to="/orders">Orders</Link>}
          {auth.user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {auth.user ? <button onClick={auth.logout}>Logout</button> : <Link to="/login">Login</Link>}
          {!auth.user && <Link to="/signup">Sign up</Link>}
        </nav>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}

function Protected({ children }) {
  const auth = useAuth();
  if (!auth.loading && !auth.user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }) {
  const auth = useAuth();
  if (!auth.loading && auth.user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function BooksPage() {
  const [books, setBooks] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState('All');
  const auth = useAuth();

  const load = async (query = '', category = '') => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    const data = await api.books(params.toString() ? `?${params.toString()}` : '');
    setBooks(data.books);
    setLoading(false);
  };

  React.useEffect(() => {
    load();
  }, []);

  const categories = ['All', 'Programming', 'Finance', 'Productivity', 'Fiction', 'Psychology', 'Self Help'];

  return (
    <div className="stack-xl">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Curated reading, faster discovery</span>
          <h1>Find your next great book in a store that feels alive.</h1>
          <p>
            Browse hand-picked titles, search by book name or author, and add favorites to cart in a clean
            premium interface.
          </p>
          <div className="hero-actions">
            <button onClick={() => document.getElementById('book-search')?.focus()}>Search books</button>
            <Link to={auth.user ? '/cart' : '/signup'} className="ghost-button">
              {auth.user ? 'Go to cart' : 'Create account'}
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <strong>{books.length}</strong>
              <span>books available</span>
            </div>
            <div>
              <strong>COD</strong>
              <span>cash on delivery</span>
            </div>
            <div>
              <strong>Fast</strong>
              <span>search and checkout</span>
            </div>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-card">
            <span className="pill">Featured</span>
            <h3>The modern bookstore dashboard</h3>
            <p>Elegant cards, useful search, and a catalog that works immediately on a fresh install.</p>
          </div>
          <div className="hero-grid">
            <div className="mini-card">Clean catalog</div>
            <div className="mini-card">Book detail pages</div>
            <div className="mini-card">Cart + order flow</div>
            <div className="mini-card">Admin tools</div>
          </div>
        </div>
      </section>

      <section className="toolbar panel">
        <form
          className="searchbar"
          onSubmit={(e) => {
            e.preventDefault();
            load(q, activeFilter === 'All' ? '' : activeFilter);
          }}
        >
          <input
            id="book-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by book name or author"
          />
          <button type="submit">Search</button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setQ('');
              setActiveFilter('All');
              load();
            }}
          >
            Reset
          </button>
        </form>

        <div className="filter-row">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={category === activeFilter ? 'filter-chip active' : 'filter-chip'}
              onClick={() => {
                setActiveFilter(category);
                load(q, category === 'All' ? '' : category);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <section className="grid">
          {books.map((book) => (
            <article key={book.id} className="card book-card">
              <div className="book-top">
                <span className="category-tag">{book.category || 'General'}</span>
                <strong className="price">${book.price.toFixed(2)}</strong>
              </div>
              <h3>{book.title}</h3>
              <p className="author">{book.author}</p>
              <p className="description">{book.description}</p>
              <div className="card-actions">
                <Link to={`/books/${book.id}`} className="ghost-link">
                  View details
                </Link>
                {auth.user && (
                  <button
                    onClick={async () => {
                      await api.addToCart({ bookId: book.id, quantity: 1 });
                      alert('Added to cart');
                    }}
                  >
                    Add to cart
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = React.useState(null);
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    api.book(id).then((data) => setBook(data.book));
  }, [id]);

  if (!book) return <p>Loading...</p>;

  return (
    <section className="panel detail-layout">
      <div className="detail-hero">
        <span className="pill">{book.category || 'General'}</span>
        <h1>{book.title}</h1>
        <p className="author">By {book.author}</p>
        <p className="description">{book.description}</p>
      </div>
      <div className="detail-sidebar">
        <div className="detail-price">${book.price.toFixed(2)}</div>
        <p>Stock: {book.stock}</p>
        <div className="row">
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          <button
            onClick={async () => {
              await api.addToCart({ bookId: book.id, quantity });
              alert('Added to cart');
            }}
          >
            Add to cart
          </button>
        </div>
      </div>
    </section>
  );
}

function AuthForm({ mode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({ name: '', email: '', password: '', adminCode: '' });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') await auth.login(form.email, form.password);
      else await auth.signup(form.name, form.email, form.password, form.adminCode);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="panel auth-form" onSubmit={submit}>
      <span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create your account'}</span>
      <h1>{mode === 'login' ? 'Login' : 'Sign up'}</h1>
      {error && <p className="error">{error}</p>}
      {mode === 'signup' && (
        <>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input
            placeholder="Admin invite code optional"
            value={form.adminCode}
            onChange={(e) => setForm({ ...form, adminCode: e.target.value })}
          />
        </>
      )}
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
    </form>
  );
}

function CartPage() {
  const [cart, setCart] = React.useState([]);
  const [shipping, setShipping] = React.useState({ shippingName: '', shippingPhone: '', shippingAddress: '' });
  const [message, setMessage] = React.useState('');

  const load = async () => {
    const data = await api.cart();
    setCart(data.items);
  };

  React.useEffect(() => {
    load();
  }, []);

  const total = cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0);

  return (
    <div className="stack-xl">
      <div className="panel">
        <h1>Cart</h1>
        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div className="stack">
            {cart.map((item) => (
              <div key={item.id} className="cart-row">
                <div>
                  <strong>{item.book.title}</strong>
                  <p>${item.book.price.toFixed(2)}</p>
                </div>
                <div className="row">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={async (e) => {
                      await api.updateCartItem(item.id, { quantity: Number(e.target.value) });
                      load();
                    }}
                  />
                  <button
                    onClick={async () => {
                      await api.removeCartItem(item.id);
                      load();
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <strong>Total: ${total.toFixed(2)}</strong>
          </div>
        )}
      </div>

      <form
        className="panel auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setMessage('');
          await api.createOrder(shipping);
          setMessage('Order placed successfully. Cart cleared.');
          setShipping({ shippingName: '', shippingPhone: '', shippingAddress: '' });
          load();
        }}
      >
        <h2>Checkout</h2>
        {message && <p className="success">{message}</p>}
        <input
          placeholder="Recipient name"
          value={shipping.shippingName}
          onChange={(e) => setShipping({ ...shipping, shippingName: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={shipping.shippingPhone}
          onChange={(e) => setShipping({ ...shipping, shippingPhone: e.target.value })}
        />
        <textarea
          placeholder="Shipping address"
          value={shipping.shippingAddress}
          onChange={(e) => setShipping({ ...shipping, shippingAddress: e.target.value })}
        />
        <button type="submit">Place cash-on-delivery order</button>
      </form>
    </div>
  );
}

function OrdersPage() {
  const [orders, setOrders] = React.useState([]);
  React.useEffect(() => {
    api.orders().then((data) => setOrders(data.orders));
  }, []);

  return (
    <div className="stack">
      <h1>My Orders</h1>
      {orders.map((order) => (
        <div key={order.id} className="panel">
          <strong>Order #{order.id}</strong>
          <p>Status: {order.status}</p>
          <p>Total: ${Number(order.totalAmount).toFixed(2)}</p>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                {item.title} x {item.quantity}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AdminPage() {
  const [books, setBooks] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [form, setForm] = React.useState({
    title: '',
    author: '',
    description: '',
    price: '',
    stock: '',
    coverUrl: '',
    category: ''
  });

  const load = async () => {
    const [bookData, orderData] = await Promise.all([api.books(), api.adminOrders()]);
    setBooks(bookData.books);
    setOrders(orderData.orders);
  };

  React.useEffect(() => {
    load();
  }, []);

  return (
    <div className="stack-xl">
      <div className="panel">
        <h1>Admin Dashboard</h1>
        <div className="admin-grid">
          {books.map((book) => (
            <div key={book.id} className="admin-item">
              <strong>{book.title}</strong>
              <p>${book.price.toFixed(2)}</p>
              <button
                onClick={async () => {
                  await api.deleteBook(book.id);
                  load();
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <form
        className="panel auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          await api.createBook({ ...form, price: Number(form.price), stock: Number(form.stock) });
          setForm({ title: '', author: '', description: '', price: '', stock: '', coverUrl: '', category: '' });
          load();
        }}
      >
        <h2>Add Book</h2>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <input placeholder="Cover URL" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} />
        <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <button type="submit">Save Book</button>
      </form>

      <div className="panel">
        <h2>Orders</h2>
        {orders.map((order) => (
          <div key={order.id} className="cart-row">
            <div>
              <strong>Order #{order.id}</strong>
              <p>
                {order.customer_name} - {order.customer_email}
              </p>
              <p>Status: {order.status}</p>
            </div>
            <div className="row">
              <select
                value={order.status}
                onChange={async (e) => {
                  await api.updateOrderStatus(order.id, { status: e.target.value });
                  load();
                }}
              >
                <option value="pending">pending</option>
                <option value="processing">processing</option>
                <option value="shipped">shipped</option>
                <option value="delivered">delivered</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<BooksPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/login" element={<AuthForm mode="login" />} />
        <Route path="/signup" element={<AuthForm mode="signup" />} />
        <Route
          path="/cart"
          element={
            <Protected>
              <CartPage />
            </Protected>
          }
        />
        <Route
          path="/orders"
          element={
            <Protected>
              <OrdersPage />
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminOnly>
              <AdminPage />
            </AdminOnly>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
