-- PostgreSQL Schema for Fast Food Restaurant Management System
-- Migrated from SQLite
-- Date: 2025-10-13

-- Enable UUID extension for future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================
-- TABLE: menu_items
-- ======================
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ======================
-- TABLE: users
-- ======================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK(role IN ('manager', 'cashier', 'cook', 'client')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    last_login TIMESTAMPTZ
);

-- ======================
-- TABLE: orders
-- ======================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    order_id VARCHAR(50) UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK(status IN ('awaiting_approval', 'rejected', 'pending', 'preparing', 'ready', 'completed', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    customer_name VARCHAR(255),
    notes TEXT,
    client_name VARCHAR(255) NOT NULL DEFAULT 'guest',
    caissier_name VARCHAR(255),
    cuisinier_name VARCHAR(255),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ======================
-- TABLE: order_items
-- ======================
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    special_instructions TEXT
);

-- ======================
-- INDEXES
-- ======================

-- Menu items indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_created_at ON menu_items(created_at);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_approved_by ON orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_orders_approved_at ON orders(approved_at);
CREATE INDEX IF NOT EXISTS idx_orders_caissier_name ON orders(caissier_name);
CREATE INDEX IF NOT EXISTS idx_orders_cuisinier_name ON orders(cuisinier_name);
CREATE INDEX IF NOT EXISTS idx_orders_client_name ON orders(client_name);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- ======================
-- FUNCTIONS & TRIGGERS
-- ======================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================
-- COMMENTS
-- ======================
COMMENT ON TABLE menu_items IS 'Menu items available for ordering';
COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON TABLE orders IS 'Customer orders with status tracking';
COMMENT ON TABLE order_items IS 'Line items for each order';

COMMENT ON COLUMN orders.order_id IS 'Public-facing order ID (format: ko-xxxxxxxx)';
COMMENT ON COLUMN orders.order_number IS 'Legacy order number field';
COMMENT ON COLUMN orders.status IS 'Order workflow status';
COMMENT ON COLUMN users.role IS 'User role: manager, cashier, cook, or client';
