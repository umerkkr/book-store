import React from 'react';
import { api } from './api';

function LoginPanel({ onLogin }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api.login({ username, password });
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
    <form className="panel auth-form auth-shell" onSubmit={submit}>
      <span className="eyebrow">Admin access</span>
      <h1>Book Manager</h1>
      <p className="muted">Sign in with the fixed admin account to manage the catalog.</p>
      <p className="muted">If you enter an email anywhere else in the app, use a valid format like <strong>user@gmail.com</strong>.</p>
      {error && <p className="error">{error}</p>}
      <div className="form-stack">
        <div className="field-group">
          <label>Username</label>
          <input placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Password</label>
          <input placeholder="admin" value={password} type="password" onChange={(e) => setPassword(e.target.value)} />
        </div>
      </div>
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
  const [coverMode, setCoverMode] = React.useState(initial?.coverUrl?.startsWith('data:') ? 'upload' : 'url');
  const [coverPreview, setCoverPreview] = React.useState(initial?.coverUrl || '');
  const [coverName, setCoverName] = React.useState('');

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
    setCoverMode(initial?.coverUrl?.startsWith('data:') ? 'upload' : 'url');
    setCoverPreview(initial?.coverUrl || '');
    setCoverName('');
  }, [initial]);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setForm((current) => ({ ...current, coverUrl: dataUrl }));
      setCoverPreview(dataUrl);
      setCoverMode('upload');
      setCoverName(file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form
      className="panel auth-form admin-form"
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
        <div className="field-group"><label>Title</label><input placeholder="Book title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="field-group"><label>Author</label><input placeholder="Author name" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
        <div className="field-group"><label>Category</label><input placeholder="Genre / category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
        <div className="field-group"><label>Price</label><input placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        <div className="field-group"><label>Stock</label><input placeholder="Available copies" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
        <div className="field-group cover-picker-group">
          <div className="field-group-head">
            <label>Cover photo</label>
            <span className="muted">Upload from device or use a direct URL</span>
          </div>
          <div className="row cover-mode-switch">
            <button
              type="button"
              className={coverMode === 'upload' ? '' : 'secondary-button'}
              onClick={() => setCoverMode('upload')}
            >
              Upload from device
            </button>
            <button
              type="button"
              className={coverMode === 'url' ? '' : 'secondary-button'}
              onClick={() => setCoverMode('url')}
            >
              Use image URL
            </button>
          </div>
          {coverMode === 'upload' ? (
            <label className="cover-dropzone">
              <input
                className="cover-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <div className="cover-dropzone-inner">
                <div className="cover-dropzone-copy">
                  <div className="cover-dropzone-icon">+</div>
                  <div>
                    <strong>{coverName || 'Drop or choose a cover image'}</strong>
                    <p>JPG, PNG, WEBP or GIF. Stored in the database and shown to customers.</p>
                  </div>
                </div>
                <div className="cover-dropzone-preview">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover preview" />
                  ) : (
                    <div className="cover-preview-empty small">
                      <div className="cover-preview-empty-icon">IMG</div>
                      <p>Preview appears here after upload</p>
                    </div>
                  )}
                </div>
              </div>
            </label>
          ) : (
            <>
              <input
                placeholder="https://..."
                value={form.coverUrl}
                onChange={(e) => {
                  setForm({ ...form, coverUrl: e.target.value });
                  setCoverPreview(e.target.value);
                }}
              />
              <div className="cover-url-preview">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" />
                ) : (
                  <div className="cover-preview-empty small">
                    <div className="cover-preview-empty-icon">IMG</div>
                    <p>Paste a URL to preview the cover here</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="field-group">
        <label>Description</label>
        <textarea placeholder="Write a short description for the storefront" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="row">
        <button type="submit">{initial ? 'Update Book' : 'Add Book'}</button>
        {initial && (
          <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}

function Dashboard({ onLogout }) {
  const [books, setBooks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingBook, setEditingBook] = React.useState(null);
  const [notice, setNotice] = React.useState('');
  const [recentBook, setRecentBook] = React.useState(null);

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
      const data = await api.updateBook(editingBook.id, payload);
      setEditingBook(null);
      setRecentBook(data.book);
    } else {
      const data = await api.createBook(payload);
      setRecentBook(data.book);
    }
    setNotice('Book saved successfully');
    load();
    window.setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="stack-xl">
      <header className="panel admin-hero">
        <div>
          <span className="eyebrow">Signed in as admin</span>
          <h1>Catalog Manager</h1>
          <p className="muted">Add books, update existing titles, and remove items from the bookstore catalog.</p>
          {notice && <p className="success admin-notice">{notice}</p>}
        </div>
        <div className="admin-quickcards">
          <div className="mini-card"><strong>{books.length}</strong><span>books in catalog</span></div>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      {recentBook && (
        <section className="panel">
          <span className="eyebrow">Recently saved</span>
          <h2>{recentBook.title}</h2>
          <p className="muted">
            {recentBook.author} · {recentBook.category || 'General'} · ${recentBook.price.toFixed(2)}
          </p>
        </section>
      )}

      <BookForm onSave={handleSave} initial={editingBook} onCancel={() => setEditingBook(null)} />

      <section className="panel">
        <h2>Existing Books</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="admin-list">
            {books.map((book) => (
              <article className="admin-item" key={book.id}>
                <div className="admin-book-cover">
                  {book.coverUrl ? <img src={book.coverUrl} alt={book.title} /> : <div className="cover-preview-empty small">No cover</div>}
                </div>
                <div className="book-info">
                  <span className="category-tag">{book.category || 'General'}</span>
                  <h3>{book.title}</h3>
                  <p className="muted">{book.author}</p>
                  <p>${book.price.toFixed(2)} · Stock {book.stock}</p>
                </div>
                <div className="row">
                  <button type="button" onClick={() => setEditingBook(book)}>Edit</button>
                  <button
                    type="button"
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
  if (!user) return <LoginPanel onLogin={setUser} />;

  return <Dashboard onLogout={() => { localStorage.removeItem('token'); setUser(null); }} />;
}
