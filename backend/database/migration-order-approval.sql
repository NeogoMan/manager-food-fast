-- Add order approval fields to orders table

-- Add approved_by column (user_id of who approved)
ALTER TABLE orders ADD COLUMN approved_by INTEGER REFERENCES users(id);

-- Add approved_at timestamp
ALTER TABLE orders ADD COLUMN approved_at DATETIME;

-- Add rejection_reason field
ALTER TABLE orders ADD COLUMN rejection_reason TEXT;

-- Create index for faster queries on approval-related fields
CREATE INDEX IF NOT EXISTS idx_orders_approved_by ON orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_orders_approved_at ON orders(approved_at);
