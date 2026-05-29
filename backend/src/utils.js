export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export function serializeBook(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description,
    price: Number(row.price),
    stock: row.stock,
    coverUrl: row.cover_url,
    category: row.category
  };
}
