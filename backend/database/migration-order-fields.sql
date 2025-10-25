-- Migration: Add Order Fields for ko-xxxxxxxx ID and Staff Names
-- Date: 2025-10-12
-- Description: Add order_id, caissier_name, cuisinier_name, client_name fields

-- Add order_id column (format: ko-xxxxxxxx)
ALTER TABLE orders ADD COLUMN order_id TEXT;

-- Add caissier_name (cashier who created the order)
ALTER TABLE orders ADD COLUMN caissier_name TEXT;

-- Add cuisinier_name (cook who prepared the order)
ALTER TABLE orders ADD COLUMN cuisinier_name TEXT;

-- Add client_name (client name or "guest")
ALTER TABLE orders ADD COLUMN client_name TEXT NOT NULL DEFAULT 'guest';

-- Create unique index on order_id for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_id ON orders(order_id);

-- Note: 'notes' field already exists in the orders table
