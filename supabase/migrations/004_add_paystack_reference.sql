-- Add paystack_reference column to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS paystack_reference TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_reference 
ON subscriptions(paystack_reference);

-- Add any missing columns to payments table to ensure consistency
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS paystack_reference TEXT;

-- Update the payments table to ensure paystack_reference is unique
ALTER TABLE payments
ADD CONSTRAINT IF NOT EXISTS unique_paystack_reference UNIQUE (paystack_reference);
