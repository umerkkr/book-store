import React from 'react';
import { api } from './api';

function LoginPanel({ onLogin }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api.login({ email, password });
      localStorage.setItem('token', data.token);
      const me = await api.me();
      if (me.user.role !== 'admin') {
        localStorage.removeItem('token');
        setError('Admin access required');
        return;
      }
      onLogin(me.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="panel auth-form" onSubmit={submit}>
      <span className="eyebrow">Admin access</span>
      <h1>Book Manager</h1>
      <p className="muted">Sign in with an admin account to manage the catalog.</p>
      {error && <p className="error">{error}</p>}
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Enter dashboard</button>
    </form>
  );
}

function BookForm({ onSave, initial = null, onCancel }) {
  const [form, setForm] = React.useState(
    initial || {
      title: '',
      author: '',
      description: '',
      price: '',
      stock: '',
      coverUrl: '',
      category: ''
    }
  );

  React.useEffect(() => {
    setForm(
      initial || {
        title: '',
        author: '',
        description: '',
        price: '',
        stock: '',
        coverUrl: '',
        category: ''
      }
    );
  }, [initial]);

  return (
    <form
      className="panel form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock)
        });
      }}
    >
      <h2>{initial ? 'Edit Book' : 'Add Book'}</h2>
      <div className="form-grid">
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <input placeholder="Cover URL" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} />
      </div>
      <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="row">
        <button type="submit">Save Book</button>
        {initial && (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Dashboard({ user, onLogout }) {
  const [books, setBooks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingBook, setEditingBook] = React.useState(null);

  const load = async () => {
    setLoading(true);
    const data = await api.books();
    setBooks(data.books);
    setLoading(false);
  };

  React.useEffect(() => {
    load();
  }, []);

  const handleSave = async (payload) => {
    if (editingBook) {
      await api.updateBook(editingBook.id, payload);
      setEditingBook(null);
    } else {
      await api.createBook(payload);
    }
    load();
  };

  return (
    <div className="stack-xl">
      <header className="dashboard-head panel">
        <div>
          <span className="eyebrow">Signed in as admin</span>
          <h1>Catalog Manager</h1>
          <p className="muted">
            Add books, update existing titles, and remove items from the bookstore catalog.
          </p>
        </div>
        <div className="row">
          <div className="stat">
            <strong>{books.length}</strong>
            <span>books</span>
          </div>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      <BookForm onSave={handleSave} initial={editingBook} onCancel={() => setEditingBook(null)} />

      <section className="panel">
        <h2>Existing Books</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="admin-list">
            {books.map((book) => (
              <article className="admin-item" key={book.id}>
                <div className="book-info">
                  <span className="category-tag">{book.category || 'General'}</span>
                  <h3>{book.title}</h3>
                  <p className="muted">{book.author}</p>
                  <p>${book.price.toFixed(2)} · Stock {book.stock}</p>
                </div>
                <div className="row">
                  <button onClick={() => setEditingBook(book)}>Edit</button>
                  <button
                    className="secondary-button"
                    onClick={async () => {
                      await api.deleteBook(book.id);
                      load();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function App() {
  const [user, setUser] = React.useState(null);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setChecking(false);
      return;
    }
    api
      .me()
      .then((data) => {
        if (data.user.role === 'admin') setUser(data.user);
        else localStorage.removeItem('token');
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <div className="page-center">Loading...</div>;

  if (!user) {
    return <LoginPanel onLogin={setUser} />;
  }

  return <Dashboard user={user} onLogout={() => { localStorage.removeItem('token'); setUser(null); }} />;
}
