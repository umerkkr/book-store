import React from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';
import { api } from './api';

function Layout({ children }) {
  const auth = useAuth();
  const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5175';

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="brand">BookNest</span>
        <nav className="nav">
          <Link to="/">Books</Link>
          {auth.user && <Link to="/cart">Cart</Link>}
          {auth.user && <Link to="/orders">Orders</Link>}
          {auth.user?.role === 'admin' && (
            <a href={adminUrl} target="_blank" rel="noreferrer">Admin Books</a>
          )}
          {auth.user ? <button onClick={auth.logout}>Logout</button> : <Link to="/login">Login</Link>}
          {!auth.user && <Link to="/signup">Sign up</Link>}
        </nav>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  React.useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => onDismiss(), 2800);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className={`toast ${toast.type || 'info'}`}>
      <div className="toast-icon">{toast.type === 'success' ? '✓' : 'i'}</div>
      <div>
        <strong>{toast.title}</strong>
        {toast.message && <p>{toast.message}</p>}
      </div>
      <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss notification">
        ×
      </button>
    </div>
  );
}

function Protected({ children }) {
  const auth = useAuth();
  if (!auth.loading && !auth.user) return <Navigate to="/login" replace />;
  return children;
}

function BooksPage({ showToast }) {
  const [books, setBooks] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState('All');
  const [cartPreview, setCartPreview] = React.useState([]);
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

  const loadCart = async () => {
    if (!auth.user) {
      setCartPreview([]);
      return;
    }
    const data = await api.cart();
    setCartPreview(data.items);
  };

  React.useEffect(() => {
    load();
    loadCart();
  }, []);

  React.useEffect(() => {
    const onCartChanged = () => load(q, activeFilter === 'All' ? '' : activeFilter);
    const onCartPreviewChanged = () => loadCart();
    window.addEventListener('booknest:cart-updated', onCartChanged);
    window.addEventListener('booknest:cart-updated', onCartPreviewChanged);
    return () => {
      window.removeEventListener('booknest:cart-updated', onCartChanged);
      window.removeEventListener('booknest:cart-updated', onCartPreviewChanged);
    };
  }, [q, activeFilter, auth.user]);

  const categories = ['All', 'Programming', 'Finance', 'Productivity', 'Fiction', 'Psychology', 'Self Help'];

  return (
    <div className="stack-xl">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Curated reading, faster discovery</span>
          <h1>Find your next great book in a store that feels alive.</h1>
          <p>
            Browse hand-picked titles, search by book name or author, and add favorites to cart in a clean premium interface.
          </p>
          <div className="hero-actions">
            <button type="button" onClick={() => document.getElementById('book-search')?.focus()}>Search books</button>
            <Link to={auth.user ? '/cart' : '/signup'} className="ghost-button">
              {auth.user ? 'Go to cart' : 'Create account'}
            </Link>
          </div>
          <div className="hero-stats">
            <div><strong>{books.length}</strong><span>books available</span></div>
            <div><strong>COD</strong><span>cash on delivery</span></div>
            <div><strong>Fast</strong><span>search and checkout</span></div>
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
          <input id="book-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by book name or author" />
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

      {auth.user && (
        <section className="panel cart-preview">
          <div className="cart-preview-head">
            <div>
              <span className="eyebrow">Live cart</span>
              <h2>Your selected books</h2>
            </div>
            <Link to="/cart" className="ghost-link">Open cart</Link>
          </div>
          {cartPreview.length === 0 ? (
            <p className="muted">No books in cart yet. Add any title and it will appear here immediately.</p>
          ) : (
            <div className="cart-preview-list">
              {cartPreview.slice(0, 3).map((item) => (
                <div key={item.id} className="cart-preview-row">
                  <div>
                    <strong>{item.book.title}</strong>
                    <p className="muted">{item.quantity} item(s)</p>
                  </div>
                  <strong>${(item.book.price * item.quantity).toFixed(2)}</strong>
                </div>
              ))}
              <div className="cart-preview-footer">
                <span>Total</span>
                <strong>${cartPreview.reduce((sum, item) => sum + item.book.price * item.quantity, 0).toFixed(2)}</strong>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="section-head">
        <div>
          <span className="eyebrow">Featured catalog</span>
          <h2>Browse books by title, author, or category</h2>
        </div>
        <p className="muted">A warm storefront with clear spacing, strong hierarchy, and quick actions.</p>
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
                <Link to={`/books/${book.id}`} className="ghost-link">View details</Link>
                {auth.user && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.addToCart({ bookId: book.id, quantity: 1 });
                        window.dispatchEvent(new Event('booknest:cart-updated'));
                        showToast('Added to cart', book.title, 'success');
                      } catch (error) {
                        showToast('Could not add book', error.message || 'Please try again', 'error');
                      }
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

function BookDetailPage({ showToast }) {
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
            type="button"
            onClick={async () => {
              try {
                await api.addToCart({ bookId: book.id, quantity });
                window.dispatchEvent(new Event('booknest:cart-updated'));
                showToast('Added to cart', book.title, 'success');
              } catch (error) {
                showToast('Could not add book', error.message || 'Please try again', 'error');
              }
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
    <form className="panel auth-form auth-shell" onSubmit={submit}>
      <span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create your account'}</span>
      <h1>{mode === 'login' ? 'Login' : 'Sign up'}</h1>
      <p className="muted">Use a valid email like <strong>user@gmail.com</strong>.</p>
      {error && <p className="error">{error}</p>}
      <div className="form-stack">
        {mode === 'signup' && (
          <div className="field-group">
            <label>Name</label>
            <input placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
        )}
        {mode === 'signup' && (
          <div className="field-group">
            <label>Admin invite code</label>
            <input
              placeholder="Optional"
              value={form.adminCode}
              onChange={(e) => setForm({ ...form, adminCode: e.target.value })}
            />
          </div>
        )}
        <div className="field-group">
          <label>Email</label>
          <input
            placeholder="you@gmail.com"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="field-group">
          <label>Password</label>
          <input
            placeholder="Password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
      </div>
      <button type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
    </form>
  );
}

function CartPage({ showToast }) {
  const [cart, setCart] = React.useState([]);
  const [shipping, setShipping] = React.useState({ shippingName: '', shippingPhone: '', shippingAddress: '' });
  const [message, setMessage] = React.useState('');
  const [invoice, setInvoice] = React.useState(null);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);

  const load = async () => {
    const data = await api.cart();
    setCart(data.items);
  };

  React.useEffect(() => {
    load();
  }, []);

  React.useEffect(() => {
    const onCartChanged = () => load();
    window.addEventListener('booknest:cart-updated', onCartChanged);
    return () => window.removeEventListener('booknest:cart-updated', onCartChanged);
  }, []);

  const total = cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0);

  return (
    <div className="stack-xl">
      <div className="panel">
        <h1>Cart</h1>
        {cart.length === 0 ? (
          <p>Your cart is empty. Add a few books from the catalog to build your order.</p>
        ) : (
          <div className="stack">
            {cart.map((item) => (
              <div key={item.id} className="order-row">
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
                    type="button"
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
        className="panel auth-form checkout-shell"
        onSubmit={async (e) => {
          e.preventDefault();
          setMessage('');
          try {
            const data = await api.createOrder(shipping);
            setInvoice(data?.order ?? null);
            setMessage('Order placed successfully. Cash on delivery invoice generated.');
            setConfirmationOpen(true);
            showToast('Order placed', `Invoice ${data?.order?.invoiceNumber || ''}`, 'success');
            setShipping({ shippingName: '', shippingPhone: '', shippingAddress: '' });
            await load();
            window.dispatchEvent(new Event('booknest:cart-updated'));
          } catch (error) {
            setMessage(error.message || 'Unable to place order');
          }
        }}
      >
        <h2>Checkout</h2>
        {message && <p className="success">{message}</p>}
        <div className="form-stack">
          <div className="field-group">
            <label>Recipient name</label>
            <input
              placeholder="Full name"
              value={shipping.shippingName}
              onChange={(e) => setShipping({ ...shipping, shippingName: e.target.value })}
            />
          </div>
          <div className="field-group">
            <label>Phone</label>
            <input
              placeholder="03xx-xxxxxxx"
              value={shipping.shippingPhone}
              onChange={(e) => setShipping({ ...shipping, shippingPhone: e.target.value })}
            />
          </div>
          <div className="field-group">
            <label>Shipping address</label>
            <textarea
              placeholder="Complete address"
              value={shipping.shippingAddress}
              onChange={(e) => setShipping({ ...shipping, shippingAddress: e.target.value })}
            />
          </div>
        </div>
        <button type="submit">Place cash-on-delivery order</button>
      </form>

      {invoice && (
        <section className="panel invoice-card">
          <div className="invoice-head">
            <div>
              <span className="eyebrow">Invoice</span>
              <h2>{invoice.invoiceNumber}</h2>
            </div>
            <div className="invoice-badge">Cash on delivery</div>
          </div>
          <div className="invoice-grid">
            <div>
              <p><strong>Customer:</strong> {invoice.shippingName}</p>
              <p><strong>Phone:</strong> {invoice.shippingPhone}</p>
              <p><strong>Address:</strong> {invoice.shippingAddress}</p>
            </div>
            <div>
              <p><strong>Payment:</strong> {invoice.paymentMethod}</p>
              <p><strong>Total:</strong> ${invoice.totalAmount.toFixed(2)}</p>
              <p><strong>Status:</strong> pending</p>
            </div>
          </div>
          <div className="invoice-items">
            {(invoice.items || []).map((item) => (
              <div key={item.id} className="invoice-line">
                <span>{item.title} x {item.quantity}</span>
                <span>${item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {confirmationOpen && invoice && (
        <div className="order-modal-backdrop" role="presentation" onClick={() => setConfirmationOpen(false)}>
          <div className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-confirmation-title" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-hero">
              <div className="order-modal-icon">✓</div>
              <div>
                <span className="eyebrow">Order placed</span>
                <h2 id="order-confirmation-title">Your cash on delivery order is confirmed</h2>
                <p className="muted">Invoice {invoice.invoiceNumber} has been generated and your cart is now ready for the next order.</p>
              </div>
            </div>

            <div className="order-modal-grid">
              <div className="order-modal-card">
                <span className="muted">Customer</span>
                <strong>{invoice.shippingName}</strong>
              </div>
              <div className="order-modal-card">
                <span className="muted">Total</span>
                <strong>${invoice.totalAmount.toFixed(2)}</strong>
              </div>
              <div className="order-modal-card">
                <span className="muted">Payment</span>
                <strong>{invoice.paymentMethod}</strong>
              </div>
              <div className="order-modal-card">
                <span className="muted">Status</span>
                <strong>Pending</strong>
              </div>
            </div>

            <div className="order-modal-items">
              {(invoice.items || []).map((item) => (
                <div key={item.id} className="order-modal-line">
                  <span>{item.title} x {item.quantity}</span>
                  <strong>${item.lineTotal.toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div className="row order-modal-actions">
              <button type="button" onClick={() => setConfirmationOpen(false)}>Continue shopping</button>
              <Link to="/orders" className="ghost-button" onClick={() => setConfirmationOpen(false)}>View orders</Link>
            </div>
          </div>
        </div>
      )}
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
        <div key={order.id} className="order-row panel">
          <div>
            <strong>Order #{order.id}</strong>
            <p>Status: {order.status}</p>
            <p>Total: ${Number(order.totalAmount).toFixed(2)}</p>
          </div>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>{item.title} x {item.quantity}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [toast, setToast] = React.useState(null);

  const showToast = React.useCallback((title, message = '', type = 'info') => {
    setToast({ title, message, type });
  }, []);

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<BooksPage showToast={showToast} />} />
          <Route path="/books/:id" element={<BookDetailPage showToast={showToast} />} />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/signup" element={<AuthForm mode="signup" />} />
          <Route path="/cart" element={<Protected><CartPage showToast={showToast} /></Protected>} />
          <Route path="/orders" element={<Protected><OrdersPage /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
