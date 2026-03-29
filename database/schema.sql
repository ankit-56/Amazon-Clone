-- Amazon Clone — PostgreSQL schema (assignment-ready relational model)

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(30),
  password_hash VARCHAR(255), -- Nullable for OAuth-only users
  google_id VARCHAR(255) UNIQUE,
  github_id VARCHAR(255) UNIQUE,
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  specifications JSONB DEFAULT '[]'::jsonb,
  price_rupees INTEGER NOT NULL CHECK (price_rupees >= 0),
  mrp_rupees INTEGER,
  discount_label VARCHAR(32),
  value_display VARCHAR(64),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(512) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cart_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(48) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(40) NOT NULL DEFAULT 'placed',
  subtotal_paise BIGINT NOT NULL,
  total_paise BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shipping_full_name VARCHAR(200) NOT NULL,
  shipping_phone VARCHAR(40) NOT NULL,
  shipping_line1 VARCHAR(400) NOT NULL,
  shipping_line2 VARCHAR(400),
  shipping_city VARCHAR(120) NOT NULL,
  shipping_state VARCHAR(120) NOT NULL,
  shipping_postal VARCHAR(32) NOT NULL,
  shipping_country VARCHAR(120) NOT NULL DEFAULT 'India'
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price_rupees INTEGER NOT NULL,
  image_url VARCHAR(512)
);

CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlists(user_id);

ALTER TABLE products ADD CONSTRAINT mrp_rupees_check CHECK (mrp_rupees >= 0);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products ((LOWER(name)));
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
