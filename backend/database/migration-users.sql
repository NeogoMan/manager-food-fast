-- Migration: Add Users Table and Update Orders
-- Date: 2025-10-12
-- Description: Add user authentication and authorization system

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('manager', 'cashier', 'cook', 'client')),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    last_login DATETIME,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Update Orders Table to add user_id
-- Note: SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so we need to check if column exists
-- This will be handled in the JavaScript migration script

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
